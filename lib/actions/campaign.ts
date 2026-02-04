'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { campaignWithTouchesSchema } from '@/lib/validations/campaign'
import type { CampaignWithTouchesFormData } from '@/lib/validations/campaign'
import type { CampaignTouch } from '@/lib/types/database'

type ActionState = {
  error?: string
  fieldErrors?: Record<string, string[]>
  success?: boolean
  data?: { campaignId: string }
}

/**
 * Create a new campaign with touches.
 */
export async function createCampaign(
  formData: CampaignWithTouchesFormData
): Promise<ActionState> {
  const supabase = await createClient()

  // Validate auth
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Get business
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!business) return { error: 'Business not found' }

  // Validate form data
  const parsed = campaignWithTouchesSchema.safeParse(formData)
  if (!parsed.success) {
    return {
      error: 'Validation failed',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { touches, ...campaignData } = parsed.data

  // Insert campaign
  const { data: campaign, error: campaignError } = await supabase
    .from('campaigns')
    .insert({
      business_id: business.id,
      name: campaignData.name,
      service_type: campaignData.service_type,
      status: campaignData.status,
      personalization_enabled: campaignData.personalization_enabled,
      is_preset: false,
    })
    .select('id')
    .single()

  if (campaignError) {
    if (campaignError.code === '23505') {
      // Unique constraint violation
      return { error: 'A campaign for this service type already exists' }
    }
    return { error: `Failed to create campaign: ${campaignError.message}` }
  }

  // Insert touches
  const touchInserts = touches.map(touch => ({
    campaign_id: campaign.id,
    touch_number: touch.touch_number,
    channel: touch.channel,
    delay_hours: touch.delay_hours,
    template_id: touch.template_id,
  }))

  const { error: touchError } = await supabase
    .from('campaign_touches')
    .insert(touchInserts)

  if (touchError) {
    // Rollback campaign on touch insert failure
    await supabase.from('campaigns').delete().eq('id', campaign.id)
    return { error: `Failed to create touches: ${touchError.message}` }
  }

  revalidatePath('/campaigns')
  return { success: true, data: { campaignId: campaign.id } }
}

/**
 * Update an existing campaign and its touches.
 */
export async function updateCampaign(
  campaignId: string,
  formData: CampaignWithTouchesFormData
): Promise<ActionState> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Verify ownership and not preset
  const { data: existing } = await supabase
    .from('campaigns')
    .select('business_id, is_preset')
    .eq('id', campaignId)
    .single()

  if (!existing) return { error: 'Campaign not found' }
  if (existing.is_preset) return { error: 'Cannot edit preset campaigns. Duplicate first.' }

  // Validate form data
  const parsed = campaignWithTouchesSchema.safeParse(formData)
  if (!parsed.success) {
    return {
      error: 'Validation failed',
      fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
    }
  }

  const { touches, ...campaignData } = parsed.data

  // Update campaign
  const { error: campaignError } = await supabase
    .from('campaigns')
    .update({
      name: campaignData.name,
      service_type: campaignData.service_type,
      status: campaignData.status,
      personalization_enabled: campaignData.personalization_enabled,
    })
    .eq('id', campaignId)

  if (campaignError) {
    return { error: `Failed to update campaign: ${campaignError.message}` }
  }

  // Replace touches (delete all, insert new)
  await supabase.from('campaign_touches').delete().eq('campaign_id', campaignId)

  const touchInserts = touches.map(touch => ({
    campaign_id: campaignId,
    touch_number: touch.touch_number,
    channel: touch.channel,
    delay_hours: touch.delay_hours,
    template_id: touch.template_id,
  }))

  const { error: touchError } = await supabase
    .from('campaign_touches')
    .insert(touchInserts)

  if (touchError) {
    return { error: `Failed to update touches: ${touchError.message}` }
  }

  revalidatePath('/campaigns')
  revalidatePath(`/campaigns/${campaignId}`)
  return { success: true, data: { campaignId } }
}

