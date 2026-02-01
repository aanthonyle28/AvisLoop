'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { contactSchema } from '@/lib/validations/contact'
import { escapeLikePattern } from '@/lib/utils'
import type { Contact } from '@/lib/types/database'

export type ContactActionState = {
  error?: string
  fieldErrors?: Record<string, string[]>
  success?: boolean
  data?: { id: string }  // Return ID for created/updated contacts
}

export type BulkCreateResult = {
  error?: string
  success?: boolean
  data?: {
    created: number
    skipped: number
    duplicates: string[]  // List of duplicate emails that were skipped
  }
}

/**
 * Find or create a contact by email.
 * Used by Quick Send to auto-create contacts on-the-fly.
 */
export async function findOrCreateContact({
  email,
  name,
  businessId,
}: {
  email: string
  name: string
  businessId: string
}): Promise<ContactActionState> {
  const supabase = await createClient()

  // Validate user authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'You must be logged in' }
  }

  const normalizedEmail = email.toLowerCase()

  // Check for existing contact
  const { data: existingContact } = await supabase
    .from('contacts')
    .select('id')
    .eq('business_id', businessId)
    .eq('email', normalizedEmail)
    .single()

  if (existingContact) {
    return { success: true, data: { id: existingContact.id } }
  }

  // Create new contact
  const { data: newContact, error } = await supabase
    .from('contacts')
    .insert({
      business_id: businessId,
      name,
      email: normalizedEmail,
      phone: null,
      status: 'active',
      send_count: 0,
    })
    .select('id')
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/contacts')
  revalidatePath('/send')
  return { success: true, data: { id: newContact.id } }
}

/**
 * Create a new contact for the user's business.
 * Checks for duplicate emails within the same business.
 */
export async function createContact(
  _prevState: ContactActionState | null,
  formData: FormData
): Promise<ContactActionState> {
  const supabase = await createClient()

  // Validate user authentication using getUser() (not getSession - security best practice)
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'You must be logged in to create contacts' }
  }

  // Get user's business (required - must have business before creating contacts)
  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (businessError || !business) {
    return { error: 'Please create a business profile first' }
  }

  // Parse and validate input
  const parsed = contactSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone') || '',
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const { name, email, phone } = parsed.data

  // Lowercase email for duplicate check and storage
  const normalizedEmail = email.toLowerCase()

  // Check for duplicate email within this business
  const { data: existingContact } = await supabase
    .from('contacts')
    .select('id')
    .eq('business_id', business.id)
    .eq('email', normalizedEmail)
    .single()

  if (existingContact) {
    return {
      fieldErrors: {
        email: ['A contact with this email already exists']
      }
    }
  }

  // Insert new contact
  const { data: newContact, error } = await supabase
    .from('contacts')
    .insert({
      business_id: business.id,
      name,
      email: normalizedEmail,
      phone: phone || null,
      status: 'active',
      send_count: 0,
    })
    .select('id')
    .single()

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/contacts')
  return { success: true, data: { id: newContact.id } }
}

/**
 * Update an existing contact.
 * Checks for duplicate emails (excluding current contact).
 */
export async function updateContact(
  _prevState: ContactActionState | null,
  formData: FormData
): Promise<ContactActionState> {
  const supabase = await createClient()

  // Validate user authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'You must be logged in to update contacts' }
  }

  // Get user's business
  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (businessError || !business) {
    return { error: 'Please create a business profile first' }
  }

  // Extract contact ID
  const contactId = formData.get('contactId') as string
  if (!contactId) {
    return { error: 'Contact ID is required' }
  }

  // Parse and validate input
  const parsed = contactSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone') || '',
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const { name, email, phone } = parsed.data

  // Lowercase email for duplicate check and storage
  const normalizedEmail = email.toLowerCase()

  // Check for duplicate email within this business (excluding current contact)
  const { data: existingContact } = await supabase
    .from('contacts')
    .select('id')
    .eq('business_id', business.id)
    .eq('email', normalizedEmail)
    .neq('id', contactId)
    .single()

  if (existingContact) {
    return {
      fieldErrors: {
        email: ['A contact with this email already exists']
      }
    }
  }

  // Update contact (RLS handles ownership check)
  const { error } = await supabase
    .from('contacts')
    .update({
      name,
      email: normalizedEmail,
      phone: phone || null,
    })
    .eq('id', contactId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/contacts')
  return { success: true, data: { id: contactId } }
}

/**
 * Archive a contact (soft delete).
 */
export async function archiveContact(
  contactId: string
): Promise<ContactActionState> {
  const supabase = await createClient()

  // Validate user authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'You must be logged in to archive contacts' }
  }

  // Update contact status (RLS handles ownership check)
  const { error } = await supabase
    .from('contacts')
    .update({ status: 'archived' })
    .eq('id', contactId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/contacts')
  return { success: true }
}

/**
 * Restore an archived contact.
 */
export async function restoreContact(
  contactId: string
): Promise<ContactActionState> {
  const supabase = await createClient()

  // Validate user authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'You must be logged in to restore contacts' }
  }

  // Update contact status (RLS handles ownership check)
  const { error } = await supabase
    .from('contacts')
    .update({ status: 'active' })
    .eq('id', contactId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/contacts')
  return { success: true }
}

/**
 * Permanently delete a contact.
 */
