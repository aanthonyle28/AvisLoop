'use server'

import { randomBytes } from 'crypto'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import {
  businessBasicsSchema,
  servicesOfferedSchema,
  brandVoiceSchema,
  type BusinessBasicsInput,
  type ServicesOfferedInput,
  type BrandVoiceInput,
} from '@/lib/validations/onboarding'
import { DEFAULT_TIMING_HOURS } from '@/lib/validations/job'
import { ACTIVE_BUSINESS_COOKIE } from '@/lib/data/active-business'
import type { CampaignTouch } from '@/lib/types/database'

/**
 * Create a brand-new business for an existing user (agency "add location" flow).
 * PURE INSERT — never upsert or update. Creates a second/nth business row.
 *
 * @param input - Business basics (name, phone, googleReviewLink)
 * @returns { success: true, businessId } or { success: false, error }
 */
export async function createAdditionalBusiness(
  input: BusinessBasicsInput
): Promise<{ success: true; businessId: string } | { success: false; error: string }> {
  const parsed = businessBasicsSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' }
  }

  const { name, phone, googleReviewLink } = parsed.data

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'You must be logged in' }
  }

  // PURE INSERT — no upsert, no conditional update
  const { data, error } = await supabase
    .from('businesses')
    .insert({
      user_id: user.id,
      name,
      phone: phone || null,
      google_review_link: googleReviewLink || null,
    })
    .select('id')
    .single()

  if (error) {
    return { success: false, error: error.message }
  }

  revalidatePath('/businesses')

  return { success: true, businessId: data.id }
}

/**
 * Save services for a newly created business (scoped by explicit businessId).
 * Never calls getActiveBusiness() — businessId is passed explicitly.
 *
 * @param businessId - The newly created business ID
 * @param input - Services offered data (serviceTypes array)
 * @returns Success or error object
 */
export async function saveNewBusinessServices(
  businessId: string,
  input: ServicesOfferedInput
): Promise<{ success: boolean; error?: string }> {
  if (!businessId) {
    return { success: false, error: 'Business ID is required' }
  }

  const parsed = servicesOfferedSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' }
  }

  const { serviceTypes, customServiceNames } = parsed.data

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'You must be logged in' }
  }

  // Build timing map from defaults for each selected service type
  const timingMap: Record<string, number> = {}
  for (const serviceType of serviceTypes) {
    timingMap[serviceType] = DEFAULT_TIMING_HOURS[serviceType]
  }

  const { error } = await supabase
    .from('businesses')
    .update({
      service_types_enabled: serviceTypes,
      service_type_timing: timingMap,
      custom_service_names: customServiceNames || [],
    })
    .eq('id', businessId)
    .eq('user_id', user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Create a campaign for a newly created business by duplicating a preset.
 * Inlines duplicateCampaign logic to avoid getActiveBusiness() dependency.
 *
 * @param businessId - The newly created business ID
 * @param presetId - ID of the system preset campaign to duplicate
 * @returns Success or error object
 */
export async function createNewBusinessCampaign(
  businessId: string,
  presetId: string
): Promise<{ success: boolean; error?: string }> {
  if (!businessId) {
    return { success: false, error: 'Business ID is required' }
  }
  if (!presetId) {
    return { success: false, error: 'Preset ID is required' }
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'You must be logged in' }
  }

  // Fetch source preset (must be a system preset)
  const { data: source, error: fetchError } = await supabase
    .from('campaigns')
    .select('*, campaign_touches(*)')
    .eq('id', presetId)
    .eq('is_preset', true)
    .single()

  if (fetchError || !source) {
    return { success: false, error: 'Preset not found' }
  }

  // Insert new campaign for the new business
  const { data: newCampaign, error: createError } = await supabase
    .from('campaigns')
    .insert({
      business_id: businessId,
      name: source.name,
      service_type: source.service_type,
      status: 'active',
      is_preset: false,
      personalization_enabled: source.personalization_enabled ?? true,
    })
    .select('id')
    .single()

  if (createError || !newCampaign) {
    return { success: false, error: createError?.message || 'Failed to create campaign' }
  }

  // Copy touches if the preset has any
  const touches: CampaignTouch[] = source.campaign_touches ?? []
  if (touches.length > 0) {
    const touchCopies = touches.map((t: CampaignTouch) => ({
      campaign_id: newCampaign.id,
      touch_number: t.touch_number,
      channel: t.channel,
      delay_hours: t.delay_hours,
      template_id: t.template_id,
    }))

    const { error: touchError } = await supabase
      .from('campaign_touches')
      .insert(touchCopies)

    if (touchError) {
      return { success: false, error: touchError.message }
    }
  }

  return { success: true }
}