/**
 * Delete a campaign (only if no active enrollments).
 */
export async function deleteCampaign(campaignId: string): Promise<ActionState> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Check for active enrollments
  const { count } = await supabase
    .from('campaign_enrollments')
    .select('*', { count: 'exact', head: true })
    .eq('campaign_id', campaignId)
    .eq('status', 'active')

  if (count && count > 0) {
    return { error: `Cannot delete: ${count} active enrollments. Stop them first.` }
  }

  // Verify not preset
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('is_preset')
    .eq('id', campaignId)
    .single()

  if (campaign?.is_preset) {
    return { error: 'Cannot delete preset campaigns' }
  }

  // Delete (touches will cascade)
  const { error } = await supabase
    .from('campaigns')
    .delete()
    .eq('id', campaignId)

  if (error) {
    return { error: `Failed to delete: ${error.message}` }
  }

  revalidatePath('/campaigns')
  return { success: true }
}

/**
 * Duplicate a campaign (typically from preset).
 */
export async function duplicateCampaign(
  sourceCampaignId: string,
  newName?: string
): Promise<ActionState> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!business) return { error: 'Business not found' }

  // Fetch source campaign with touches
  const { data: source } = await supabase
    .from('campaigns')
    .select(`
      *,
      campaign_touches (*)
    `)
    .eq('id', sourceCampaignId)
    .single()

  if (!source) return { error: 'Source campaign not found' }

  // Create copy
  const { data: newCampaign, error: createError } = await supabase
    .from('campaigns')
    .insert({
      business_id: business.id,
      name: newName || `${source.name} (Copy)`,
      service_type: source.service_type,
      status: 'active',
      is_preset: false,
    })
    .select('id')
    .single()

  if (createError) {
    return { error: `Failed to duplicate: ${createError.message}` }
  }

  // Copy touches
  if (source.campaign_touches?.length) {
    const touchCopies = source.campaign_touches.map((t: CampaignTouch) => ({
      campaign_id: newCampaign.id,
      touch_number: t.touch_number,
      channel: t.channel,
      delay_hours: t.delay_hours,
      template_id: t.template_id,  // May be NULL for presets
    }))

    await supabase.from('campaign_touches').insert(touchCopies)
  }

  revalidatePath('/campaigns')
  return { success: true, data: { campaignId: newCampaign.id } }
}

/**
 * Toggle campaign status (pause/resume). Pausing stops all active enrollments.
 */
export async function toggleCampaignStatus(campaignId: string): Promise<ActionState> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Get current status
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('status, is_preset')
    .eq('id', campaignId)
    .single()

  if (!campaign) return { error: 'Campaign not found' }
  if (campaign.is_preset) return { error: 'Cannot modify preset campaigns' }

  const newStatus = campaign.status === 'active' ? 'paused' : 'active'

  // Update campaign status
  const { error } = await supabase
    .from('campaigns')
    .update({ status: newStatus })
    .eq('id', campaignId)

  if (error) {
    return { error: `Failed to update status: ${error.message}` }
  }

  // If pausing, stop all active enrollments
  if (newStatus === 'paused') {
    await supabase
      .from('campaign_enrollments')
      .update({
        status: 'stopped',
        stop_reason: 'campaign_paused',
        stopped_at: new Date().toISOString(),
      })
      .eq('campaign_id', campaignId)
      .eq('status', 'active')
  }

  revalidatePath('/campaigns')
  revalidatePath(`/campaigns/${campaignId}`)
  return { success: true }
}

/**
 * Stop a single enrollment manually.
 */
export async function stopEnrollment(enrollmentId: string): Promise<ActionState> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('campaign_enrollments')
    .update({
      status: 'stopped',
      stop_reason: 'owner_stopped',
      stopped_at: new Date().toISOString(),
    })
    .eq('id', enrollmentId)
    .eq('status', 'active')

  if (error) {
    return { error: `Failed to stop enrollment: ${error.message}` }
  }

  revalidatePath('/campaigns')
  return { success: true }
}
