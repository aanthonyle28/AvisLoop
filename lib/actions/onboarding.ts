'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  businessBasicsSchema,
  reviewDestinationSchema,
  servicesOfferedSchema,
  softwareUsedSchema,
  smsConsentSchema,
  type BusinessBasicsInput,
  type ReviewDestinationInput,
  type ServicesOfferedInput,
  type SoftwareUsedInput,
  type SMSConsentInput,
} from '@/lib/validations/onboarding'
import { DEFAULT_TIMING_HOURS } from '@/lib/validations/job'
import { duplicateCampaign } from '@/lib/actions/campaign'

/**
 * Mark onboarding as complete for the current user's business.
 * Sets onboarding_completed_at to current timestamp and revalidates dashboard.
 *
 * @returns Success or error object
 */
export async function markOnboardingComplete(): Promise<{
  success: boolean
  error?: string
}> {
  const supabase = await createClient()

  // Validate user authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'You must be logged in to complete onboarding' }
  }

  // Update business with completion timestamp
  const { error } = await supabase
    .from('businesses')
    .update({
      onboarding_completed_at: new Date().toISOString()
    })
    .eq('user_id', user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  // Revalidate dashboard and onboarding to refresh status
  revalidatePath('/dashboard')
  revalidatePath('/onboarding')

  return { success: true }
}

/**
 * Mark a specific onboarding card step as complete.
 * Used for manual completion triggers when auto-detection isn't immediate enough.
 *
 * @param step - The card step to mark complete
 * @returns Success or error object
 */
export async function markOnboardingCardStep(
  step: 'contact_created' | 'template_created' | 'test_sent'
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'Not authenticated' }
  }

  const { data: business } = await supabase
    .from('businesses')
    .select('id, onboarding_steps_completed')
    .eq('user_id', user.id)
    .single()

  if (!business) {
    return { success: false, error: 'No business found' }
  }

  const current = (business.onboarding_steps_completed || {}) as Record<string, boolean>
  current[step] = true

  const { error } = await supabase
    .from('businesses')
    .update({ onboarding_steps_completed: current })
    .eq('id', business.id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Save business basics for onboarding step 1.
 * Creates or updates business with name, phone, and optional Google review link.
 *
 * @param input - Business basics data (name, phone, googleReviewLink)
 * @returns Success or error object
 */
export async function saveBusinessBasics(
  input: BusinessBasicsInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  // Validate user authentication
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'You must be logged in' }
  }

  // Validate input
  const parsed = businessBasicsSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' }
  }

  const { name, phone, googleReviewLink } = parsed.data

  // Check for existing business
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
      })
      .eq('id', existingBusiness.id)

    if (error) {
      return { success: false, error: error.message }
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
      })

    if (error) {
      return { success: false, error: error.message }
    }
  }

  revalidatePath('/onboarding')
  revalidatePath('/dashboard')
  return { success: true }
}

/**
 * Save review destination for onboarding step 2.
 * Updates Google review link for the business.
 *
 * @param input - Review destination data (googleReviewLink)
 * @returns Success or error object
 */
export async function saveReviewDestination(
  input: ReviewDestinationInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'You must be logged in' }
  }

  // Validate input
  const parsed = reviewDestinationSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' }
  }

  const { googleReviewLink } = parsed.data

  // Get business
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!business) {
    return { success: false, error: 'Business not found' }
  }

  // Update google_review_link
  const { error } = await supabase
    .from('businesses')
    .update({ google_review_link: googleReviewLink || null })
    .eq('id', business.id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Save services offered for onboarding step 3.
 * Updates service_types_enabled and service_type_timing on business.
 *
 * @param input - Services offered data (serviceTypes array)
 * @returns Success or error object
 */
export async function saveServicesOffered(
  input: ServicesOfferedInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'You must be logged in' }
  }

  // Validate input
  const parsed = servicesOfferedSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' }
  }

  const { serviceTypes } = parsed.data

  // Get business
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!business) {
    return { success: false, error: 'Business not found' }
  }

  // Build timing map using defaults for selected service types
  const timingMap: Record<string, number> = {}
  for (const serviceType of serviceTypes) {
    timingMap[serviceType] = DEFAULT_TIMING_HOURS[serviceType]
  }

  // Update business with BOTH service_types_enabled AND service_type_timing
  const { error } = await supabase
    .from('businesses')
    .update({
      service_types_enabled: serviceTypes,
      service_type_timing: timingMap,
    })
    .eq('id', business.id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/settings')
  return { success: true }
}

/**
 * Save software used for onboarding step 4.
 * Updates software_used field on business.
 *
 * @param input - Software used data (softwareUsed)
 * @returns Success or error object
 */
export async function saveSoftwareUsed(
  input: SoftwareUsedInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'You must be logged in' }
  }

  // Validate input
  const parsed = softwareUsedSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' }
  }

  const { softwareUsed } = parsed.data

  // Update business
  const { error } = await supabase
    .from('businesses')
    .update({ software_used: softwareUsed || null })
    .eq('user_id', user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Create campaign from preset for onboarding step 5.
 * Wrapper around duplicateCampaign for consistency.
 *
 * @param presetId - ID of preset campaign to duplicate
 * @returns Result with campaignId or error
 */
export async function createCampaignFromPreset(
  presetId: string
): Promise<{ error?: string; data?: { campaignId: string } }> {
  return duplicateCampaign(presetId)
}

/**
 * Acknowledge SMS consent for onboarding step 7.
 * Sets sms_consent_acknowledged flag and timestamp on business.
 *
 * @param input - SMS consent data (acknowledged must be true)
 * @returns Success or error object
 */
export async function acknowledgeSMSConsent(
  input: SMSConsentInput
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return { success: false, error: 'You must be logged in' }
  }

  // Validate input
  const parsed = smsConsentSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'You must acknowledge SMS consent requirements' }
  }

  // Update business with consent flag and timestamp
  const { error } = await supabase
    .from('businesses')
    .update({
      sms_consent_acknowledged: true,
      sms_consent_acknowledged_at: new Date().toISOString(),
    })
    .eq('user_id', user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/onboarding')
  revalidatePath('/dashboard')
  return { success: true }
}
