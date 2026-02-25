import { createClient } from '@/lib/supabase/server'
import { differenceInHours } from 'date-fns'
import type {
  DashboardKPIs,
  ReadyToSendJob,
  AttentionAlert,
  DashboardCounts,
  CampaignEvent,
  JobPanelDetail,
} from '@/lib/types/dashboard'

/**
 * Calculate trend percentage between current and previous value.
 * Returns 0 if previous is 0 and current is also 0.
 * Returns 100 if previous is 0 but current > 0.
 */
function calculateTrend(value: number, previousValue: number): number {
  if (previousValue === 0) {
    return value > 0 ? 100 : 0
  }
  return Math.round(((value - previousValue) / previousValue) * 100)
}

/**
 * Get dashboard KPI metrics with trend comparisons.
 * Outcome metrics compare monthly, pipeline metrics compare weekly.
 */
export async function getDashboardKPIs(businessId: string): Promise<DashboardKPIs> {
  const supabase = await createClient()

  const now = new Date()

  // Monthly comparison for outcome metrics
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)

  // Weekly comparison for pipeline metrics (rolling 7 days)
  const thisWeekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const lastWeekStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)
  const lastWeekEnd = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  try {
    const [
      // Outcome metrics (monthly)
      reviewsThisMonthResult,
      reviewsLastMonthResult,
      ratingsThisMonthResult,
      ratingsLastMonthResult,
      sendsThisMonthResult,
      sendsLastMonthResult,

      // Pipeline metrics (weekly)
      sendsThisWeekResult,
      sendsLastWeekResult,
      activeEnrollmentsResult,
      activeEnrollmentsLastWeekResult,
      pendingNowResult,
    ] = await Promise.all([
      // Reviews this month (send_logs with reviewed_at)
      supabase
        .from('send_logs')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .not('reviewed_at', 'is', null)
        .gte('created_at', thisMonthStart.toISOString()),

      // Reviews last month (same day range in previous month)
      supabase
        .from('send_logs')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .not('reviewed_at', 'is', null)
        .gte('created_at', lastMonthStart.toISOString())
        .lte('created_at', lastMonthEnd.toISOString()),

      // Average rating this month (from customer_feedback)
      supabase
        .from('customer_feedback')
        .select('rating')
        .eq('business_id', businessId)
        .gte('submitted_at', thisMonthStart.toISOString()),

      // Average rating last month
      supabase
        .from('customer_feedback')
        .select('rating')
        .eq('business_id', businessId)
        .gte('submitted_at', lastMonthStart.toISOString())
        .lte('submitted_at', lastMonthEnd.toISOString()),

      // Total delivered sends this month (for conversion rate)
      supabase
        .from('send_logs')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .in('status', ['sent', 'delivered', 'opened'])
        .gte('created_at', thisMonthStart.toISOString()),

      // Total delivered sends last month
      supabase
        .from('send_logs')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .in('status', ['sent', 'delivered', 'opened'])
        .gte('created_at', lastMonthStart.toISOString())
        .lte('created_at', lastMonthEnd.toISOString()),

      // Requests sent this week
      supabase
        .from('send_logs')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .in('status', ['sent', 'delivered', 'opened'])
        .gte('created_at', thisWeekStart.toISOString()),

      // Requests sent last week
      supabase
        .from('send_logs')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .in('status', ['sent', 'delivered', 'opened'])
        .gte('created_at', lastWeekStart.toISOString())
        .lte('created_at', lastWeekEnd.toISOString()),

      // Active sequences (enrollments) now
      supabase
        .from('campaign_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .eq('status', 'active'),

      // Active sequences 7 days ago (approximate via enrolled_at counting)
      supabase
        .from('campaign_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .eq('status', 'active')
        .lte('enrolled_at', lastWeekEnd.toISOString()),

      // Pending/queued sends now
      supabase
        .from('send_logs')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', businessId)
        .eq('status', 'pending'),
    ])

    // Calculate outcome metrics
    const reviewsThisMonth = reviewsThisMonthResult.count || 0
    const reviewsLastMonth = reviewsLastMonthResult.count || 0

    const ratingsThisMonth = ratingsThisMonthResult.data || []
    const avgRatingThisMonth = ratingsThisMonth.length > 0
      ? ratingsThisMonth.reduce((sum, r) => sum + r.rating, 0) / ratingsThisMonth.length
      : 0

    const ratingsLastMonth = ratingsLastMonthResult.data || []
    const avgRatingLastMonth = ratingsLastMonth.length > 0
      ? ratingsLastMonth.reduce((sum, r) => sum + r.rating, 0) / ratingsLastMonth.length
      : 0

    const sendsThisMonth = sendsThisMonthResult.count || 0
    const sendsLastMonth = sendsLastMonthResult.count || 0
    const conversionRateThisMonth = sendsThisMonth > 0
      ? Math.round((reviewsThisMonth / sendsThisMonth) * 100)
      : 0
    const conversionRateLastMonth = sendsLastMonth > 0
      ? Math.round((reviewsLastMonth / sendsLastMonth) * 100)
      : 0

    // Calculate pipeline metrics
    const sendsThisWeek = sendsThisWeekResult.count || 0
    const sendsLastWeek = sendsLastWeekResult.count || 0
    const activeNow = activeEnrollmentsResult.count || 0
    const activeLastWeek = activeEnrollmentsLastWeekResult.count || 0
    const pendingNow = pendingNowResult.count || 0

    return {
      // Outcome metrics (monthly comparison)
      reviewsThisMonth: {
        value: reviewsThisMonth,
        previousValue: reviewsLastMonth,
        trend: calculateTrend(reviewsThisMonth, reviewsLastMonth),
        trendPeriod: 'vs last month',
      },
      averageRating: {
        value: Math.round(avgRatingThisMonth * 10) / 10, // Round to 1 decimal
        previousValue: Math.round(avgRatingLastMonth * 10) / 10,
        trend: calculateTrend(
          Math.round(avgRatingThisMonth * 10),
          Math.round(avgRatingLastMonth * 10)
        ),
        trendPeriod: 'vs last month',
      },
      conversionRate: {
        value: conversionRateThisMonth,
        previousValue: conversionRateLastMonth,
        trend: calculateTrend(conversionRateThisMonth, conversionRateLastMonth),
        trendPeriod: 'vs last month',
      },

      // Pipeline metrics (weekly comparison)
      requestsSentThisWeek: {
        value: sendsThisWeek,
        previousValue: sendsLastWeek,
        trend: calculateTrend(sendsThisWeek, sendsLastWeek),
        trendPeriod: 'vs last week',
      },
      activeSequences: {
        value: activeNow,
        previousValue: activeLastWeek,
        trend: calculateTrend(activeNow, activeLastWeek),
        trendPeriod: 'vs last week',
      },
      pendingQueued: {
        value: pendingNow,
        previousValue: 0, // No historical data for pending count
        trend: 0,
        trendPeriod: 'vs last week',
      },
    }
  } catch (error) {
    console.error('Error fetching dashboard KPIs:', error)
    // Return zero state on error
    const zeroMetric = {
      value: 0,
      previousValue: 0,
      trend: 0,
      trendPeriod: 'vs last week' as const,
    }
    return {
      reviewsThisMonth: { ...zeroMetric, trendPeriod: 'vs last month' },
      averageRating: { ...zeroMetric, trendPeriod: 'vs last month' },
      conversionRate: { ...zeroMetric, trendPeriod: 'vs last month' },
      requestsSentThisWeek: zeroMetric,
      activeSequences: zeroMetric,
      pendingQueued: zeroMetric,
    }
  }
}

/**
 * Get ready-to-send jobs: scheduled jobs + completed jobs not enrolled in any campaign.
 * Uses multi-step approach: fetch jobs, fetch enrollments, fetch campaigns, filter in JS.
 */
export async function getReadyToSendJobs(
  businessId: string,
  serviceTypeTiming: Record<string, number>
): Promise<ReadyToSendJob[]> {
  const supabase = await createClient()

  try {
    // Fetch in parallel: jobs, all enrollments, active campaigns
    const [
      { data: jobs },
      { data: enrolledJobs },
      { data: activeCampaigns },
    ] = await Promise.all([
      // Step 1: Fetch scheduled + completed jobs with customer data + conflict fields
      supabase
        .from('jobs')
        .select('id, service_type, status, completed_at, created_at, campaign_override, enrollment_resolution, conflict_detected_at, customer_id, customers!inner(id, name, email)')
        .eq('business_id', businessId)
        .in('status', ['scheduled', 'completed'])
        .order('created_at', { ascending: true })
        .limit(50),

      // Step 2: Fetch job_ids that have ANY campaign enrollment (not just active)
      supabase
        .from('campaign_enrollments')
        .select('job_id')
        .eq('business_id', businessId),

      // Step 3: Fetch active campaigns to check service type matching
      supabase
        .from('campaigns')
        .select('id, service_type')
        .eq('business_id', businessId)
        .eq('status', 'active'),
    ])

    // Build lookup sets
    const enrolledJobIds = new Set((enrolledJobs || []).map(e => e.job_id))
    const campaignServiceTypes = new Set(
      (activeCampaigns || []).filter(c => c.service_type).map(c => c.service_type)
    )
    const hasAllServicesCampaign = (activeCampaigns || []).some(c => c.service_type === null)

    // Filter in JavaScript
    const eligibleJobs = (jobs || []).filter(j => {
      // Exclude dismissed jobs and one-off jobs that have already been sent
      if (j.campaign_override === 'dismissed' || j.campaign_override === 'one_off_sent') return false
      // Exclude skipped and suppressed jobs (resolved by user or system)
      if (j.enrollment_resolution === 'skipped' || j.enrollment_resolution === 'suppressed') return false
      // Keep conflict, queue_after, and replace_on_complete jobs (they need to appear in queue)
      if (j.enrollment_resolution === 'conflict' || j.enrollment_resolution === 'queue_after' || j.enrollment_resolution === 'replace_on_complete') return true
      // One-off jobs stay in queue regardless of enrollment records (they need manual send)
      if (j.campaign_override === 'one_off') return true
      // For completed jobs, exclude those with ANY enrollment record
      if (j.status === 'completed' && enrolledJobIds.has(j.id)) return false
      return true
    })

    // For conflict/queue_after/replace_on_complete jobs, batch-fetch the customer's active enrollment details
    const conflictCustomerIds = new Set(
      eligibleJobs
        .filter(j => j.enrollment_resolution === 'conflict' || j.enrollment_resolution === 'queue_after' || j.enrollment_resolution === 'replace_on_complete')
        .map(j => j.customer_id)
    )

    // Fetch active enrollments for conflict customers
    const customerEnrollments: Map<string, { existingCampaignName: string; currentTouch: number; totalTouches: number }> = new Map()
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
    }

    // Pre-flight conflict detection: scheduled jobs with no enrollment_resolution
    // whose customer is already in an active campaign sequence
    const preflightCandidates = eligibleJobs.filter(
      j => j.status === 'scheduled' && !j.enrollment_resolution && j.campaign_override !== 'one_off'
    )
    const preflightCustomerIds = new Set(
      preflightCandidates
        .map(j => j.customer_id)
        .filter(cid => !conflictCustomerIds.has(cid)) // skip already-fetched
    )

    const preflightEnrollments: Map<string, { existingCampaignName: string; currentTouch: number; totalTouches: number }> = new Map()
    if (preflightCustomerIds.size > 0) {
      const { data: activeEnrollments } = await supabase
        .from('campaign_enrollments')
        .select('customer_id, current_touch, campaigns:campaign_id(name, campaign_touches(touch_number))')
        .in('customer_id', Array.from(preflightCustomerIds))
        .eq('business_id', businessId)
        .eq('status', 'active')

      for (const enrollment of activeEnrollments || []) {
        const campaign = Array.isArray(enrollment.campaigns) ? enrollment.campaigns[0] : enrollment.campaigns
        const campaignData = campaign as { name: string; campaign_touches: { touch_number: number }[] } | null
        preflightEnrollments.set(enrollment.customer_id, {
          existingCampaignName: campaignData?.name || 'Unknown',
          currentTouch: enrollment.current_touch,
          totalTouches: campaignData?.campaign_touches?.length || 0,
        })
      }
    }

    // Calculate staleness and campaign matching for each job
    const jobsWithContext = eligibleJobs.map(job => {
      const customer = Array.isArray(job.customers) ? job.customers[0] : job.customers
      const referenceDate = job.status === 'completed'
        ? (job.completed_at || job.created_at)
        : job.created_at
      const hoursElapsed = differenceInHours(new Date(), new Date(referenceDate))
      const threshold = serviceTypeTiming[job.service_type] ?? 24
      // Only completed jobs can be stale
      const isStale = job.status === 'completed' && hoursElapsed > threshold

      // Check if a matching campaign exists for this service type
      const hasMatchingCampaign = hasAllServicesCampaign || campaignServiceTypes.has(job.service_type)

      // Build conflict detail if applicable
      const conflictDetail = (job.enrollment_resolution === 'conflict' || job.enrollment_resolution === 'queue_after' || job.enrollment_resolution === 'replace_on_complete')
        ? customerEnrollments.get(job.customer_id)
        : undefined

      // Pre-flight conflict for scheduled jobs with no resolution
      const potentialConflict = (job.status === 'scheduled' && !job.enrollment_resolution && job.campaign_override !== 'one_off')
        ? preflightEnrollments.get(job.customer_id)
        : undefined

      return {
        id: job.id,
        customer: {
          id: customer?.id || '',
          name: customer?.name || '',
          email: customer?.email || '',
        },
        service_type: job.service_type,
        completed_at: referenceDate || new Date().toISOString(),
        isStale,
        hoursElapsed,
        threshold,
        status: job.status as 'scheduled' | 'completed',
        campaign_override: job.campaign_override,
        hasMatchingCampaign,
        enrollment_resolution: job.enrollment_resolution as ReadyToSendJob['enrollment_resolution'],
        conflictDetail,
        potentialConflict,
      }
    })

    // Sort: stale completed first, then completed, then scheduled, then by date
    jobsWithContext.sort((a, b) => {
      if (a.isStale !== b.isStale) return a.isStale ? -1 : 1
      if (a.status !== b.status) return a.status === 'completed' ? -1 : 1
      return new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime()
    })

    // Limit to 20 results for display
    return jobsWithContext.slice(0, 20)
  } catch (error) {
    console.error('Error fetching ready-to-send jobs:', error)
    return []
  }
}

