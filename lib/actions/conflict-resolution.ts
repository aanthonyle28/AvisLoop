'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { getActiveBusiness } from '@/lib/data/active-business'
import { enrollJobInCampaign } from '@/lib/actions/enrollment'

export type ConflictResolutionResult = {
  success: boolean
  error?: string
}

/**
 * Resolve an enrollment conflict for a job.
 *
 * Actions:
 * - 'replace': Cancel active enrollments for the customer, enroll this job instead.
 * - 'skip': Mark the job as skipped — it disappears from the queue.
 * - 'queue_after': Mark the job as queued — it stays visible with "Queued" badge,
 *   auto-enrolls once the active sequence finishes.
 */
export async function resolveEnrollmentConflict(
  jobId: string,
  action: 'replace' | 'skip' | 'queue_after'
): Promise<ConflictResolutionResult> {
  const business = await getActiveBusiness()
  if (!business) {
    return { success: false, error: 'Business not found' }
  }

  const supabase = await createClient()

  const { data: job } = await supabase
    .from('jobs')
    .select('id, status, enrollment_resolution, campaign_override')
    .eq('id', jobId)
    .eq('business_id', business.id)
    .single()

  if (!job) {
    return { success: false, error: 'Job not found' }
  }

  // Idempotency check: if already in target state, return early (prevents duplicate toasts on double-click)
  if (
    (action === 'skip' && job.enrollment_resolution === 'skipped') ||
    (action === 'queue_after' && job.enrollment_resolution === 'queue_after') ||
    (action === 'replace' && job.enrollment_resolution === 'replace_on_complete')
  ) {
    return { success: true }
  }

  switch (action) {
    case 'replace': {
      if (job.status !== 'completed') {
        // Job not yet completed — store intent, enrollment happens at completion time
        const { error } = await supabase
          .from('jobs')
          .update({
            enrollment_resolution: 'replace_on_complete',
            conflict_detected_at: job.enrollment_resolution === 'conflict' ? undefined : new Date().toISOString(),
          })
          .eq('id', jobId)

        if (error) {
          return { success: false, error: error.message }
        }
      } else {
        // Job already completed — use enrollJobInCampaign with conflictResolution='replace'
        // This cancels active enrollments and creates new one
        const campaignId = job.campaign_override && job.campaign_override !== 'one_off' && job.campaign_override !== 'dismissed'
          ? job.campaign_override
          : undefined

        const result = await enrollJobInCampaign(jobId, {
          conflictResolution: 'replace',
          forceCooldownOverride: true,
          campaignId: campaignId || undefined,
        })

        if (!result.success && !result.skipped) {
          return { success: false, error: result.error || 'Failed to enroll' }
        }
      }
      break
    }

    case 'skip': {
      const { error } = await supabase
        .from('jobs')
        .update({
          enrollment_resolution: 'skipped',
          conflict_detected_at: null,
        })
        .eq('id', jobId)

      if (error) {
        return { success: false, error: error.message }
      }
      break
    }

    case 'queue_after': {
      const { error } = await supabase
        .from('jobs')
        .update({
          enrollment_resolution: 'queue_after',
        })
        .eq('id', jobId)

      if (error) {
        return { success: false, error: error.message }
      }
      break
    }
  }

  revalidatePath('/dashboard')
  revalidatePath('/jobs')
  return { success: true }
}

/**
 * Revert a skip or queue_after resolution back to 'conflict' state.
 * Used by undo toasts after skip/queue actions.
 */
export async function revertConflictResolution(
  jobId: string
): Promise<ConflictResolutionResult> {
  const business = await getActiveBusiness()
  if (!business) {
    return { success: false, error: 'Business not found' }
  }

  const supabase = await createClient()

  const { data: job } = await supabase
    .from('jobs')
    .select('id, enrollment_resolution, customer_id, business_id')
    .eq('id', jobId)
    .eq('business_id', business.id)
    .single()

  if (!job) {
    return { success: false, error: 'Job not found' }
  }

  // Only revert from skipped, queue_after, or replace_on_complete (guard against stale undo)
  if (job.enrollment_resolution !== 'skipped' && job.enrollment_resolution !== 'queue_after' && job.enrollment_resolution !== 'replace_on_complete') {
    return { success: false, error: 'Job is no longer in a revertible state' }
  }

  // Check if an active enrollment still exists for this customer (prevents phantom conflict)
  const { data: activeEnrollment } = await supabase
    .from('campaign_enrollments')
    .select('id')
    .eq('customer_id', job.customer_id)
    .eq('business_id', job.business_id)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (activeEnrollment) {
    // Active enrollment exists — revert to conflict state
    const { error } = await supabase
      .from('jobs')
      .update({
        enrollment_resolution: 'conflict',
        conflict_detected_at: new Date().toISOString(),
      })
      .eq('id', jobId)

    if (error) {
      return { success: false, error: 'Failed to revert resolution' }
    }
  } else {
    // No active enrollment — conflict no longer exists, clear resolution entirely
    const { error } = await supabase
      .from('jobs')
      .update({
        enrollment_resolution: null,
        conflict_detected_at: null,
      })
      .eq('id', jobId)

    if (error) {
      return { success: false, error: 'Failed to clear resolution' }
    }
  }

  revalidatePath('/dashboard')
  revalidatePath('/jobs')
  return { success: true }
}
