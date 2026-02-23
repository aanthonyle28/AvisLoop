'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { businessSchema } from '@/lib/validations/business'
import { MIN_ENROLLMENT_COOLDOWN_DAYS, MAX_ENROLLMENT_COOLDOWN_DAYS } from '@/lib/constants/campaigns'

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
    phone: formData.get('phone') || '',
    googleReviewLink: formData.get('googleReviewLink') || '',
    defaultSenderName: formData.get('defaultSenderName') || '',
    defaultTemplateId: formData.get('defaultTemplateId') || '',
  })

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors }
  }

  const { name, phone, googleReviewLink, defaultSenderName, defaultTemplateId } = parsed.data

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
        phone: phone || null,
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
        phone: phone || null,
        google_review_link: googleReviewLink || null,
        default_sender_name: defaultSenderName || null,
        default_template_id: defaultTemplateId || null,
      })

    if (error) {
      return { error: error.message }
    }
  }

  revalidatePath('/settings')
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
  revalidatePath('/settings')
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
      message_templates!message_templates_business_id_fkey (
        id,
        name,
        subject,
        body,
        channel,
        service_type,
        is_default,
        created_at
      )
    `)
    .eq('user_id', user.id)
    .single()

  return business
}

/**
 * Fetch all email templates for the current user's business.
 * Includes both system defaults and user-created templates.
 * @deprecated Use getMessageTemplates from lib/data/message-template.ts with channel='email' instead.
 * This function is maintained for backward compatibility only.
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
    .from('message_templates')
    .select('*')
    .eq('business_id', business.id)
    .eq('channel', 'email') // Filter for email templates only
    .order('is_default', { ascending: false }) // System defaults first
    .order('created_at', { ascending: true })

  return templates || []
}

/**
 * Update business service type settings.
 * Sets which service types are enabled and timing defaults.
 */
export async function updateServiceTypeSettings(settings: {
  serviceTypesEnabled: string[]
  serviceTypeTiming: Record<string, number>
}): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'You must be logged in' }
  }

  // Validate service types (8 valid types)
  const validTypes = ['hvac', 'plumbing', 'electrical', 'cleaning', 'roofing', 'painting', 'handyman', 'other']
  const filteredEnabled = settings.serviceTypesEnabled.filter(t => validTypes.includes(t))

  // Validate timing values (1-168 hours)
  const validatedTiming: Record<string, number> = {}
  for (const [type, hours] of Object.entries(settings.serviceTypeTiming)) {
    if (validTypes.includes(type) && typeof hours === 'number' && hours >= 1 && hours <= 168) {
      validatedTiming[type] = hours
    }
  }

  // Merge with defaults to ensure all types have values
  const defaultTiming = {
    hvac: 24, plumbing: 48, electrical: 24, cleaning: 4,
    roofing: 72, painting: 48, handyman: 24, other: 24
  }
  const finalTiming = { ...defaultTiming, ...validatedTiming }

  const { error } = await supabase
    .from('businesses')
    .update({
      service_types_enabled: filteredEnabled,
      service_type_timing: finalTiming,
    })
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/settings')
  revalidatePath('/jobs')
  return { success: true }
}

/**
 * Update the review cooldown period for the current user's business.
 * Controls how long after a customer reviews before they can be enrolled again.
 */
export async function updateReviewCooldown(
  days: number
): Promise<{ error?: string; success?: boolean }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { error: 'You must be logged in' }
  }

  // Validate range
  if (days < MIN_ENROLLMENT_COOLDOWN_DAYS || days > MAX_ENROLLMENT_COOLDOWN_DAYS) {
    return { error: `Cooldown must be between ${MIN_ENROLLMENT_COOLDOWN_DAYS} and ${MAX_ENROLLMENT_COOLDOWN_DAYS} days` }
  }

  const { error } = await supabase
    .from('businesses')
    .update({ review_cooldown_days: days })
    .eq('user_id', user.id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/settings')
  return { success: true }
}
