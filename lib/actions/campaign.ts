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

  // Replace touches atomically using transaction-safe RPC
  const touchesJson = touches.map(touch => ({
    touch_number: touch.touch_number,
    channel: touch.channel,
    delay_hours: touch.delay_hours,
    template_id: touch.template_id || null,
  }))

  const { error: touchError } = await supabase.rpc('replace_campaign_touches', {
    p_campaign_id: campaignId,
    p_touches: touchesJson,
  })

  if (touchError) {
    return { error: `Failed to update touches: ${touchError.message}` }
  }

  revalidatePath('/campaigns')
  revalidatePath(`/campaigns/${campaignId}`)
  return { success: true, data: { campaignId } }
}

/**
 * Get deletion impact info for a campaign (used by confirmation dialog).
 */
export async function getCampaignDeletionInfo(campaignId: string): Promise<{
  activeEnrollments: number
  affectedJobs: number
  availableCampaigns: { id: string; name: string; service_type: string | null }[]
  error?: string
}> {
  const empty = { activeEnrollments: 0, affectedJobs: 0, availableCampaigns: [] }
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { ...empty, error: 'Not authenticated' }

  // Verify campaign belongs to user's business
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!business) return { ...empty, error: 'Business not found' }

  // Verify campaign ownership
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('id')
    .eq('id', campaignId)
    .eq('business_id', business.id)
    .single()

  if (!campaign) return { ...empty, error: 'Campaign not found' }

  const [enrollments, jobs, otherCampaigns] = await Promise.all([
    supabase
      .from('campaign_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_id', campaignId)
      .eq('business_id', business.id)
      .in('status', ['active', 'frozen']),
    supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('campaign_override', campaignId)
      .eq('business_id', business.id),
    supabase
      .from('campaigns')
      .select('id, name, service_type')
      .eq('business_id', business.id)
      .eq('is_preset', false)
      .neq('id', campaignId)
      .order('name'),
  ])

  return {
    activeEnrollments: enrollments.count ?? 0,
    affectedJobs: jobs.count ?? 0,
    availableCampaigns: (otherCampaigns.data || []) as { id: string; name: string; service_type: string | null }[],
  }
}

/**
 * Delete a campaign. Optionally reassigns active enrollments to another campaign.
 * If no reassignCampaignId, stops active enrollments. Otherwise, moves them.
 */
export async function deleteCampaign(
  campaignId: string,
  reassignCampaignId?: string | null
): Promise<ActionState> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // Verify ownership
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!business) return { error: 'Business not found' }

  // Verify not preset and belongs to user's business
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('is_preset, business_id')
    .eq('id', campaignId)
    .eq('business_id', business.id)
    .single()

  if (!campaign) return { error: 'Campaign not found' }
  if (campaign.is_preset) return { error: 'Cannot delete preset campaigns' }

  if (reassignCampaignId) {
    // --- Reassign enrollments to another campaign ---

    // Fetch active/frozen enrollments from the campaign being deleted
    const { data: activeEnrollments } = await supabase
      .from('campaign_enrollments')
      .select('id, job_id, customer_id, business_id')
      .eq('campaign_id', campaignId)
      .eq('business_id', business.id)
      .in('status', ['active', 'frozen'])

    // Stop old enrollments (both active and frozen)
    await supabase
      .from('campaign_enrollments')
      .update({
        status: 'stopped',
        stop_reason: 'campaign_deleted',
        stopped_at: new Date().toISOString(),
      })
      .eq('campaign_id', campaignId)
      .eq('business_id', business.id)
      .in('status', ['active', 'frozen'])

    // Create new enrollments in target campaign if there were active ones
    if (activeEnrollments?.length) {
      // Get target campaign's first touch for scheduling
      const { data: targetTouches } = await supabase
        .from('campaign_touches')
        .select('touch_number, delay_hours')
        .eq('campaign_id', reassignCampaignId)
        .order('touch_number')

      const touch1 = targetTouches?.find(t => t.touch_number === 1)

      if (touch1) {
        // Check which customers already have active/frozen enrollment in target campaign
        const { data: existingInTarget } = await supabase
          .from('campaign_enrollments')
          .select('customer_id')
          .eq('campaign_id', reassignCampaignId)
          .in('status', ['active', 'frozen'])

        const existingCustomerIds = new Set(
          existingInTarget?.map(e => e.customer_id) || []
        )

        const now = new Date()
        const touch1ScheduledAt = new Date(
          now.getTime() + touch1.delay_hours * 60 * 60 * 1000
        )

        const newEnrollments = activeEnrollments
          .filter(e => !existingCustomerIds.has(e.customer_id))
          .map(e => ({
            business_id: e.business_id,
            campaign_id: reassignCampaignId,
            job_id: e.job_id,
            customer_id: e.customer_id,
            status: 'active' as const,
            current_touch: 1,
            touch_1_scheduled_at: touch1ScheduledAt.toISOString(),
            touch_1_status: 'pending' as const,
            enrolled_at: now.toISOString(),
          }))

        if (newEnrollments.length > 0) {
          await supabase.from('campaign_enrollments').insert(newEnrollments)
        }
      }
    }
  } else {
    // --- Original behavior: stop all active/frozen enrollments ---
    await supabase
      .from('campaign_enrollments')
      .update({
        status: 'stopped',
        stop_reason: 'campaign_deleted',
        stopped_at: new Date().toISOString(),
      })
      .eq('campaign_id', campaignId)
      .eq('business_id', business.id)
      .in('status', ['active', 'frozen'])
  }

  // Clear campaign_override on jobs referencing this campaign (scoped to business)
  await supabase
    .from('jobs')
    .update({ campaign_override: null })
    .eq('campaign_override', campaignId)
    .eq('business_id', business.id)

  // Delete (touches will cascade)
  const { error } = await supabase
    .from('campaigns')
    .delete()
    .eq('id', campaignId)

  if (error) {
    return { error: `Failed to delete: ${error.message}` }
  }

  revalidatePath('/campaigns')
  revalidatePath('/jobs')
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
 * Toggle campaign status (pause/resume). Pausing freezes active enrollments
 * (preserving touch position). Resuming unfreezes them and adjusts stale
 * scheduled times.
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

  // If pausing, freeze active enrollments (preserves touch position for later resume)
  if (newStatus === 'paused') {
    await supabase
      .from('campaign_enrollments')
      .update({ status: 'frozen' })
      .eq('campaign_id', campaignId)
      .eq('status', 'active')
  }

  // If resuming, unfreeze frozen enrollments and adjust stale scheduled times
  if (newStatus === 'active') {
    const { data: frozenEnrollments } = await supabase
      .from('campaign_enrollments')
      .select('id, current_touch, touch_1_scheduled_at, touch_2_scheduled_at, touch_3_scheduled_at, touch_4_scheduled_at')
      .eq('campaign_id', campaignId)
      .eq('status', 'frozen')

    const now = new Date().toISOString()

    for (const enrollment of frozenEnrollments || []) {
      const touchKey = `touch_${enrollment.current_touch}_scheduled_at`
      const originalScheduled = enrollment[touchKey as keyof typeof enrollment] as string | null

      const updateData: Record<string, unknown> = { status: 'active' }

      // If the next touch was scheduled in the past, bump to now so it processes in next cron cycle
      if (originalScheduled && new Date(originalScheduled) < new Date()) {
        updateData[`touch_${enrollment.current_touch}_scheduled_at`] = now
      }

      await supabase
        .from('campaign_enrollments')
        .update(updateData)
        .eq('id', enrollment.id)
    }
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
