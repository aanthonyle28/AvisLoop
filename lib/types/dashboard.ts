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
  /** Pre-flight conflict: scheduled job whose customer is in an active enrollment (no resolution set yet) */
  potentialConflict?: {
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

// Right panel state machine for dashboard command center
export type RightPanelView =
  | { type: 'default' }
  | { type: 'job-detail'; jobId: string }
  | { type: 'attention-detail'; alertId: string }

// Props for items that can be selected in left column lists
export interface SelectableJobItem {
  id: string
  customerName: string
  serviceType: string
  completedAt: string
  campaignName: string | null
}

export interface SelectableAlertItem {
  id: string
  type: AlertType
  severity: AlertSeverity
  title: string
  description: string
  customerName: string
  timestamp: string
  // For failed sends
  retryable?: boolean
  sendLogId?: string
  errorMessage?: string
  // For feedback
  feedbackId?: string
  rating?: number
  feedbackText?: string
}

// Job detail data for the right panel view (fetched on demand)
export interface JobPanelDetail {
  id: string
  customer: { id: string; name: string; email: string; phone: string | null }
  serviceType: string
  status: string
  completedAt: string | null
  createdAt: string
  notes: string | null
  campaignOverride: string | null
  enrollmentResolution: string | null
  // Campaign info for display
  matchingCampaignName: string | null
  matchingCampaignId: string | null
  // Enrollment info if already enrolled
  enrollmentStatus: string | null
  enrollmentCampaignName: string | null
  /** Pre-flight conflict: scheduled job whose customer is in an active enrollment */
  potentialConflict?: {
    existingCampaignName: string
    currentTouch: number
    totalTouches: number
  }
}
