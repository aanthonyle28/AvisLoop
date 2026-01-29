'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { businessSchema, emailTemplateSchema } from '@/lib/validations/business'

export type BusinessActionState = {
  error?: string
  fieldErrors?: Record<string, string[]>
  success?: boolean
}

/**
 * Create or update the user's business profile.
 * Uses upsert pattern: if business exists, update it; otherwise create new.
 */
export async function updateBusiness(
  _prevState: BusinessActionState | null,
  formData: FormData
): Promise<BusinessActionState> {
  const supabase = await createClient()

  // Validate user authentication using getUser() (not getSession - security best practice)
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'You must be logged in to update business settings' }
  }

  // Parse and validate input
  const parsed = businessSchema.safeParse({
    name: formData.get('name'),
    googleReviewLink: formData.get('googleReviewLink') || '',
    defaultSenderName: formData.get('defaultSenderName') || '',
    defaultTemplateId: formData.get('defaultTemplateId') || '',
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const { name, googleReviewLink, defaultSenderName, defaultTemplateId } = parsed.data

  // Check for existing business (one per user for MVP)
  const { data: existingBusiness } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (existingBusiness) {
    // Update existing business
    const { error } = await supabase
      .from('businesses')
      .update({
        name,
        google_review_link: googleReviewLink || null,
        default_sender_name: defaultSenderName || null,
        default_template_id: defaultTemplateId || null,
      })
      .eq('id', existingBusiness.id)

    if (error) {
      return { error: error.message }
    }
  } else {
    // Create new business
    const { error } = await supabase
      .from('businesses')
      .insert({
        user_id: user.id,
        name,
        google_review_link: googleReviewLink || null,
        default_sender_name: defaultSenderName || null,
        default_template_id: defaultTemplateId || null,
      })

    if (error) {
      return { error: error.message }
    }
  }

  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Save just the Google review link for the current user's business.
 * Used by the review link modal on the dashboard.
 */
export async function saveReviewLink(
  link: string
): Promise<BusinessActionState> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'You must be logged in' }
  }

  // Validate URL if provided
  if (link.trim()) {
    try {
      new URL(link)
    } catch {
      return { error: 'Please enter a valid URL' }
    }
    if (!link.includes('google.com')) {
      return { error: 'Must be a Google URL' }
    }
  }

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!business) {
    return { error: 'Please create a business profile first' }
  }

  const { error } = await supabase
    .from('businesses')
    .update({ google_review_link: link.trim() || null })
    .eq('id', business.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard')
  revalidatePath('/dashboard/settings')
  return { success: true }
}

/**
 * Create a new email template for the user's business.
 */
export async function createEmailTemplate(
  _prevState: BusinessActionState | null,
  formData: FormData
): Promise<BusinessActionState> {
  const supabase = await createClient()

  // Validate user authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'You must be logged in to create templates' }
  }

  // Get user's business (required - must have business before creating templates)
  const { data: business, error: businessError } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (businessError || !business) {
    return { error: 'Please create a business profile first' }
  }

  // Parse and validate input
  const parsed = emailTemplateSchema.safeParse({
    name: formData.get('name'),
    subject: formData.get('subject'),
    body: formData.get('body'),
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const { name, subject, body } = parsed.data

  // Insert new template
  const { error } = await supabase
    .from('email_templates')
    .insert({
      business_id: business.id,
      name,
      subject,
      body,
      is_default: false, // User-created templates are not system defaults
    })

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

/**
 * Delete an email template.
 * Only allows deleting user's own non-default templates.
 */
export async function deleteEmailTemplate(
  templateId: string
): Promise<BusinessActionState> {
  const supabase = await createClient()

  // Validate user authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'You must be logged in to delete templates' }
  }

  // Verify template belongs to user's business and is not a default
  // RLS handles ownership check, but we check is_default explicitly
  const { data: template } = await supabase
    .from('email_templates')
    .select('is_default')
    .eq('id', templateId)
    .single()

  if (!template) {
    return { error: 'Template not found' }
  }

  if (template.is_default) {
    return { error: 'Cannot delete default templates' }
  }

  // Delete template (RLS ensures user can only delete their own)
  const { error } = await supabase
    .from('email_templates')
    .delete()
    .eq('id', templateId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

/**
 * Fetch current user's business with all templates.
 * For use in Server Components to load initial form data.
 * Returns null if no business exists yet.
 */
export async function getBusiness() {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return null
  }

  // Use explicit FK hint to resolve ambiguity from circular relationship
  const { data: business } = await supabase
    .from('businesses')
    .select(`
      *,
      email_templates!email_templates_business_id_fkey (
        id,
        name,
        subject,
        body,
        is_default,
        created_at
      )
    `)
    .eq('user_id', user.id)
    .single()

  return business
}

/**
 * Fetch all templates for the current user's business.
 * Includes both system defaults and user-created templates.
 */
export async function getEmailTemplates() {
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

  const { data: templates } = await supabase
    .from('email_templates')
    .select('*')
    .eq('business_id', business.id)
    .order('is_default', { ascending: false }) // System defaults first
    .order('created_at', { ascending: true })

  return templates || []
}