/**
 * Get attention alerts: failed/bounced sends and unresolved feedback.
 * Sorted by severity (critical > warning > info), then by timestamp descending.
 */
export async function getAttentionAlerts(businessId: string): Promise<AttentionAlert[]> {
  const supabase = await createClient()

  try {
    const [
      // Failed/bounced send_logs
      { data: failedSends },
      // Unresolved feedback
      { data: unresolvedFeedback },
    ] = await Promise.all([
      supabase
        .from('send_logs')
        .select('id, status, error_message, created_at, customer_id, customers!send_logs_customer_id_fkey(id, name)')
        .eq('business_id', businessId)
        .in('status', ['failed', 'bounced'])
        .not('error_message', 'like', '[ACK]%') // Exclude acknowledged alerts
        .order('created_at', { ascending: false })
        .limit(50),

      supabase
        .from('customer_feedback')
        .select('id, rating, feedback_text, submitted_at, customer_id, customers!inner(id, name)')
        .eq('business_id', businessId)
        .is('resolved_at', null)
        .order('submitted_at', { ascending: false })
        .limit(20),
    ])

    const alerts: AttentionAlert[] = []

    // Map failed/bounced sends to alerts
    for (const send of failedSends || []) {
      const customer = Array.isArray(send.customers) ? send.customers[0] : send.customers
      const customerName = customer?.name || 'Unknown'

      if (send.status === 'failed') {
        alerts.push({
          id: send.id,
          severity: 'critical',
          type: 'failed_send',
          title: 'Send failed',
          description: `Failed to send to ${customerName}${send.error_message ? ': ' + send.error_message : ''}`,
          timestamp: send.created_at,
          contextualAction: {
            label: 'Retry',
            href: `/history?retry=${send.id}`,
          },
          retryable: true,
          sendLogId: send.id,
        })
      } else if (send.status === 'bounced') {
        alerts.push({
          id: send.id,
          severity: 'warning',
          type: 'bounced_email',
          title: 'Email bounced',
          description: `Bounced email for ${customerName}`,
          timestamp: send.created_at,
          contextualAction: {
            label: 'Update customer',
            href: `/customers/${send.customer_id}`,
          },
          sendLogId: send.id,
        })
      }
    }

    // Map unresolved feedback to alerts
    for (const feedback of unresolvedFeedback || []) {
      const customer = Array.isArray(feedback.customers) ? feedback.customers[0] : feedback.customers
      const customerName = customer?.name || 'Unknown'

      alerts.push({
        id: feedback.id,
        severity: 'info',
        type: 'unresolved_feedback',
        title: 'Unresolved feedback',
        description: `${customerName} left ${feedback.rating}-star feedback`,
        timestamp: feedback.submitted_at,
        contextualAction: {
          label: 'Respond',
          href: `/feedback?id=${feedback.id}`,
        },
        feedbackId: feedback.id,
      })
    }

    // Sort by severity (critical=0, warning=1, info=2), then by timestamp descending
    const severityOrder = { critical: 0, warning: 1, info: 2 }
    alerts.sort((a, b) => {
      if (severityOrder[a.severity] !== severityOrder[b.severity]) {
        return severityOrder[a.severity] - severityOrder[b.severity]
      }
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    })

    return alerts
  } catch (error) {
    console.error('Error fetching attention alerts:', error)
    return []
  }
}

