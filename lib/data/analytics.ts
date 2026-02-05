import { createClient } from '@/lib/supabase/server'

// Types
export interface ServiceTypeMetrics {
  serviceType: string          // e.g., "hvac", "plumbing"
  displayName: string          // e.g., "HVAC", "Plumbing"
  totalSent: number            // Total sends for this service type
  delivered: number            // Successful deliveries
  reviewed: number             // Sends where reviewed_at is set
  feedbackCount: number        // Private feedback received
  responseRate: number         // (reviewed + feedbackCount) / delivered * 100
  reviewRate: number           // reviewed / delivered * 100 (public reviews only)
}

export interface ServiceTypeAnalytics {
  byServiceType: ServiceTypeMetrics[]
  totals: {
    totalSent: number
    totalDelivered: number
    totalReviewed: number
    totalFeedback: number
    overallResponseRate: number
    overallReviewRate: number
  }
}

// Service type display names
const SERVICE_TYPE_NAMES: Record<string, string> = {
  hvac: 'HVAC',
  plumbing: 'Plumbing',
  electrical: 'Electrical',
  cleaning: 'Cleaning',
  roofing: 'Roofing',
  painting: 'Painting',
  handyman: 'Handyman',
  other: 'Other',
}

export async function getServiceTypeAnalytics(
  businessId: string
): Promise<ServiceTypeAnalytics> {
  const supabase = await createClient()

  try {
    // 1. Fetch all campaign enrollments with job service types
    const { data: enrollments, error: enrollmentsError } = await supabase
      .from('campaign_enrollments')
      .select('id, job_id, jobs!inner(service_type)')
      .eq('business_id', businessId)

    if (enrollmentsError) {
      console.error('Error fetching enrollments:', enrollmentsError)
      return emptyAnalytics()
    }

    if (!enrollments || enrollments.length === 0) {
      return emptyAnalytics()
    }

    // 2. Fetch all campaign send logs for this business
    const { data: sendLogs, error: sendLogsError } = await supabase
      .from('send_logs')
      .select('campaign_enrollment_id, status, reviewed_at')
      .eq('business_id', businessId)
      .not('campaign_enrollment_id', 'is', null)

    if (sendLogsError) {
      console.error('Error fetching send logs:', sendLogsError)
      return emptyAnalytics()
    }

    // 3. Fetch all customer feedback with enrollment IDs
    const { data: feedback, error: feedbackError } = await supabase
      .from('customer_feedback')
      .select('enrollment_id')
      .eq('business_id', businessId)
      .not('enrollment_id', 'is', null)

    if (feedbackError) {
      console.error('Error fetching feedback:', feedbackError)
      return emptyAnalytics()
    }

    // Map enrollments to service types
    const enrollmentToServiceType = new Map<string, string>()
    enrollments.forEach((enrollment) => {
      const jobs = enrollment.jobs as unknown as { service_type: string } | null
      const serviceType = jobs?.service_type
      if (serviceType) {
        enrollmentToServiceType.set(enrollment.id, serviceType)
      }
    })

    // Count feedback per enrollment
    const feedbackCountByEnrollment = new Map<string, number>()
    feedback?.forEach((fb) => {
      if (fb.enrollment_id) {
        feedbackCountByEnrollment.set(
          fb.enrollment_id,
          (feedbackCountByEnrollment.get(fb.enrollment_id) || 0) + 1
        )
      }
    })

    // Group send logs by service type
    const metricsByServiceType = new Map<
      string,
      {
        totalSent: number
        delivered: number
        reviewed: number
        feedbackCount: number
      }
    >()

    sendLogs?.forEach((log) => {
      if (!log.campaign_enrollment_id) return

      const serviceType = enrollmentToServiceType.get(log.campaign_enrollment_id)
      if (!serviceType) return

      const metrics = metricsByServiceType.get(serviceType) || {
        totalSent: 0,
        delivered: 0,
        reviewed: 0,
        feedbackCount: 0,
      }

      metrics.totalSent++

      if (log.status === 'delivered') {
        metrics.delivered++
      }

      if (log.reviewed_at) {
        metrics.reviewed++
      }

      // Count feedback for this enrollment only once per service type
      // (We'll handle this separately to avoid double-counting)
      metricsByServiceType.set(serviceType, metrics)
    })

    // Count feedback per service type
    feedback?.forEach((fb) => {
      if (!fb.enrollment_id) return

      const serviceType = enrollmentToServiceType.get(fb.enrollment_id)
      if (!serviceType) return

      const metrics = metricsByServiceType.get(serviceType)
      if (metrics) {
        metrics.feedbackCount++
      }
    })

    // Calculate rates and build result array
    const byServiceType: ServiceTypeMetrics[] = []
    let totalSent = 0
    let totalDelivered = 0
    let totalReviewed = 0
    let totalFeedback = 0

    metricsByServiceType.forEach((metrics, serviceType) => {
      const responseRate =
        metrics.delivered > 0
          ? Math.round(
              ((metrics.reviewed + metrics.feedbackCount) / metrics.delivered) * 100
            )
          : 0

      const reviewRate =
        metrics.delivered > 0
          ? Math.round((metrics.reviewed / metrics.delivered) * 100)
          : 0

      byServiceType.push({
        serviceType,
        displayName: SERVICE_TYPE_NAMES[serviceType] || serviceType,
        totalSent: metrics.totalSent,
        delivered: metrics.delivered,
        reviewed: metrics.reviewed,
        feedbackCount: metrics.feedbackCount,
        responseRate,
        reviewRate,
      })

      totalSent += metrics.totalSent
      totalDelivered += metrics.delivered
      totalReviewed += metrics.reviewed
      totalFeedback += metrics.feedbackCount
    })

    // Sort by total sent descending (most active first)
    byServiceType.sort((a, b) => b.totalSent - a.totalSent)

    // Calculate overall rates
    const overallResponseRate =
      totalDelivered > 0
        ? Math.round(((totalReviewed + totalFeedback) / totalDelivered) * 100)
        : 0

    const overallReviewRate =
      totalDelivered > 0
        ? Math.round((totalReviewed / totalDelivered) * 100)
        : 0

    return {
      byServiceType,
      totals: {
        totalSent,
        totalDelivered,
        totalReviewed,
        totalFeedback,
        overallResponseRate,
        overallReviewRate,
      },
    }
  } catch (error) {
    console.error('Unexpected error in getServiceTypeAnalytics:', error)
    return emptyAnalytics()
  }
}

function emptyAnalytics(): ServiceTypeAnalytics {
  return {
    byServiceType: [],
    totals: {
      totalSent: 0,
      totalDelivered: 0,
      totalReviewed: 0,
      totalFeedback: 0,
      overallResponseRate: 0,
      overallReviewRate: 0,
    },
  }
}
