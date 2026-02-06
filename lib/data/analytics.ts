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
    const { data, error } = await supabase.rpc('get_service_type_analytics', {
      p_business_id: businessId,
    })

    if (error) {
      console.error('Error fetching service type analytics:', error)
      return emptyAnalytics()
    }

    if (!data || data.length === 0) {
      return emptyAnalytics()
    }

    // Calculate rates from DB-aggregated counts
    let totalSent = 0
    let totalDelivered = 0
    let totalReviewed = 0
    let totalFeedback = 0

    const byServiceType: ServiceTypeMetrics[] = data.map((row: {
      service_type: string
      total_sent: number
      delivered: number
      reviewed: number
      feedback_count: number
    }) => {
      const sent = Number(row.total_sent)
      const del = Number(row.delivered)
      const rev = Number(row.reviewed)
      const fb = Number(row.feedback_count)

      totalSent += sent
      totalDelivered += del
      totalReviewed += rev
      totalFeedback += fb

      return {
        serviceType: row.service_type,
        displayName: SERVICE_TYPE_NAMES[row.service_type] || row.service_type,
        totalSent: sent,
        delivered: del,
        reviewed: rev,
        feedbackCount: fb,
        responseRate: del > 0 ? Math.round(((rev + fb) / del) * 100) : 0,
        reviewRate: del > 0 ? Math.round((rev / del) * 100) : 0,
      }
    })

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
