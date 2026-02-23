import { createClient } from '@/lib/supabase/server'
import type { JobWithCustomer, JobWithEnrollment, ConflictDetail } from '@/lib/types/database'

/**
 * Fetch jobs for the current user's business with pagination and filters.
 * Includes enrollment data for campaign preview.
 */
export async function getJobs(options?: {
  limit?: number
  offset?: number
  serviceType?: string
  status?: string
}): Promise<{ jobs: JobWithEnrollment[]; total: number; businessId: string | null }> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { jobs: [], total: 0, businessId: null }
  }

  // Get user's business
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!business) {
    return { jobs: [], total: 0, businessId: null }
  }

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
    .eq('business_id', business.id)
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
    return { jobs: [], total: 0, businessId: business.id }
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
      .eq('business_id', business.id)
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

  return {
    jobs,
    total: count || 0,
    businessId: business.id,
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
 * Get job counts by status for the current business.
 */
export async function getJobCounts(): Promise<{
  total: number
  completed: number
  doNotSend: number
}> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { total: 0, completed: 0, doNotSend: 0 }
  }

  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!business) {
    return { total: 0, completed: 0, doNotSend: 0 }
  }

  // Get total count
  const { count: total } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', business.id)

  // Get completed count
  const { count: completed } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', business.id)
    .eq('status', 'completed')

  // Get do_not_send count
  const { count: doNotSend } = await supabase
    .from('jobs')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', business.id)
    .eq('status', 'do_not_send')

  return {
    total: total || 0,
    completed: completed || 0,
    doNotSend: doNotSend || 0,
  }
}
