'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { customerSchema } from '@/lib/validations/customer'
import { escapeLikePattern } from '@/lib/utils'
import type { Customer } from '@/lib/types/database'

export type CustomerActionState = {
  error?: string
  fieldErrors?: Record<string, string[]>
  success?: boolean
  data?: { id: string }  // Return ID for created/updated customers
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
 * Find or create a customer by email.
 * Used by Quick Send to auto-create customers on-the-fly.
 */
export async function findOrCreateCustomer({
  email,
  name,
  businessId,
}: {
  email: string
  name: string
  businessId: string
}): Promise<CustomerActionState> {
  const supabase = await createClient()

  // Validate user authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'You must be logged in' }
  }

  const normalizedEmail = email.toLowerCase()

  // Check for existing customer
  const { data: existingCustomer } = await supabase
    .from('customers')
    .select('id')
    .eq('business_id', businessId)
    .eq('email', normalizedEmail)
    .single()

  if (existingCustomer) {
    return { success: true, data: { id: existingCustomer.id } }
  }

  // Create new customer
  const { data: newCustomer, error } = await supabase
    .from('customers')
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

  revalidatePath('/customers')
  revalidatePath('/send')
  return { success: true, data: { id: newCustomer.id } }
}

/**
 * Create a new customer for the user's business.
 * Checks for duplicate emails within the same business.
 */