/**
 * Get dashboard counts for banner and nav badge.
 * Handles auth internally (no businessId parameter).
 * Follows pattern from getMonthlyUsage() in send-logs.ts.
 */
export async function getDashboardCounts(): Promise<DashboardCounts> {
  const supabase = await createClient()

  try {
    // Get authenticated user and business
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { readyToSend: 0, attentionAlerts: 0, total: 0 }
    }

    const { data: business } = await supabase
      .from('businesses')
      .select('id, service_type_timing')
      .eq('user_id', user.id)
      .single()

    if (!business) {
      return { readyToSend: 0, attentionAlerts: 0, total: 0 }
    }

    const [
      // Count scheduled + completed jobs (queue candidates)
      { count: queueCandidateCount },
      // Count distinct enrolled job_ids (any status)
      { data: enrolledJobIds },
      // Count failed/bounced sends (excluding acknowledged)
      { count: failedSendsCount },
      // Count unresolved feedback
      { count: unresolvedFeedbackCount },
    ] = await Promise.all([
      supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', business.id)
        .in('status', ['scheduled', 'completed']),

      supabase
        .from('campaign_enrollments')
        .select('job_id')
        .eq('business_id', business.id),

      supabase
        .from('send_logs')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', business.id)
        .in('status', ['failed', 'bounced'])
        .not('error_message', 'like', '[ACK]%'),

      supabase
        .from('customer_feedback')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', business.id)
        .is('resolved_at', null),
    ])

    // Ready-to-send ≈ queue candidates - enrolled jobs (approximate, excludes one_off in full query)
    const enrolledCount = new Set((enrolledJobIds || []).map(e => e.job_id)).size
    const readyToSend = Math.max(0, (queueCandidateCount || 0) - enrolledCount)

    // Attention alerts = failed sends + unresolved feedback
    const attentionAlerts = (failedSendsCount || 0) + (unresolvedFeedbackCount || 0)

    return {
      readyToSend,
      attentionAlerts,
      total: readyToSend + attentionAlerts,
    }
  } catch (error) {
    console.error('Error fetching dashboard counts:', error)
    return { readyToSend: 0, attentionAlerts: 0, total: 0 }
  }
}

