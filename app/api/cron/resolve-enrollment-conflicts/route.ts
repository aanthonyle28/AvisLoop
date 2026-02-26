import { NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import {
  CONFLICT_AUTO_RESOLVE_HOURS,
  QUEUE_AFTER_GAP_DAYS,
} from '@/lib/constants/campaigns'

/**
 * GET /api/cron/resolve-enrollment-conflicts
 *
 * Runs every 5 minutes. Two tasks:
 *
 * Task A — Auto-resolve stale conflicts (24h+):
 *   Jobs with enrollment_resolution='conflict' and conflict_detected_at > 24h ago.
 *   Cancel customer's active enrollments, enroll the job, clear resolution.
 *
 * Task B — Process queue_after jobs:
 *   Jobs with enrollment_resolution='queue_after'.
 *   If customer no longer has active enrollment:
 *     - If last enrollment stopped with review → suppress (reviewed recently)
 *     - If 7+ days since last enrollment ended → enroll
 *     - Otherwise → keep waiting
 */
export async function GET(request: Request) {
  // === 1. Authenticate via CRON_SECRET ===
  const authHeader = request.headers.get('Authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.error('CRON_SECRET not set')
    return NextResponse.json({ ok: false, error: 'Server configuration error' }, { status: 500 })
  }

  if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceRoleClient()
  const results = { taskA: { processed: 0, errors: 0 }, taskB: { processed: 0, errors: 0 } }

  try {
    // === Task A: Auto-resolve stale conflicts ===
    const staleThreshold = new Date(Date.now() - CONFLICT_AUTO_RESOLVE_HOURS * 60 * 60 * 1000)

    const { data: staleConflicts } = await supabase
      .from('jobs')
      .select('id, business_id, customer_id, service_type, campaign_override')
      .eq('enrollment_resolution', 'conflict')
      .lte('conflict_detected_at', staleThreshold.toISOString())
      .limit(20)

    for (const job of staleConflicts || []) {
      try {
        // Cancel customer's active enrollments
        await supabase
          .from('campaign_enrollments')
          .update({
            status: 'stopped',
            stop_reason: 'repeat_job',
            stopped_at: new Date().toISOString(),
          })
          .eq('customer_id', job.customer_id)
          .eq('business_id', job.business_id)
          .eq('status', 'active')

        // Find matching campaign
        const campaign = await findCampaignForJob(supabase, job)
        if (campaign) {
          await createEnrollmentRecord(supabase, job, campaign)
        }

        // Clear resolution
        await supabase
          .from('jobs')
          .update({ enrollment_resolution: null, conflict_detected_at: null })
          .eq('id', job.id)

        results.taskA.processed++
      } catch (err) {
        console.error(`Task A error for job ${job.id}:`, err)
        results.taskA.errors++
      }
    }

    // === Task B: Process queue_after jobs ===
    const { data: queuedJobs } = await supabase
      .from('jobs')
      .select('id, business_id, customer_id, service_type, campaign_override')
      .eq('enrollment_resolution', 'queue_after')
      .limit(20)

    for (const job of queuedJobs || []) {
      try {
        // Check if customer still has active or frozen enrollment
        const { data: activeEnrollment } = await supabase
          .from('campaign_enrollments')
          .select('id')
          .eq('customer_id', job.customer_id)
          .eq('business_id', job.business_id)
          .in('status', ['active', 'frozen'])
          .maybeSingle()

        if (activeEnrollment) {
          // Still active — skip, keep waiting
          continue
        }

        // No active enrollment. Check if most recent stopped with review
        const { data: lastEnrollment } = await supabase
          .from('campaign_enrollments')
          .select('stop_reason, stopped_at, completed_at, status')
          .eq('customer_id', job.customer_id)
          .eq('business_id', job.business_id)
          .in('status', ['stopped', 'completed'])
          .order('updated_at', { ascending: false })
          .limit(1)
          .maybeSingle()

        if (lastEnrollment?.stop_reason === 'review_clicked' || lastEnrollment?.stop_reason === 'feedback_submitted') {
          // Recent review — suppress instead
          await supabase
            .from('jobs')
            .update({ enrollment_resolution: 'suppressed', conflict_detected_at: null })
            .eq('id', job.id)
          results.taskB.processed++
          continue
        }

        // Check if enough time has passed since last enrollment ended
        const endedAt = lastEnrollment?.stopped_at || lastEnrollment?.completed_at
        if (endedAt) {
          const gapMs = Date.now() - new Date(endedAt).getTime()
          const gapDays = gapMs / (1000 * 60 * 60 * 24)
          if (gapDays < QUEUE_AFTER_GAP_DAYS) {
            // Not enough gap yet — keep waiting
            continue
          }
        }

        // Ready to enroll
        const campaign = await findCampaignForJob(supabase, job)
        if (campaign) {
          await createEnrollmentRecord(supabase, job, campaign)
        }

        // Clear resolution
        await supabase
          .from('jobs')
          .update({ enrollment_resolution: null, conflict_detected_at: null })
          .eq('id', job.id)

        results.taskB.processed++
      } catch (err) {
        console.error(`Task B error for job ${job.id}:`, err)
        results.taskB.errors++
      }
    }

    return NextResponse.json({ ok: true, ...results })
  } catch (error) {
    console.error('Cron resolve-enrollment-conflicts error:', error)
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

// --- Helper: find matching campaign for a job (service-role, no RLS) ---
async function findCampaignForJob(
  supabase: ReturnType<typeof createServiceRoleClient>,
  job: { business_id: string; service_type: string; campaign_override: string | null }
) {
  // If campaign_override is a UUID, use that
  if (job.campaign_override && job.campaign_override !== 'one_off' && job.campaign_override !== 'dismissed') {
    const { data } = await supabase
      .from('campaigns')
      .select('id, campaign_touches(touch_number, delay_hours)')
      .eq('id', job.campaign_override)
      .eq('status', 'active')
      .single()
    return data
  }

  // Auto-detect: specific service type first, then "all services" fallback
  const { data: specific } = await supabase
    .from('campaigns')
    .select('id, campaign_touches(touch_number, delay_hours)')
    .eq('business_id', job.business_id)
    .eq('service_type', job.service_type)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (specific) return specific

  const { data: fallback } = await supabase
    .from('campaigns')
    .select('id, campaign_touches(touch_number, delay_hours)')
    .eq('business_id', job.business_id)
    .is('service_type', null)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  return fallback
}

// --- Helper: create enrollment record (service-role, no RLS) ---
async function createEnrollmentRecord(
  supabase: ReturnType<typeof createServiceRoleClient>,
  job: { id: string; business_id: string; customer_id: string; service_type: string },
  campaign: { id: string; campaign_touches: { touch_number: number; delay_hours: number }[] }
) {
  const touch1 = campaign.campaign_touches.find(t => t.touch_number === 1)
  if (!touch1) return

  // Fetch business timing
  const { data: business } = await supabase
    .from('businesses')
    .select('service_type_timing')
    .eq('id', job.business_id)
    .single()

  const timing = (business?.service_type_timing as Record<string, number> | null) || {}
  const delayHours = timing[job.service_type] || touch1.delay_hours
  const touch1ScheduledAt = new Date(Date.now() + delayHours * 60 * 60 * 1000)

  await supabase
    .from('campaign_enrollments')
    .insert({
      business_id: job.business_id,
      campaign_id: campaign.id,
      job_id: job.id,
      customer_id: job.customer_id,
      status: 'active',
      current_touch: 1,
      touch_1_scheduled_at: touch1ScheduledAt.toISOString(),
      touch_1_status: 'pending',
      enrolled_at: new Date().toISOString(),
    })
}