export async function createCustomer(
  _prevState: CustomerActionState | null,
  formData: FormData
): Promise<CustomerActionState> {
  const supabase = await createClient()

  // Validate user authentication using getUser() (not getSession - security best practice)
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'You must be logged in to create customers' }
  }

  // Get user's business (required - must have business before creating customers)
  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (businessError || !business) {
    return { error: 'Please create a business profile first' }
  }

  // Parse and validate input
  const parsed = customerSchema.safeParse({
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
  const { data: existingCustomer } = await supabase
    .from('customers')
    .select('id')
    .eq('business_id', business.id)
    .eq('email', normalizedEmail)
    .single()

  if (existingCustomer) {
    return {
      fieldErrors: {
        email: ['A customer with this email already exists']
      }
    }
  }

  // Insert new customer
  const { data: newCustomer, error } = await supabase
    .from('customers')
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

  revalidatePath('/customers')
  return { success: true, data: { id: newCustomer.id } }
}

/**
 * Update an existing customer.
 * Checks for duplicate emails (excluding current customer).
 */
export async function updateCustomer(
  _prevState: CustomerActionState | null,
  formData: FormData
): Promise<CustomerActionState> {
  const supabase = await createClient()

  // Validate user authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'You must be logged in to update customers' }
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

  // Extract customer ID
  const customerId = formData.get('customerId') as string
  if (!customerId) {
    return { error: 'Customer ID is required' }
  }

  // Parse and validate input
  const parsed = customerSchema.safeParse({
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

  // Check for duplicate email within this business (excluding current customer)
  const { data: existingCustomer } = await supabase
    .from('customers')
    .select('id')
    .eq('business_id', business.id)
    .eq('email', normalizedEmail)
    .neq('id', customerId)
    .single()

  if (existingCustomer) {
    return {
      fieldErrors: {
        email: ['A customer with this email already exists']
      }
    }
  }

  // Update customer (RLS handles ownership check)
  const { error } = await supabase
    .from('customers')
    .update({
      name,
      email: normalizedEmail,
      phone: phone || null,
    })
    .eq('id', customerId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/customers')
  return { success: true, data: { id: customerId } }
}

/**
 * Archive a customer (soft delete).
 */
export async function archiveCustomer(
  customerId: string
): Promise<CustomerActionState> {
  const supabase = await createClient()

  // Validate user authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'You must be logged in to archive customers' }
  }

  // Update customer status (RLS handles ownership check)
  const { error } = await supabase
    .from('customers')
    .update({ status: 'archived' })
    .eq('id', customerId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/customers')
  return { success: true }
}

/**
 * Restore an archived customer.
 */
export async function restoreCustomer(
  customerId: string
): Promise<CustomerActionState> {
  const supabase = await createClient()

  // Validate user authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'You must be logged in to restore customers' }
  }

  // Update customer status (RLS handles ownership check)
  const { error } = await supabase
    .from('customers')
    .update({ status: 'active' })
    .eq('id', customerId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/customers')
  return { success: true }
}

/**
 * Permanently delete a customer.
 */
export async function deleteCustomer(
  customerId: string
): Promise<CustomerActionState> {
  const supabase = await createClient()

  // Validate user authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'You must be logged in to delete customers' }
  }

  // Delete customer (RLS handles ownership check)
  const { error } = await supabase
    .from('customers')
    .delete()
    .eq('id', customerId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/customers')
  return { success: true }
}

/**
 * Archive multiple customers at once.
 */
export async function bulkArchiveCustomers(
  customerIds: string[]
): Promise<CustomerActionState> {
  const supabase = await createClient()

  // Validate user authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'You must be logged in to archive customers' }
  }

  if (!customerIds || customerIds.length === 0) {
    return { error: 'No customers selected' }
  }

  if (customerIds.length > 100) {
    return { error: 'Cannot archive more than 100 customers at once' }
  }

  // Update all customers to archived (RLS handles ownership check)
  const { error } = await supabase
    .from('customers')
    .update({ status: 'archived' })
    .in('id', customerIds)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/customers')
  return { success: true }
}

/**
 * Delete multiple customers at once.
 */
export async function bulkDeleteCustomers(
  customerIds: string[]
): Promise<CustomerActionState> {
  const supabase = await createClient()

  // Validate user authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'You must be logged in to delete customers' }
  }

  if (!customerIds || customerIds.length === 0) {
    return { error: 'No customers selected' }
  }

  if (customerIds.length > 100) {
    return { error: 'Cannot delete more than 100 customers at once' }
  }

  // Delete all customers (RLS handles ownership check)
  const { error } = await supabase
    .from('customers')
    .delete()
    .in('id', customerIds)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/customers')
  return { success: true }
}

/**
 * Create multiple customers from CSV import.
 * Skips duplicates and returns summary of created/skipped customers.
 */
export async function bulkCreateCustomers(
  customers: Array<{ name: string; email: string; phone?: string }>
): Promise<BulkCreateResult> {
  const supabase = await createClient()

  // Validate user authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'You must be logged in to import customers' }
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

  if (!customers || customers.length === 0) {
    return { error: 'No customers provided' }
  }

  if (customers.length > 100) {
    return { error: 'Cannot import more than 100 customers at once' }
  }

  // Lowercase all emails
  const normalizedCustomers = customers.map(c => ({
    ...c,
    email: c.email.toLowerCase()
  }))

  // Fetch existing emails for this business
  const { data: existingCustomers } = await supabase
    .from('customers')
    .select('email')
    .eq('business_id', business.id)

  const existingEmails = new Set(
    (existingCustomers || []).map(c => c.email.toLowerCase())
  )

  // Filter out duplicates
  const duplicates: string[] = []
  const customersToInsert = normalizedCustomers.filter(customer => {
    if (existingEmails.has(customer.email)) {
      duplicates.push(customer.email)
      return false
    }
    return true
  })

  // Insert remaining customers
  if (customersToInsert.length > 0) {
    const { error } = await supabase
      .from('customers')
      .insert(
        customersToInsert.map(c => ({
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

  revalidatePath('/customers')
  return {
    success: true,
    data: {
      created: customersToInsert.length,
      skipped: duplicates.length,
      duplicates
    }
  }
}

/**
 * Fetch customers for the current user's business with pagination.
 * For use in Server Components.
 */
export async function getCustomers(options?: {
  limit?: number
  offset?: number
}): Promise<{ customers: Customer[]; total: number }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { customers: [], total: 0 }
  }

  // Get user's business first
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!business) {
    return { customers: [], total: 0 }
  }

  const limit = options?.limit ?? 50
  const offset = options?.offset ?? 0

  // Get total count first
  const { count } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', business.id)

  // Fetch paginated customers ordered by last_sent_at DESC NULLS LAST, then created_at DESC
  const { data: customers } = await supabase
    .from('customers')
    .select('*')
    .eq('business_id', business.id)
    .order('last_sent_at', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  return { customers: customers || [], total: count || 0 }
}

/**
 * Update customer notes field.
 */
export async function updateCustomerNotes(
  customerId: string,
  notes: string
): Promise<CustomerActionState> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'You must be logged in' }
  }

  // Validate inputs
  if (!customerId || typeof customerId !== 'string') {
    return { error: 'Invalid customer ID' }
  }
  if (typeof notes !== 'string' || notes.length > 10000) {
    return { error: 'Notes must be under 10,000 characters' }
  }

  // Update notes (RLS handles ownership check)
  const { error } = await supabase
    .from('customers')
    .update({ notes })
    .eq('id', customerId)

  if (error) {
    console.error('Failed to update customer notes:', error)
    return { error: 'Failed to save notes' }
  }

  revalidatePath('/customers')
  return { success: true }
}

/**
 * Search customers by name or email with optional filters.
 */
export async function searchCustomers(
  query: string,
  filters?: {
    status?: string
    dateFrom?: Date
    dateTo?: Date
  }
): Promise<Customer[]> {
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
    .from('customers')
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

  const { data: customers } = await queryBuilder

  return customers || []
}

/**
 * Update customer SMS consent status.
 */
export async function updateCustomerSmsConsent(
  customerId: string,
  consent: {
    status: 'opted_in' | 'opted_out'
    method?: string
    notes?: string
    ip?: string
  }
): Promise<CustomerActionState> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'You must be logged in' }
  }

  const { error } = await supabase
    .from('customers')
    .update({
      sms_consent_status: consent.status,
      sms_consent_at: new Date().toISOString(),
      sms_consent_method: consent.method || null,
      sms_consent_notes: consent.notes || null,
      sms_consent_ip: consent.ip || null,
      sms_consent_captured_by: user.id,
      sms_consent_source: 'manual',
    })
    .eq('id', customerId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/customers')
  return { success: true }
}

/**
 * Update customer tags.
 */
export async function updateCustomerTags(
  customerId: string,
  tags: string[]
): Promise<CustomerActionState> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'You must be logged in' }
  }

  if (tags.length > 5) {
    return { error: 'Maximum 5 tags allowed' }
  }

  const { error } = await supabase
    .from('customers')
    .update({ tags })
    .eq('id', customerId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/customers')
  return { success: true }
}
