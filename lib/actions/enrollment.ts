'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getActiveCampaignForJob } from '@/lib/data/campaign'
import { DEFAULT_ENROLLMENT_COOLDOWN_DAYS } from '@/lib/constants/campaigns'
import type { ServiceType, CampaignWithTouches } from '@/lib/types/database'

type EnrollmentResult = {
  success: boolean
  enrollmentId?: string
  error?: string
  skipped?: boolean
  skipReason?: string
}

/**
 * Check if customer is within enrollment cooldown period.
 * Returns true if customer was enrolled in ANY campaign within cooldown days.
 */
export async function checkEnrollmentCooldown(
  customerId: string,
  cooldownDays: number = DEFAULT_ENROLLMENT_COOLDOWN_DAYS
): Promise<{ inCooldown: boolean; lastEnrolledAt?: string }> {
  const supabase = await createClient()

  const cooldownDate = new Date()
  cooldownDate.setDate(cooldownDate.getDate() - cooldownDays)

  const { data } = await supabase
    .from('campaign_enrollments')
    .select('enrolled_at')
    .eq('customer_id', customerId)
    .gte('enrolled_at', cooldownDate.toISOString())
    .order('enrolled_at', { ascending: false })
    .limit(1)
    .single()

  return {
    inCooldown: !!data,
    lastEnrolledAt: data?.enrolled_at,
  }
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
 * Flow:
 * 1. Find active campaign for job's service type (or "all services" fallback)
 * 2. Check cooldown period
 * 3. Cancel any active enrollments for same customer (repeat job)
 * 4. Calculate touch 1 scheduled time using service type timing defaults from businesses.service_type_timing
 * 5. Create enrollment record
 *
 * IMPORTANT: This function fetches service_type_timing from the business record via the job query.
 * The timing is used to calculate the delay for touch 1 (SVCT-03 requirement).
 */
export async function enrollJobInCampaign(
  jobId: string,
  options?: {
    forceCooldownOverride?: boolean
    campaignId?: string  // Optional: specify campaign instead of auto-detect
  }
): Promise<EnrollmentResult> {
  const supabase = await createClient()

  // Fetch job with business (including service_type_timing) and customer info
  // The service_type_timing from businesses is used to determine touch 1 delay
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
        service_type_timing
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

  // Check cooldown (unless forced)
  if (!options?.forceCooldownOverride) {
    const { inCooldown, lastEnrolledAt } = await checkEnrollmentCooldown(job.customer_id)
    if (inCooldown) {
      return {
        success: false,
        skipped: true,
        skipReason: `Customer enrolled recently (${lastEnrolledAt}). Cooldown active.`,
      }
    }
  }

  // Cancel any existing active enrollments for this customer (repeat job handling)
  await cancelActiveEnrollments(supabase, job.customer_id)

  // Calculate touch 1 scheduled time
  const touch1 = campaign.campaign_touches.find(t => t.touch_number === 1)
  if (!touch1) {
    return { success: false, error: 'Campaign has no touch 1 configured' }
  }

  // SVCT-03: Use service type timing from business settings if available
  // This is fetched above in the job query via businesses.service_type_timing
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
