import 'server-only'

import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { parseAndValidatePhone } from '@/lib/utils/phone'
import { DEFAULT_ENROLLMENT_COOLDOWN_DAYS } from '@/lib/constants/campaigns'

export type PublicJobResult = {
  success: boolean
  jobId?: string
  error?: string
}

/**
 * Create a completed job from the public job completion form.
 *
 * Uses the service-role client to bypass RLS since there is no authenticated user.
 * Every query is explicitly scoped to businessId to prevent cross-tenant data access.
 *
 * Flow:
 * 1. Find or create customer (dedup by email, then by phone if no email)
 * 2. Create completed job
 * 3. Find matching campaign for service type
 * 4. Check for enrollment conflicts (active sequence or recent review cooldown)
 * 5. If clear: enroll in campaign; otherwise set enrollment_resolution on job
 *
 * No revalidatePath() calls — this is a public endpoint with no auth context.
 * The dashboard user sees updates on next page load.
 *
 * CRITICAL: All queries include .eq('business_id', businessId) since service-role bypasses RLS.
 */
export async function createPublicJob(input: {
  businessId: string
  customerName: string
  customerEmail?: string
  customerPhone?: string
  serviceType: string
  notes?: string
}): Promise<PublicJobResult> {
  // SERVICE-ROLE CLIENT: bypasses RLS — every query must scope to businessId
  const supabase = createServiceRoleClient()

  // -------------------------------------------------------------------------
  // Step 1: Find or create customer
  // Dedup strategy: email match first, then phone match, then create new
  // -------------------------------------------------------------------------
  let customerId: string | null = null

  if (input.customerEmail && input.customerEmail.trim().length > 0) {
    // SERVICE-ROLE: scope to businessId required
    const { data: existingByEmail } = await supabase
      .from('customers')
      .select('id')
      .eq('business_id', input.businessId)
      .eq('email', input.customerEmail.toLowerCase().trim())
      .maybeSingle()

    if (existingByEmail) {
      customerId = existingByEmail.id
    }
  }

  if (!customerId && input.customerPhone && input.customerPhone.trim().length > 0) {
    // Attempt phone dedup before creating new (only when no email match found)
    const phoneResult = parseAndValidatePhone(input.customerPhone)
    if (phoneResult.valid && phoneResult.e164) {
      // SERVICE-ROLE: scope to businessId required
      const { data: existingByPhone } = await supabase
        .from('customers')
        .select('id')
        .eq('business_id', input.businessId)
        .eq('phone', phoneResult.e164)
        .maybeSingle()

      if (existingByPhone) {
        customerId = existingByPhone.id
      }
    }
  }

  if (!customerId) {
    // Create new customer as side effect of job completion
    const phoneResult = input.customerPhone
      ? parseAndValidatePhone(input.customerPhone)
      : null

    // SERVICE-ROLE: business_id explicit — not from auth context
    const { data: newCustomer, error: customerError } = await supabase
      .from('customers')
      .insert({
        business_id: input.businessId,
        name: input.customerName.trim(),
        email: input.customerEmail ? input.customerEmail.toLowerCase().trim() : '',
        phone: phoneResult?.e164 || input.customerPhone || null,
        phone_status: phoneResult?.status || 'missing',
        status: 'active',
        opted_out: false,
        sms_consent_status: 'unknown',
        tags: [],
      })
      .select('id')
      .single()

    if (customerError || !newCustomer) {
      console.error('[createPublicJob] customer insert error:', customerError?.code, customerError?.message)
      return { success: false, error: 'Failed to create customer' }
    }

    customerId = newCustomer.id
  }

  // -------------------------------------------------------------------------
  // Step 2: Create completed job
  // SERVICE-ROLE: business_id explicit — not from auth context
  // -------------------------------------------------------------------------
  const { data: job, error: jobError } = await supabase
    .from('jobs')
    .insert({
      business_id: input.businessId,
      customer_id: customerId,
      service_type: input.serviceType,
      status: 'completed',
      completed_at: new Date().toISOString(),
      notes: input.notes || null,
    })
    .select('id')
    .single()

  if (jobError || !job) {
    console.error('[createPublicJob] job insert error:', jobError?.code, jobError?.message)
    return { success: false, error: 'Failed to create job' }
  }

  // -------------------------------------------------------------------------
  // Step 3: Find matching active campaign for this service type
  // Service-role version of getActiveCampaignForJob() — auth-scoped version won't work here
  // Query prefers specific service type over the "all services" fallback (service_type IS NULL)
  // SERVICE-ROLE: business_id explicit
  // -------------------------------------------------------------------------
  const { data: campaign } = await supabase
    .from('campaigns')
    .select('*, campaign_touches(*)')
    .eq('business_id', input.businessId)
    .eq('status', 'active')
    .or(`service_type.eq.${input.serviceType},service_type.is.null`)
    .order('service_type', { ascending: false, nullsFirst: false })
    .limit(1)
    .maybeSingle()

  if (!campaign) {
    // No active campaign — job is created, enrollment skipped (normal for businesses without campaigns)
    return { success: true, jobId: job.id }
  }

  const touch1 = (campaign.campaign_touches as Array<{ touch_number: number; delay_hours: number }> | null)
    ?.find((t) => t.touch_number === 1)

  if (!touch1) {
    // Campaign misconfigured (no touch 1) — skip enrollment but job is still created
    return { success: true, jobId: job.id }
  }

  // -------------------------------------------------------------------------
  // Step 4: Conflict detection (service-role version)
  // Check for active enrollment or recent review within cooldown window
  // SERVICE-ROLE: customer_id + business_id scoped
  // -------------------------------------------------------------------------

  // 4a. Check for active or frozen enrollment
  const { data: activeEnrollment } = await supabase
    .from('campaign_enrollments')
    .select('id, current_touch')
    .eq('customer_id', customerId)
    .eq('business_id', input.businessId)
    .in('status', ['active', 'frozen'])
    .limit(1)
    .maybeSingle()

  if (activeEnrollment) {
    // Customer has active sequence — mark job as conflict (owner resolves from dashboard)
    // SERVICE-ROLE: job_id explicit (already scoped via job insert above)
    await supabase
      .from('jobs')
      .update({
        enrollment_resolution: 'conflict',
        conflict_detected_at: new Date().toISOString(),
      })
      .eq('id', job.id)

    return { success: true, jobId: job.id }
  }

  // 4b. Check review cooldown (recent review within configured cooldown window)
  // SERVICE-ROLE: business_id explicit for cooldown days fetch
  const { data: businessSettings } = await supabase
    .from('businesses')
    .select('review_cooldown_days, service_type_timing')
    .eq('id', input.businessId)
    .single()

  const cooldownDays = businessSettings?.review_cooldown_days ?? DEFAULT_ENROLLMENT_COOLDOWN_DAYS
  const cooldownDate = new Date()
  cooldownDate.setDate(cooldownDate.getDate() - cooldownDays)

  // SERVICE-ROLE: customer_id + business_id scoped
  const { data: recentReview } = await supabase
    .from('campaign_enrollments')
    .select('stopped_at')
    .eq('customer_id', customerId)
    .eq('business_id', input.businessId)
    .in('stop_reason', ['review_clicked', 'feedback_submitted'])
    .gte('stopped_at', cooldownDate.toISOString())
    .order('stopped_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (recentReview) {
    // Customer reviewed recently — suppress enrollment silently
    // SERVICE-ROLE: job_id explicit
    await supabase
      .from('jobs')
      .update({
        enrollment_resolution: 'suppressed',
        conflict_detected_at: new Date().toISOString(),
      })
      .eq('id', job.id)

    return { success: true, jobId: job.id }
  }

  // -------------------------------------------------------------------------
  // Step 5: Enroll in campaign (conflict-clear path)
  // SERVICE-ROLE: all IDs explicit — not from auth context
  // -------------------------------------------------------------------------
  const timing = businessSettings?.service_type_timing as Record<string, number> | null
  const delayHours = timing?.[input.serviceType] || touch1.delay_hours
  const touch1ScheduledAt = new Date(Date.now() + delayHours * 60 * 60 * 1000)

  const { error: enrollError } = await supabase
    .from('campaign_enrollments')
    .insert({
      business_id: input.businessId,
      campaign_id: campaign.id,
      job_id: job.id,
      customer_id: customerId,
      status: 'active',
      current_touch: 1,
      touch_1_scheduled_at: touch1ScheduledAt.toISOString(),
      touch_1_status: 'pending',
      enrolled_at: new Date().toISOString(),
    })

  if (enrollError) {
    if (enrollError.code === '23505') {
      // Unique constraint: customer already enrolled in this campaign — safe to ignore
      // Job is still created; enrollment is skipped gracefully
      return { success: true, jobId: job.id }
    }
    // Other enrollment error — job is created, enrollment failed
    console.error('[createPublicJob] enrollment insert error:', enrollError.code, enrollError.message)
    return { success: true, jobId: job.id }
  }

  // On successful enrollment: clear any enrollment_resolution on this job
  // SERVICE-ROLE: job_id explicit
  await supabase
    .from('jobs')
    .update({
      enrollment_resolution: null,
      conflict_detected_at: null,
    })
    .eq('id', job.id)

  return { success: true, jobId: job.id }
}
