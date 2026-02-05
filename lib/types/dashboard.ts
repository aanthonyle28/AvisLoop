import type { ServiceType } from './database'

// KPI data with trend comparisons
export interface KPIMetric {
  value: number
  previousValue: number
  trend: number          // percentage change (positive = up, negative = down)
  trendPeriod: string    // "vs last week" or "vs last month"
}

export interface DashboardKPIs {
  // Outcome metrics (large cards, monthly comparison)
  reviewsThisMonth: KPIMetric
  averageRating: KPIMetric       // 0-5 scale
  conversionRate: KPIMetric      // percentage: reviews / total sends

  // Pipeline metrics (smaller cards, weekly comparison)
  requestsSentThisWeek: KPIMetric
  activeSequences: KPIMetric     // active campaign enrollments
  pendingQueued: KPIMetric       // pending/scheduled sends
}

// Ready-to-send job (completed but not enrolled)
export interface ReadyToSendJob {
  id: string
  customer: { id: string; name: string; email: string }
  service_type: ServiceType
  completed_at: string
  isStale: boolean           // exceeds optimal service type window
  hoursElapsed: number
  threshold: number          // from business.service_type_timing
}

// Attention alert with contextual action
export type AlertSeverity = 'critical' | 'warning' | 'info'
export type AlertType = 'failed_send' | 'bounced_email' | 'stop_request' | 'unresolved_feedback'

export interface AttentionAlert {
  id: string
  severity: AlertSeverity
  type: AlertType
  title: string
  description: string
  timestamp: string
  contextualAction: {
    label: string
    href: string
  }
  // For retry actions (failed sends)
  retryable?: boolean
  sendLogId?: string
  // For feedback alerts
  feedbackId?: string
}

// Aggregate counts for banner and nav badge
export interface DashboardCounts {
  readyToSend: number
  attentionAlerts: number
  total: number              // readyToSend + attentionAlerts
}

// Quick enroll result for dashboard inline actions
export type QuickEnrollResult = {
  success: boolean
  error?: string
  enrolled?: boolean
  campaignName?: string
  noMatchingCampaign?: boolean  // true if no campaign exists for service type
  serviceType?: string
}