/**
 * Get recent campaign activity events for the RecentCampaignActivity strip.
 * Queries 4 sources in parallel: touch sends, review clicks, feedback submissions, enrollments.
 * Merges, sorts by timestamp descending, returns top `limit` events.
 */
export async function getRecentCampaignEvents(
  businessId: string,
  limit: number = 5
): Promise<CampaignEvent[]> {
  const supabase = await createClient()

  try {
    const [
      // Query A — Campaign touch sends (send_logs with campaign attribution)
      { data: touchSends },
      // Query B — Feedback submissions
      { data: feedbackRows },
      // Query C — Recent enrollments
      { data: enrollments },
      // Query D — Review clicks (campaign-attributed sends with reviewed_at set)
      { data: reviewClicks },
    ] = await Promise.all([
      supabase
        .from('send_logs')
        .select('id, status, channel, touch_number, created_at, customers!send_logs_customer_id_fkey(name), campaigns(name)')
        .eq('business_id', businessId)
        .not('campaign_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(limit),

      supabase
        .from('customer_feedback')
        .select('id, rating, submitted_at, customers!inner(name)')
        .eq('business_id', businessId)
        .order('submitted_at', { ascending: false })
        .limit(limit),

      supabase
        .from('campaign_enrollments')
        .select('id, enrolled_at, customers!inner(name), campaigns!inner(name)')
        .eq('business_id', businessId)
        .order('enrolled_at', { ascending: false })
        .limit(limit),

      supabase
        .from('send_logs')
        .select('id, reviewed_at, customers!send_logs_customer_id_fkey(name), campaigns(name)')
        .eq('business_id', businessId)
        .not('campaign_id', 'is', null)
        .not('reviewed_at', 'is', null)
        .order('reviewed_at', { ascending: false })
        .limit(limit),
    ])

    const events: CampaignEvent[] = []

    // Map Query A results — touch sends
    for (const row of touchSends || []) {
      const customer = Array.isArray(row.customers) ? row.customers[0] : row.customers
      const campaign = Array.isArray(row.campaigns) ? row.campaigns[0] : row.campaigns
      events.push({
        id: `touch-${row.id}`,
        type: 'touch_sent',
        customerName: customer?.name || 'Unknown',
        campaignName: campaign?.name || 'Campaign',
        touchNumber: row.touch_number ?? undefined,
        channel: row.channel as 'email' | 'sms' | undefined,
        status: row.status,
        timestamp: row.created_at,
      })
    }

    // Map Query B results — feedback submissions
    for (const row of feedbackRows || []) {
      const customer = Array.isArray(row.customers) ? row.customers[0] : row.customers
      events.push({
        id: `feedback-${row.id}`,
        type: 'feedback_submitted',
        customerName: customer?.name || 'Unknown',
        campaignName: 'Review feedback',
        rating: row.rating,
        timestamp: row.submitted_at,
      })
    }

    // Map Query C results — enrollments
    for (const row of enrollments || []) {
      const customer = Array.isArray(row.customers) ? row.customers[0] : row.customers
      const campaign = Array.isArray(row.campaigns) ? row.campaigns[0] : row.campaigns
      events.push({
        id: `enroll-${row.id}`,
        type: 'enrollment',
        customerName: customer?.name || 'Unknown',
        campaignName: campaign?.name || 'Campaign',
        timestamp: row.enrolled_at,
      })
    }

    // Map Query D results — review clicks
    for (const row of reviewClicks || []) {
      const customer = Array.isArray(row.customers) ? row.customers[0] : row.customers
      const campaign = Array.isArray(row.campaigns) ? row.campaigns[0] : row.campaigns
      events.push({
        id: `review-${row.id}`,
        type: 'review_click',
        customerName: customer?.name || 'Unknown',
        campaignName: campaign?.name || 'Campaign',
        timestamp: row.reviewed_at as string,
      })
    }

    // Sort by timestamp descending (most recent first) and return top `limit` items
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

    return events.slice(0, limit)
  } catch (error) {
    console.error('Error fetching recent campaign events:', error)
    return []
  }
}

/**
 * Fetch job detail data for the right panel job-detail view.
 * Returns customer info, campaign matching info, and enrollment status.
 * Returns null if job not found or unauthorized.
 */
export async function getReadyToSendJobWithCampaign(
  jobId: string,
  businessId: string
): Promise<JobPanelDetail | null> {
  const supabase = await createClient()

  try {
    // Fetch job with customer data
    const { data: job, error: jobError } = await supabase
      .from('jobs')
      .select(`
        id, service_type, status, completed_at, created_at, notes,
        campaign_override, enrollment_resolution,
        customers!inner (id, name, email, phone),
        campaign_enrollments (
          id, status,
          campaigns:campaign_id (id, name)
        )
      `)
      .eq('id', jobId)
      .eq('business_id', businessId)
      .single()

    if (jobError || !job) return null

    const customer = Array.isArray(job.customers) ? job.customers[0] : job.customers
    if (!customer) return null

    // Find the active or most recent enrollment
    type EnrollmentRow = {
      id: string
      status: string
      campaigns: { id: string; name: string } | { id: string; name: string }[] | null
    }
    const enrollments = (job.campaign_enrollments || []) as unknown as EnrollmentRow[]
    const activeEnrollment = enrollments.find(e => e.status === 'active')
    const latestEnrollment = activeEnrollment || enrollments[0] || null
    const enrollmentCampaign = latestEnrollment?.campaigns
    const enrolledCampaign = Array.isArray(enrollmentCampaign) ? enrollmentCampaign[0] : enrollmentCampaign

    // If not enrolled, find a matching active campaign for the service type
    let matchingCampaignName: string | null = null
    let matchingCampaignId: string | null = null

    if (!activeEnrollment) {
      const { data: matchedCampaign } = await supabase
        .from('campaigns')
        .select('id, name, service_type')
        .eq('business_id', businessId)
        .eq('status', 'active')
        .or(`service_type.eq.${job.service_type},service_type.is.null`)
        .order('service_type', { ascending: false, nullsFirst: false }) // service-specific first
        .limit(1)
        .single()

      if (matchedCampaign) {
        matchingCampaignName = matchedCampaign.name
        matchingCampaignId = matchedCampaign.id
      }
    }

    // Pre-flight conflict detection for scheduled jobs with no enrollment_resolution
    let potentialConflict: JobPanelDetail['potentialConflict'] = undefined
    if (job.status === 'scheduled' && !job.enrollment_resolution && job.campaign_override !== 'one_off') {
      const { data: customerActiveEnrollment } = await supabase
        .from('campaign_enrollments')
        .select('customer_id, current_touch, campaigns:campaign_id(name, campaign_touches(touch_number))')
        .eq('customer_id', customer.id)
        .eq('business_id', businessId)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle()

      if (customerActiveEnrollment) {
        const pCampaign = Array.isArray(customerActiveEnrollment.campaigns)
          ? customerActiveEnrollment.campaigns[0]
          : customerActiveEnrollment.campaigns
        const pCampaignData = pCampaign as { name: string; campaign_touches: { touch_number: number }[] } | null
        potentialConflict = {
          existingCampaignName: pCampaignData?.name || 'Unknown',
          currentTouch: customerActiveEnrollment.current_touch,
          totalTouches: pCampaignData?.campaign_touches?.length || 0,
        }
      }
    }

    return {
      id: job.id,
      customer: {
        id: customer.id,
        name: customer.name,
        email: customer.email,
        phone: customer.phone ?? null,
      },
      serviceType: job.service_type,
      status: job.status,
      completedAt: job.completed_at ?? null,
      createdAt: job.created_at,
      notes: job.notes ?? null,
      campaignOverride: job.campaign_override ?? null,
      enrollmentResolution: job.enrollment_resolution ?? null,
      matchingCampaignName,
      matchingCampaignId,
      enrollmentStatus: latestEnrollment?.status ?? null,
      enrollmentCampaignName: enrolledCampaign?.name ?? null,
      potentialConflict,
    }
  } catch (error) {
    console.error('Error fetching job panel detail:', error)
    return null
  }
}
