import { createClient } from '@/lib/supabase/server'
import type { JobWithCustomer, JobWithEnrollment, ConflictDetail } from '@/lib/types/database'

/**
 * Fetch jobs for the given business with pagination and filters.
 * Includes enrollment data for campaign preview.
 * Caller is responsible for providing a verified businessId (from getActiveBusiness()).
 */
export async function getJobs(
  businessId: string,
  options?: {
    limit?: number
    offset?: number
    serviceType?: string
    status?: string
  }
): Promise<{ jobs: JobWithEnrollment[]; total: number }> {
  const supabase = await createClient()

  const limit = options?.limit ?? 50
  const offset = options?.offset ?? 0

  // Build query with customer and enrollment joins
  let query = supabase
    .from('jobs')
    .select(`
      *,
      customers!inner(id, name, email, phone),
      campaign_enrollments(id, status, campaigns:campaign_id(id, name))
    `, { count: 'exact' })
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })

  // Apply service type filter
  if (options?.serviceType) {
    query = query.eq('service_type', options.serviceType)
  }

  // Apply status filter
  if (options?.status) {
    query = query.eq('status', options.status)
  }

  // Apply pagination
  query = query.range(offset, offset + limit - 1)

  const { data, count, error } = await query

  if (error) {
    console.error('Error fetching jobs:', error)
    return { jobs: [], total: 0 }
  }

  const jobs = data as JobWithEnrollment[]

  // Batch-fetch conflict detail for conflict/queue_after jobs
  const conflictCustomerIds = new Set(
    jobs
      .filter(j => j.enrollment_resolution === 'conflict' || j.enrollment_resolution === 'queue_after')
      .map(j => j.customer_id)
  )

  const customerEnrollments = new Map<string, ConflictDetail>()
  if (conflictCustomerIds.size > 0) {
    const { data: activeEnrollments } = await supabase
      .from('campaign_enrollments')
      .select('customer_id, current_touch, campaigns:campaign_id(name, campaign_touches(touch_number))')
      .in('customer_id', Array.from(conflictCustomerIds))
      .eq('business_id', businessId)
      .eq('status', 'active')

    for (const enrollment of activeEnrollments || []) {
      const campaign = Array.isArray(enrollment.campaigns) ? enrollment.campaigns[0] : enrollment.campaigns
      const campaignData = campaign as { name: string; campaign_touches: { touch_number: number }[] } | null
      customerEnrollments.set(enrollment.customer_id, {
        existingCampaignName: campaignData?.name || 'Unknown',
        currentTouch: enrollment.current_touch,
        totalTouches: campaignData?.campaign_touches?.length || 0,
      })
    }

    // Attach conflict detail to jobs
    for (const job of jobs) {
      if (job.enrollment_resolution === 'conflict' || job.enrollment_resolution === 'queue_after') {
        job.conflictDetail = customerEnrollments.get(job.customer_id)
      }
    }
  }

  // Pre-flight conflict detection for scheduled jobs:
  // Identify scheduled jobs that WOULD conflict if completed now
  const preflightCandidates = jobs.filter(j =>
    j.status === 'scheduled' &&
    !j.enrollment_resolution &&
    j.campaign_override !== 'one_off' &&
    j.campaign_override !== 'dismissed'
  )

  const preflightCustomerIds = new Set(preflightCandidates.map(j => j.customer_id))
  // Exclude customers already fetched above
  for (const id of conflictCustomerIds) {
    preflightCustomerIds.delete(id)
  }

  if (preflightCustomerIds.size > 0) {
    const { data: activeEnrollments } = await supabase
      .from('campaign_enrollments')
      .select('customer_id, current_touch, campaigns:campaign_id(name, campaign_touches(touch_number))')
      .in('customer_id', Array.from(preflightCustomerIds))
      .eq('business_id', businessId)
      .eq('status', 'active')

    const preflightMap = new Map<string, ConflictDetail>()
    for (const enrollment of activeEnrollments || []) {
      const campaign = Array.isArray(enrollment.campaigns) ? enrollment.campaigns[0] : enrollment.campaigns
      const campaignData = campaign as { name: string; campaign_touches: { touch_number: number }[] } | null
      preflightMap.set(enrollment.customer_id, {
        existingCampaignName: campaignData?.name || 'Unknown',
        currentTouch: enrollment.current_touch,
        totalTouches: campaignData?.campaign_touches?.length || 0,
      })
    }

    for (const job of preflightCandidates) {
      const detail = preflightMap.get(job.customer_id)
      if (detail) {
        job.potentialConflict = detail
      }
    }
  }

  // Also check candidates whose customer_id was already in conflictCustomerIds
  for (const job of preflightCandidates) {
    if (!job.potentialConflict && conflictCustomerIds.has(job.customer_id)) {
      job.potentialConflict = customerEnrollments.get(job.customer_id)
    }
  }

  return {
    jobs,
    total: count || 0,
  }
}

/**
 * Fetch a single job by ID.
 */
export async function getJob(jobId: string): Promise<JobWithCustomer | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return null
  }

  const { data, error } = await supabase
    .from('jobs')
    .select('*, customers!inner(id, name, email, phone)')
    .eq('id', jobId)
    .single()

  if (error) {
    console.error('Error fetching job:', error)
    return null
  }

  return data as JobWithCustomer
}

/**
 * Get job counts by status for the given business.
 */
export async function getJobCounts(businessId: string): Promise<{
  total: number
  completed: number
  doNotSend: number
}> {
  const supabase = await createClient()

  // Get total count
  const { count: total } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId)

  // Get completed count
  const { count: completed } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .eq('status', 'completed')

  // Get do_not_send count
  const { count: doNotSend } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .eq('status', 'do_not_send')

  return {
    total: total || 0,
    completed: completed || 0,
    doNotSend: doNotSend || 0,
  }
}