export async function deleteContact(
  contactId: string
): Promise<ContactActionState> {
  const supabase = await createClient()

  // Validate user authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'You must be logged in to delete contacts' }
  }

  // Delete contact (RLS handles ownership check)
  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', contactId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/contacts')
  return { success: true }
}

/**
 * Archive multiple contacts at once.
 */
export async function bulkArchiveContacts(
  contactIds: string[]
): Promise<ContactActionState> {
  const supabase = await createClient()

  // Validate user authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'You must be logged in to archive contacts' }
  }

  if (!contactIds || contactIds.length === 0) {
    return { error: 'No contacts selected' }
  }

  if (contactIds.length > 100) {
    return { error: 'Cannot archive more than 100 contacts at once' }
  }

  // Update all contacts to archived (RLS handles ownership check)
  const { error } = await supabase
    .from('contacts')
    .update({ status: 'archived' })
    .in('id', contactIds)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/contacts')
  return { success: true }
}

/**
 * Delete multiple contacts at once.
 */
export async function bulkDeleteContacts(
  contactIds: string[]
): Promise<ContactActionState> {
  const supabase = await createClient()

  // Validate user authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'You must be logged in to delete contacts' }
  }

  if (!contactIds || contactIds.length === 0) {
    return { error: 'No contacts selected' }
  }

  if (contactIds.length > 100) {
    return { error: 'Cannot delete more than 100 contacts at once' }
  }

  // Delete all contacts (RLS handles ownership check)
  const { error } = await supabase
    .from('contacts')
    .delete()
    .in('id', contactIds)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/contacts')
  return { success: true }
}

/**
 * Create multiple contacts from CSV import.
 * Skips duplicates and returns summary of created/skipped contacts.
 */
export async function bulkCreateContacts(
  contacts: Array<{ name: string; email: string; phone?: string }>
): Promise<BulkCreateResult> {
  const supabase = await createClient()

  // Validate user authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'You must be logged in to import contacts' }
  }

  // Get user's business
  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (businessError || !business) {
    return { error: 'Please create a business profile first' }
  }

  if (!contacts || contacts.length === 0) {
    return { error: 'No contacts provided' }
  }

  if (contacts.length > 100) {
    return { error: 'Cannot import more than 100 contacts at once' }
  }

  // Lowercase all emails
  const normalizedContacts = contacts.map(c => ({
    ...c,
    email: c.email.toLowerCase()
  }))

  // Fetch existing emails for this business
  const { data: existingContacts } = await supabase
    .from('contacts')
    .select('email')
    .eq('business_id', business.id)

  const existingEmails = new Set(
    (existingContacts || []).map(c => c.email.toLowerCase())
  )

  // Filter out duplicates
  const duplicates: string[] = []
  const contactsToInsert = normalizedContacts.filter(contact => {
    if (existingEmails.has(contact.email)) {
      duplicates.push(contact.email)
      return false
    }
    return true
  })

  // Insert remaining contacts
  if (contactsToInsert.length > 0) {
    const { error } = await supabase
      .from('contacts')
      .insert(
        contactsToInsert.map(c => ({
          business_id: business.id,
          name: c.name,
          email: c.email,
          phone: c.phone || null,
          status: 'active',
          send_count: 0,
        }))
      )

    if (error) {
      return { error: error.message }
    }
  }

  revalidatePath('/dashboard/contacts')
  return {
    success: true,
    data: {
      created: contactsToInsert.length,
      skipped: duplicates.length,
      duplicates
    }
  }
}

/**
 * Fetch contacts for the current user's business with pagination.
 * For use in Server Components.
 */
export async function getContacts(options?: {
  limit?: number
  offset?: number
}): Promise<{ contacts: Contact[]; total: number }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { contacts: [], total: 0 }
  }

  // Get user's business first
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!business) {
    return { contacts: [], total: 0 }
  }

  const limit = options?.limit ?? 50
  const offset = options?.offset ?? 0

  // Get total count first
  const { count } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', business.id)

  // Fetch paginated contacts ordered by last_sent_at DESC NULLS LAST, then created_at DESC
  const { data: contacts } = await supabase
    .from('contacts')
    .select('*')
    .eq('business_id', business.id)
    .order('last_sent_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  return { contacts: contacts || [], total: count || 0 }
}

/**
 * Search contacts by name or email with optional filters.
 */
export async function searchContacts(
  query: string,
  filters?: {
    status?: string
    dateFrom?: Date
    dateTo?: Date
  }
): Promise<Contact[]> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return []
  }

  // Get user's business first
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!business) {
    return []
  }

  // Build query
  let queryBuilder = supabase
    .from('contacts')
    .select('*')
    .eq('business_id', business.id)

  // Search by name or email if query provided
  if (query) {
    const escapedQuery = escapeLikePattern(query)
    queryBuilder = queryBuilder.or(`name.ilike.%${escapedQuery}%,email.ilike.%${escapedQuery}%`)
  }

  // Apply status filter
  if (filters?.status) {
    queryBuilder = queryBuilder.eq('status', filters.status)
  }

  // Apply date range filters
  if (filters?.dateFrom) {
    queryBuilder = queryBuilder.gte('created_at', filters.dateFrom.toISOString())
  }
  if (filters?.dateTo) {
    queryBuilder = queryBuilder.lte('created_at', filters.dateTo.toISOString())
  }

  // Order by last_sent_at DESC NULLS LAST, then created_at DESC
  queryBuilder = queryBuilder
    .order('last_sent_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  const { data: contacts } = await queryBuilder

  return contacts || []
}
