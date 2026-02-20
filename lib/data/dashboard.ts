import { createClient } from '@/lib/supabase/server'
import { differenceInHours } from 'date-fns'
import type {
  DashboardKPIs,
  ReadyToSendJob,
  AttentionAlert,
  DashboardCounts,
  CampaignEvent,
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
 * Get ready-to-send jobs: completed jobs not enrolled in any active campaign.
 * Uses two-step approach: fetch completed jobs, fetch enrolled jobs, filter in JS.
 */
export async function getReadyToSendJobs(
  businessId: string,
  serviceTypeTiming: Record<string, number>
): Promise<ReadyToSendJob[]> {
  const supabase = await createClient()

  try {
    // Step 1: Fetch completed jobs with customer data
    const { data: completedJobs } = await supabase
      .from('jobs')
      .select('id, service_type, completed_at, customers!inner(id, name, email)')
      .eq('business_id', businessId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: true })
      .limit(50) // Fetch more than needed, will filter down

    // Step 2: Fetch job_ids that have active campaign enrollments
    const { data: enrolledJobs } = await supabase
      .from('campaign_enrollments')
      .select('job_id')
      .eq('business_id', businessId)
      .eq('status', 'active')

    // Step 3: Filter in JavaScript - exclude jobs with active enrollments
    const enrolledJobIds = new Set((enrolledJobs || []).map(e => e.job_id))
    const unenrolledJobs = (completedJobs || []).filter(j => !enrolledJobIds.has(j.id))

    // Calculate staleness for each job
    const jobsWithUrgency = unenrolledJobs.map(job => {
      const customer = Array.isArray(job.customers) ? job.customers[0] : job.customers
      const hoursElapsed = differenceInHours(new Date(), new Date(job.completed_at || new Date()))
      const threshold = serviceTypeTiming[job.service_type] ?? 24
      const isStale = hoursElapsed > threshold

      return {
        id: job.id,
        customer: {
          id: customer?.id || '',
          name: customer?.name || '',
          email: customer?.email || '',
        },
        service_type: job.service_type,
        completed_at: job.completed_at || new Date().toISOString(),
        isStale,
        hoursElapsed,
        threshold,
      }
    })

    // Sort: stale jobs first, then by completed_at ascending (oldest first)
    jobsWithUrgency.sort((a, b) => {
      if (a.isStale !== b.isStale) return a.isStale ? -1 : 1
      return new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime()
    })

    // Limit to 20 results for display
    return jobsWithUrgency.slice(0, 20)
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
      // Count completed jobs
      { count: completedJobsCount },
      // Count enrolled jobs
      { count: enrolledJobsCount },
      // Count failed/bounced sends (excluding acknowledged)
      { count: failedSendsCount },
      // Count unresolved feedback
      { count: unresolvedFeedbackCount },
    ] = await Promise.all([
      supabase
        .from('jobs')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', business.id)
        .eq('status', 'completed'),

      supabase
        .from('campaign_enrollments')
        .select('*', { count: 'exact', head: true })
        .eq('business_id', business.id)
        .eq('status', 'active'),

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

    // Ready-to-send = completed jobs - enrolled jobs (approximate)
    const readyToSend = Math.max(0, (completedJobsCount || 0) - (enrolledJobsCount || 0))

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
