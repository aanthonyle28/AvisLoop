import type { MessageChannel, ServiceType } from '@/lib/types/database'

// Touch configuration for presets
export interface PresetTouch {
  touch_number: number
  channel: MessageChannel
  delay_hours: number
}

// Campaign preset definition (mirrors seeded data)
export interface CampaignPreset {
  id: 'conservative' | 'standard' | 'aggressive'
  name: string
  description: string
  touches: PresetTouch[]
  recommended_for: ServiceType[]  // Service types this preset works well for
}

export const CAMPAIGN_PRESETS: CampaignPreset[] = [
  {
    id: 'conservative',
    name: 'Gentle Follow-Up',
    description: 'Two emails over 3 days. Good for established relationships or high-ticket services.',
    touches: [
      { touch_number: 1, channel: 'email', delay_hours: 24 },
      { touch_number: 2, channel: 'email', delay_hours: 72 },
    ],
    recommended_for: ['hvac', 'plumbing', 'electrical', 'roofing'],
  },
  {
    id: 'standard',
    name: 'Standard Follow-Up',
    description: 'Two emails and a text message over 7 days. Works well for most businesses.',
    touches: [
      { touch_number: 1, channel: 'email', delay_hours: 24 },
      { touch_number: 2, channel: 'email', delay_hours: 72 },
      { touch_number: 3, channel: 'sms', delay_hours: 168 },
    ],
    recommended_for: ['painting', 'handyman', 'other'],
  },
  {
    id: 'aggressive',
    name: 'Aggressive Follow-Up',
    description: 'A text within hours, then email and SMS reminders. Best for quick-turnaround services like cleaning.',
    touches: [
      { touch_number: 1, channel: 'sms', delay_hours: 4 },
      { touch_number: 2, channel: 'email', delay_hours: 24 },
      { touch_number: 3, channel: 'sms', delay_hours: 72 },
      { touch_number: 4, channel: 'email', delay_hours: 168 },
    ],
    recommended_for: ['cleaning'],
  },
]

// Get preset by ID
export function getPresetById(id: string): CampaignPreset | undefined {
  return CAMPAIGN_PRESETS.find(p => p.id === id)
}

// Default enrollment cooldown in days
export const DEFAULT_ENROLLMENT_COOLDOWN_DAYS = 30
export const MIN_ENROLLMENT_COOLDOWN_DAYS = 7
export const MAX_ENROLLMENT_COOLDOWN_DAYS = 90

// Conflict resolution timing
export const QUEUE_AFTER_GAP_DAYS = 7       // Days to wait after sequence ends before auto-enrolling queued jobs
export const CONFLICT_AUTO_RESOLVE_HOURS = 24 // Hours before stale conflicts are auto-resolved (replace)

// Rate limits per channel per business (per hour)
export const DEFAULT_EMAIL_RATE_LIMIT = 100
export const DEFAULT_SMS_RATE_LIMIT = 100

// Quiet hours (TCPA compliance)
export const QUIET_HOURS = {
  start: 21,  // 9 PM
  end: 8,     // 8 AM
} as const

// Touch status display labels
export const TOUCH_STATUS_LABELS: Record<string, string> = {
  pending: 'Scheduled',
  sent: 'Sent',
  skipped: 'Skipped',
  failed: 'Failed',
}

// Enrollment status display labels
export const ENROLLMENT_STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  completed: 'Completed',
  stopped: 'Stopped',
}

// Stop reason display labels
export const STOP_REASON_LABELS: Record<string, string> = {
  review_clicked: 'Customer clicked review link',
  feedback_submitted: 'Customer submitted feedback',
  opted_out_sms: 'Opted out of SMS',
  opted_out_email: 'Opted out of email',
  owner_stopped: 'Manually stopped',
  campaign_paused: 'Campaign paused',
  campaign_deleted: 'Campaign deleted',
  repeat_job: 'New job enrolled (restart)',
}
