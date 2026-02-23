import type { ServiceType, EnrollmentResolution } from './database'

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

// Ready-to-send job (scheduled or completed but not enrolled)
export interface ReadyToSendJob {
  id: string
  customer: { id: string; name: string; email: string }
  service_type: ServiceType
  completed_at: string       // completed_at for completed jobs, created_at for scheduled
  isStale: boolean           // exceeds optimal service type window (completed only)
  hoursElapsed: number
  threshold: number          // from business.service_type_timing
  status: 'scheduled' | 'completed'
  campaign_override: string | null
  hasMatchingCampaign: boolean
  enrollment_resolution: EnrollmentResolution | null
  conflictDetail?: {
    existingCampaignName: string
    currentTouch: number
    totalTouches: number
  }
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

// Campaign activity event for RecentCampaignActivity strip
export type CampaignEventType = 'touch_sent' | 'review_click' | 'feedback_submitted' | 'enrollment'

export interface CampaignEvent {
  id: string
  type: CampaignEventType
  customerName: string
  campaignName: string
  touchNumber?: number
  channel?: 'email' | 'sms'
  status?: string
  rating?: number           // For feedback_submitted events
  timestamp: string
}

// Inline pipeline counters for activity strip header
export interface PipelineSummary {
  activeSequences: number
  pending: number
  requestsSentThisWeek: number
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