/**
 * Mark a newly created business's onboarding as complete.
 * Sets sms_consent_acknowledged and onboarding_completed_at.
 * Scoped by explicit businessId — never calls getActiveBusiness().
 *
 * @param businessId - The newly created business ID
 * @returns Success or error object
 */
export async function completeNewBusinessOnboarding(
  businessId: string
): Promise<{ success: boolean; error?: string }> {
  if (!businessId) {
    return { success: false, error: 'Business ID is required' }
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'You must be logged in' }
  }

  // Auto-generate intake_token for this new business
  const intakeToken = randomBytes(24).toString('base64url')

  const { error } = await supabase
    .from('businesses')
    .update({
      sms_consent_acknowledged: true,
      sms_consent_acknowledged_at: new Date().toISOString(),
      onboarding_completed_at: new Date().toISOString(),
      intake_token: intakeToken,
    })
    .eq('id', businessId)
    .eq('user_id', user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Save brand voice for a newly created business (scoped by explicit businessId).
 * Never calls getActiveBusiness() — businessId is passed explicitly.
 *
 * @param businessId - The newly created business ID
 * @param input - Brand voice data (preset + optional custom text)
 * @returns Success or error object
 */
export async function saveNewBusinessBrandVoice(
  businessId: string,
  input: BrandVoiceInput
): Promise<{ success: boolean; error?: string }> {
  if (!businessId) {
    return { success: false, error: 'Business ID is required' }
  }

  const parsed = brandVoiceSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Invalid input' }
  }

  const { preset, customText } = parsed.data

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'You must be logged in' }
  }

  const brandVoice = customText ? `${preset}|${customText}` : preset

  const { error } = await supabase
    .from('businesses')
    .update({ brand_voice: brandVoice })
    .eq('id', businessId)
    .eq('user_id', user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}

/**
 * Delete an incomplete business that was partially created during the wizard.
 * Called when user cancels the CreateBusinessWizard after step 1 (business row exists
 * but onboarding is not complete).
 *
 * Silent fire-and-forget — errors are logged but not surfaced to the user since
 * we're navigating away anyway.
 */
export async function deleteIncompleteNewBusiness(businessId: string): Promise<void> {
  if (!businessId) return

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return

  // Only delete if it belongs to this user (defense in depth on top of RLS)
  await supabase
    .from('businesses')
    .delete()
    .eq('id', businessId)
    .eq('user_id', user.id)

  revalidatePath('/businesses')
}

/**
 * Delete a business permanently. Cascading FKs handle cleanup of jobs, customers,
 * campaigns, enrollments, send_logs, and feedback.
 *
 * Guards:
 * - User must be authenticated
 * - User must own the business
 * - Cannot delete the user's last remaining business
 * - If deleting the active business, switches to another one
 *
 * @param businessId - UUID of the business to delete
 * @returns Success or error object
 */
export async function deleteBusiness(
  businessId: string
): Promise<{ success: boolean; error?: string }> {
  if (!businessId) {
    return { success: false, error: 'Business ID is required' }
  }

  const supabase = await createClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { success: false, error: 'You must be logged in' }
  }

  // Fetch all user businesses to check count and find fallback
  const { data: allBusinesses } = await supabase
    .from('businesses')
    .select('id, name')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (!allBusinesses || allBusinesses.length === 0) {
    return { success: false, error: 'No businesses found' }
  }

  if (allBusinesses.length <= 1) {
    return { success: false, error: 'Cannot delete your only business' }
  }

  // Verify the target business belongs to the user
  const target = allBusinesses.find((b) => b.id === businessId)
  if (!target) {
    return { success: false, error: 'Business not found' }
  }

  // Delete the business — CASCADE handles all related data
  const { error } = await supabase
    .from('businesses')
    .delete()
    .eq('id', businessId)
    .eq('user_id', user.id)

  if (error) {
    return { success: false, error: error.message }
  }

  // If the deleted business was the active one, switch to another
  const cookieStore = await cookies()
  const activeId = cookieStore.get(ACTIVE_BUSINESS_COOKIE)?.value
  if (activeId === businessId) {
    const fallback = allBusinesses.find((b) => b.id !== businessId)
    if (fallback) {
      cookieStore.set({
        name: ACTIVE_BUSINESS_COOKIE,
        value: fallback.id,
        httpOnly: true,
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 365,
      })
    }
  }

  revalidatePath('/', 'layout')

  return { success: true }
}
