'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getActiveCampaignForJob } from '@/lib/data/campaign'
import { DEFAULT_ENROLLMENT_COOLDOWN_DAYS } from '@/lib/constants/campaigns'
import type { ServiceType, CampaignWithTouches } from '@/lib/types/database'

export type EnrollmentResult = {
  success: boolean
  enrollmentId?: string
  error?: string
  skipped?: boolean
  skipReason?: string
  conflict?: {
    id: string
    campaignName: string
    currentTouch: number
  }
}

// Conflict check result — replaces the old blanket cooldown
export type ConflictCheckResult = {
  case: 'clear' | 'active_sequence' | 'recent_review'
  activeEnrollment?: {
    id: string
    campaignName: string
    currentTouch: number
  }
  lastReviewedAt?: string
}

/**
 * Check for enrollment conflicts for a customer.
 *
 * Cases:
 * - 'clear': No conflict — enroll normally
 * - 'active_sequence': Customer has an active enrollment in progress
 * - 'recent_review': Customer left a review within the cooldown window
 *
 * Key improvement over old checkEnrollmentCooldown: a completed sequence
 * with no review does NOT block re-enrollment.
 */
export async function checkEnrollmentConflict(
  customerId: string,
  businessId: string,
  cooldownDays: number = DEFAULT_ENROLLMENT_COOLDOWN_DAYS
): Promise<ConflictCheckResult> {
  const supabase = await createClient()

  // 1. Check for active enrollment
  const { data: activeEnrollment } = await supabase
    .from('campaign_enrollments')
    .select('id, current_touch, campaigns:campaign_id(name)')
    .eq('customer_id', customerId)
    .eq('business_id', businessId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (activeEnrollment) {
    const campaign = Array.isArray(activeEnrollment.campaigns)
      ? activeEnrollment.campaigns[0]
      : activeEnrollment.campaigns
    return {
      case: 'active_sequence',
      activeEnrollment: {
        id: activeEnrollment.id,
        campaignName: (campaign as { name: string } | null)?.name || 'Unknown',
        currentTouch: activeEnrollment.current_touch,
      },
    }
  }

  // 2. Check for recent review (stopped with review_clicked or feedback_submitted within cooldown)
  const cooldownDate = new Date()
  cooldownDate.setDate(cooldownDate.getDate() - cooldownDays)

  const { data: recentReview } = await supabase
    .from('campaign_enrollments')
    .select('stopped_at')
    .eq('customer_id', customerId)
    .eq('business_id', businessId)
    .in('stop_reason', ['review_clicked', 'feedback_submitted'])
    .gte('stopped_at', cooldownDate.toISOString())
    .order('stopped_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (recentReview) {
    return {
      case: 'recent_review',
      lastReviewedAt: recentReview.stopped_at,
    }
  }

  // 3. Clear — previous sequence completed with no review = fresh opportunity
  return { case: 'clear' }
}

/**
 * Cancel any active enrollments for a customer (for repeat job handling).
 */
async function cancelActiveEnrollments(
  supabase: Awaited<ReturnType<typeof createClient>>,
  customerId: string
): Promise<number> {
  const { data } = await supabase
    .from('campaign_enrollments')
    .update({
      status: 'stopped',
      stop_reason: 'repeat_job',
      stopped_at: new Date().toISOString(),
    })
    .eq('customer_id', customerId)
    .eq('status', 'active')
    .select('id')

  return data?.length || 0
}

/**
 * Stop all active enrollments for a specific job.
 * Used when editing a job to change campaign or revert status.
 */
export async function stopEnrollmentsForJob(
  jobId: string,
  stopReason: 'owner_stopped' | 'repeat_job' = 'owner_stopped'
): Promise<{ stopped: number; error?: string }> {
  const supabase = await createClient()

  // Verify the user is authenticated (RLS provides business scoping)
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { stopped: 0, error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('campaign_enrollments')
    .update({
      status: 'stopped',
      stop_reason: stopReason,
      stopped_at: new Date().toISOString(),
    })
    .eq('job_id', jobId)
    .eq('status', 'active')
    .select('id')

  if (error) {
    return { stopped: 0, error: error.message }
  }

  return { stopped: data?.length || 0 }
}

/**
 * Enroll a completed job in its matching campaign.
 *
 * V2 conflict-aware flow:
 * 1. Find active campaign for job's service type (or "all services" fallback)
 * 2. Unless forced, check for enrollment conflicts:
 *    - recent_review → set enrollment_resolution='suppressed' on job, skip silently
 *    - active_sequence → set enrollment_resolution='conflict' on job, skip with conflict info
 *    - clear → proceed to enroll
 * 3. If conflictResolution='replace', cancel active enrollments first
 * 4. Calculate touch 1 scheduled time using service type timing defaults
 * 5. Create enrollment record, clear enrollment_resolution on job
 */
export async function enrollJobInCampaign(
  jobId: string,
  options?: {
    forceCooldownOverride?: boolean
    campaignId?: string
    conflictResolution?: 'replace'
  }
): Promise<EnrollmentResult> {
  const supabase = await createClient()

  // Fetch job with business (including service_type_timing and review_cooldown_days)
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .select(`
      id,
      business_id,
      customer_id,
      service_type,
      completed_at,
      status,
      businesses:business_id (
        id,
        service_type_timing,
        review_cooldown_days
      )
    `)
    .eq('id', jobId)
    .single()

  if (jobError || !job) {
    return { success: false, error: 'Job not found' }
  }

  if (job.status !== 'completed') {
    return { success: false, error: 'Job must be completed to enroll' }
  }

  // Find matching campaign
  let campaign: CampaignWithTouches | null = null
  if (options?.campaignId) {
    const { data } = await supabase
      .from('campaigns')
      .select(`
        *,
        campaign_touches (*)
      `)
      .eq('id', options.campaignId)
      .eq('status', 'active')
      .single()

    if (data) {
      campaign = {
        ...data,
        campaign_touches: data.campaign_touches || [],
      } as CampaignWithTouches
    }
  } else {
    campaign = await getActiveCampaignForJob(job.business_id, job.service_type as ServiceType)
  }

  if (!campaign) {
    return {
      success: false,
      skipped: true,
      skipReason: 'No active campaign for this service type'
    }
  }

  // Check for conflicts (unless forced or explicitly resolving)
  if (!options?.forceCooldownOverride && !options?.conflictResolution) {
    const businessData = job.businesses as unknown as { review_cooldown_days?: number } | null
    const cooldownDays = businessData?.review_cooldown_days ?? DEFAULT_ENROLLMENT_COOLDOWN_DAYS

    const conflictResult = await checkEnrollmentConflict(
      job.customer_id,
      job.business_id,
      cooldownDays
    )

    if (conflictResult.case === 'recent_review') {
      // Silently suppress — customer reviewed recently
      await supabase
        .from('jobs')
        .update({
          enrollment_resolution: 'suppressed',
          conflict_detected_at: new Date().toISOString(),
        })
        .eq('id', jobId)

      return {
        success: false,
        skipped: true,
        skipReason: `Customer reviewed recently (${conflictResult.lastReviewedAt}). Suppressed.`,
      }
    }

    if (conflictResult.case === 'active_sequence') {
      // Flag conflict — job appears in dashboard queue with 3 options
      await supabase
        .from('jobs')
        .update({
          enrollment_resolution: 'conflict',
          conflict_detected_at: new Date().toISOString(),
        })
        .eq('id', jobId)

      return {
        success: false,
        skipped: true,
        skipReason: `Customer has active sequence: ${conflictResult.activeEnrollment!.campaignName}`,
        conflict: conflictResult.activeEnrollment,
      }
    }
  }

  // If resolving with 'replace', cancel active enrollments first
  if (options?.conflictResolution === 'replace') {
    await cancelActiveEnrollments(supabase, job.customer_id)
  }

  // Calculate touch 1 scheduled time
  const touch1 = campaign.campaign_touches.find(t => t.touch_number === 1)
  if (!touch1) {
    return { success: false, error: 'Campaign has no touch 1 configured' }
  }

  // SVCT-03: Use service type timing from business settings if available
  const businessTiming = (job.businesses as unknown as { service_type_timing?: Record<string, number> })?.service_type_timing
  const defaultDelayHours = businessTiming?.[job.service_type] || touch1.delay_hours

  const touch1ScheduledAt = new Date(Date.now() + defaultDelayHours * 60 * 60 * 1000)

  // Create enrollment
  const { data: enrollment, error: enrollError } = await supabase
    .from('campaign_enrollments')
    .insert({
      business_id: job.business_id,
      campaign_id: campaign.id,
      job_id: jobId,
      customer_id: job.customer_id,
      status: 'active',
      current_touch: 1,
      touch_1_scheduled_at: touch1ScheduledAt.toISOString(),
      touch_1_status: 'pending',
      enrolled_at: new Date().toISOString(),
    })
    .select('id')
    .single()

  if (enrollError) {
    // Handle unique constraint (already enrolled)
    if (enrollError.code === '23505') {
      return {
        success: false,
        skipped: true,
        skipReason: 'Customer already has active enrollment for this campaign'
      }
    }
    return { success: false, error: `Failed to enroll: ${enrollError.message}` }
  }

  // Clear any enrollment_resolution on this job (successful enrollment)
  await supabase
    .from('jobs')
    .update({
      enrollment_resolution: null,
      conflict_detected_at: null,
    })
    .eq('id', jobId)

  revalidatePath('/campaigns')
  revalidatePath('/jobs')
  revalidatePath('/dashboard')

  return {
    success: true,
    enrollmentId: enrollment.id,
  }
}

/**
 * Manually enroll a job (from dashboard or job detail).
 * Skips cooldown check - user explicitly chose to enroll.
 */
export async function manuallyEnrollJob(
  jobId: string,
  campaignId: string
): Promise<EnrollmentResult> {
  return enrollJobInCampaign(jobId, {
    forceCooldownOverride: true,
    campaignId,
  })
}
