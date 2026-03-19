// Database table types for businesses and message_templates
// These types match the schema in supabase/migrations

/**
 * Onboarding checklist state stored in businesses.onboarding_checklist
 * V2-aligned: tracks jobs and campaigns, NOT customers or manual sends
 */
export interface OnboardingChecklist {
  /** User has added at least one job */
  first_job_added: boolean
  /** User has reviewed their campaign settings */
  campaign_reviewed: boolean
  /** User has completed (not just added) at least one job */
  job_completed: boolean
  /** A customer has clicked through to leave a review (funnel success) */
  first_review_click: boolean
  /** User has dismissed the Getting Started checklist */
  dismissed: boolean
  /** Timestamp when checklist was dismissed */
  dismissed_at: string | null
  /** Checklist is collapsed (header only) - auto after 3 days */
  collapsed: boolean
  /** Timestamp when user first saw the checklist (for auto-collapse) */
  first_seen_at: string | null
}

export interface Business {
  id: string
  user_id: string
  name: string
  google_review_link: string | null
  default_sender_name: string | null
  default_template_id: string | null
  phone: string | null
  software_used: string | null
  sms_consent_acknowledged: boolean
  sms_consent_acknowledged_at: string | null
  tier: 'basic' | 'pro' | 'trial'
  stripe_customer_id: string | null
  onboarding_checklist: OnboardingChecklist | null
  review_cooldown_days: number
  custom_service_names: string[] | null
  service_types_enabled: string[] | null
  service_type_timing: Record<string, number> | null
  created_at: string
  updated_at: string
  // Agency metadata (all nullable -- only populated for agency-managed businesses)
  google_rating_start: number | null
  google_rating_current: number | null
  review_count_start: number | null
  review_count_current: number | null
  monthly_fee: number | null
  start_date: string | null         // DATE stored as ISO string
  gbp_access: boolean | null
  competitor_name: string | null
  competitor_review_count: number | null
  agency_notes: string | null
  // AI personalization brand voice (preset key or "preset|custom text")
  brand_voice: string | null
  // Public job completion form token (generated on demand via Settings)
  form_token: string | null
  // Public client intake form token (generated on demand via Businesses page)
  intake_token: string | null
  // Web design pivot discriminator (DATA-01)
  // 'reputation' = review automation only (default for all existing rows)
  // 'web_design' = web design CRM features only
  // 'both' = all features
  client_type: 'reputation' | 'web_design' | 'both'
  // Web design client fields (DATA-02, added Phase 72)
  // All nullable — only populated for web_design / both client_type
  owner_name: string | null
  owner_email: string | null
  owner_phone: string | null
  web_design_tier: 'basic' | 'advanced' | null
  domain: string | null
  vercel_project_url: string | null
  live_website_url: string | null
  // Client relationship status for web design clients
  status: 'active' | 'paused' | 'churned' | null
}

// ─────────────────────────────────────────────────────────────────────────────
// Web Design Project types (v4.0 pivot)
// ─────────────────────────────────────────────────────────────────────────────

export type WebProjectStatus =
  | 'discovery'
  | 'design'
  | 'development'
  | 'review'
  | 'live'
  | 'maintenance'
  | 'paused'
  | 'cancelled'

export type WebDesignTier = 'basic' | 'advanced'

export interface WebProject {
  id: string
  business_id: string
  project_name: string | null
  domain: string | null
  vercel_project_id: string | null
  status: WebProjectStatus
  subscription_tier: WebDesignTier | null
  subscription_started_at: string | null    // DATE as ISO string
  subscription_monthly_fee: number | null   // USD
  has_review_addon: boolean
  client_name: string | null
  client_email: string | null
  client_phone: string | null
  kickoff_date: string | null               // DATE as ISO string
  target_launch_date: string | null         // DATE as ISO string
  launched_at: string | null                // TIMESTAMPTZ as ISO string
  portal_token: string | null
  page_count: number | null
  project_notes: string | null
  created_at: string
  updated_at: string
}

export type TicketStatus = 'open' | 'in_progress' | 'waiting_client' | 'resolved' | 'closed' | 'submitted' | 'completed'
export type TicketPriority = 'low' | 'normal' | 'high' | 'urgent'
export type TicketSource = 'agency' | 'client_portal'

export interface ProjectTicket {
  id: string
  project_id: string
  business_id: string
  title: string
  description: string | null
  status: TicketStatus
  priority: TicketPriority
  source: TicketSource
  is_revision: boolean
  is_overage: boolean
  overage_fee: number | null             // USD amount charged when is_overage = true (e.g. 50.00)
  resolved_at: string | null
  resolved_by: string | null              // UUID of auth.users
  completed_at: string | null             // When status → completed
  internal_notes: string | null
  created_at: string
  updated_at: string
}

export type TicketAuthorType = 'agency' | 'client'

export interface TicketMessage {
  id: string
  ticket_id: string
  business_id: string
  author_type: TicketAuthorType
  author_name: string | null
  body: string
  attachment_urls: string[] | null
  created_at: string
  // No updated_at: messages are append-only
}

/** ProjectTicket with its associated messages — used in TicketDetailDrawer */
export interface TicketWithMessages {
  ticket: ProjectTicket
  messages: TicketMessage[]
}

/** ProjectTicket extended with project and business name — used in operator all-tickets view */
export interface TicketWithContext extends ProjectTicket {
  project: Pick<WebProject, 'id' | 'domain' | 'subscription_tier'>
  business_name: string
}

// Message channel literal union
export type MessageChannel = 'email' | 'sms'

// Unified message template supporting both email and SMS
export interface MessageTemplate {
  id: string
  business_id: string | null  // NULL for system templates
  name: string
  subject: string        // Required for email, empty string for SMS
  body: string
  channel: MessageChannel
  service_type: ServiceType | null  // Links to service category
  is_default: boolean
  created_at: string
  updated_at: string
}

// Insert type (omit auto-generated fields)
export type MessageTemplateInsert = Omit<MessageTemplate, 'id' | 'created_at' | 'updated_at'>

// Update type (partial, omit immutable fields)
export type MessageTemplateUpdate = Partial<Omit<MessageTemplate, 'id' | 'business_id' | 'created_at' | 'updated_at'>>

// Combined type for business with nested templates
export interface BusinessWithMessageTemplates extends Business {
  message_templates: MessageTemplate[]
}

// Insert/Update types (omit auto-generated fields)
export type BusinessInsert = Omit<Business, 'id' | 'created_at' | 'updated_at'>
export type BusinessUpdate = Partial<Omit<Business, 'id' | 'user_id' | 'created_at' | 'updated_at'>>

export interface Customer {
  id: string
  business_id: string
  name: string
  email: string
  phone: string | null
  phone_status: 'valid' | 'invalid' | 'missing'
  tags: string[]
  status: 'active' | 'archived'
  opted_out: boolean
  notes?: string
  timezone: string | null
  sms_consent_status: 'opted_in' | 'opted_out' | 'unknown'
  sms_consent_at: string | null
  sms_consent_source: string | null
  sms_consent_method: 'verbal_in_person' | 'phone_call' | 'service_agreement' | 'website_form' | 'other' | null
  sms_consent_notes: string | null
  sms_consent_ip: string | null
  sms_consent_captured_by: string | null
  last_sent_at: string | null
  send_count: number
  created_at: string
  updated_at: string
}

export type CustomerInsert = Omit<Customer, 'id' | 'created_at' | 'updated_at' | 'last_sent_at' | 'send_count'>
export type CustomerUpdate = Partial<Omit<Customer, 'id' | 'business_id' | 'created_at' | 'updated_at'>>

/** @deprecated Use Customer instead */
export type Contact = Customer
export type ContactInsert = CustomerInsert
export type ContactUpdate = CustomerUpdate

// Service type literal union
export type ServiceType = 'hvac' | 'plumbing' | 'electrical' | 'cleaning' | 'roofing' | 'painting' | 'handyman' | 'other'

// Job status literal union - V2 three-state workflow
export type JobStatus = 'scheduled' | 'completed' | 'do_not_send'

// Enrollment resolution state for conflict handling
export type EnrollmentResolution = 'conflict' | 'queue_after' | 'skipped' | 'suppressed' | 'replace_on_complete'

// Job interface matching database schema
export interface Job {
  id: string
  business_id: string
  customer_id: string
  service_type: ServiceType
  status: JobStatus
  notes: string | null
  campaign_override: string | null
  enrollment_resolution: EnrollmentResolution | null
  conflict_detected_at: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

// Job with joined customer data for list views
export interface JobWithCustomer extends Job {
  customers: Pick<Customer, 'id' | 'name' | 'email' | 'phone'>
}

// Conflict detail for jobs with enrollment_resolution = 'conflict' or 'queue_after'
export interface ConflictDetail {
  existingCampaignName: string
  currentTouch: number
  totalTouches: number
}

// Job with customer and enrollment data for jobs list with campaign preview
export interface JobWithEnrollment extends JobWithCustomer {
  campaign_enrollments: Array<{
    id: string
    status: EnrollmentStatus
    campaigns: Pick<Campaign, 'id' | 'name'> | null
  }>
  // Added client-side for scheduled jobs without enrollment
  matchingCampaign?: { campaignName: string; firstTouchDelay: number } | null
  // Resolved campaign_override UUID → campaign name (for display in columns)
  overrideCampaign?: { campaignName: string; firstTouchDelay: number } | null
  // Active enrollment info for conflict/queue_after jobs
  conflictDetail?: ConflictDetail
  // Pre-flight conflict detected for scheduled jobs (customer has active enrollment)
  potentialConflict?: ConflictDetail
}

// Insert type (omit auto-generated fields)
export type JobInsert = Omit<Job, 'id' | 'created_at' | 'updated_at'>

// Update type (partial, omit immutable fields)
export type JobUpdate = Partial<Omit<Job, 'id' | 'business_id' | 'created_at' | 'updated_at'>>

export interface SendLog {
  id: string
  business_id: string
  customer_id: string
  template_id: string | null
  status: 'pending' | 'sent' | 'delivered' | 'bounced' | 'complained' | 'failed' | 'opened'
  provider_id: string | null
  error_message: string | null
  subject: string
  reviewed_at: string | null
  created_at: string
  updated_at: string
}

export type SendLogInsert = Omit<SendLog, 'id' | 'created_at' | 'updated_at' | 'provider_id' | 'error_message'>
export type SendLogUpdate = Partial<Pick<SendLog, 'status' | 'provider_id' | 'error_message'>>

// Combined type for send history display with customer info
// Includes last_sent_at for cooldown calculations in the request detail drawer
export interface SendLogWithCustomer extends SendLog {
  customers: Pick<Customer, 'name' | 'email' | 'last_sent_at'>
}

// Subscription types for Stripe billing
export interface Subscription {
  id: string                    // Stripe subscription ID (sub_xxx)
  business_id: string
  status: 'active' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'trialing' | 'unpaid'
  price_id: string
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  canceled_at: string | null
  created_at: string
  updated_at: string
}

export type SubscriptionInsert = Omit<Subscription, 'created_at' | 'updated_at'>
export type SubscriptionUpdate = Partial<Omit<Subscription, 'id' | 'business_id' | 'created_at' | 'updated_at'>>

// Scheduled send types
export interface ScheduledSend {
  id: string
  business_id: string
  contact_ids: string[]
  template_id: string | null
  custom_subject: string | null
  scheduled_for: string
  status: 'pending' | 'completed' | 'failed' | 'cancelled'
  executed_at: string | null
  send_log_ids: string[] | null
  error_message: string | null
  created_at: string
  updated_at: string
}

export type ScheduledSendInsert = Omit<ScheduledSend, 'id' | 'created_at' | 'updated_at' | 'executed_at' | 'send_log_ids' | 'error_message'>

export type ScheduleActionState = {
  error?: string
  success?: boolean
  data?: { scheduledSendId: string; scheduledFor: string }
}

// Batch send action state for server actions
export type BatchSendActionState = {
  error?: string
  success?: boolean
  data?: {
    sent: number
    skipped: number
    failed: number
    details?: Array<{
      contactId: string
      contactName: string
      status: 'sent' | 'skipped' | 'failed'
      reason?: string
    }>
  }
}

// Send log detail for scheduled sends with contact info
export interface SendLogDetail {
  id: string
  customer_id: string
  status: string
  error_message: string | null
  customers: { name: string; email: string }
}

// Scheduled send with per-contact send_log details
export interface ScheduledSendWithDetails extends ScheduledSend {
  sendLogs: SendLogDetail[]
}

// Campaign status literal union
export type CampaignStatus = 'active' | 'paused'

// Campaign definition
export interface Campaign {
  id: string
  business_id: string | null  // NULL for system presets
  name: string
  service_type: ServiceType | null  // NULL = all services
  status: CampaignStatus
  is_preset: boolean
  personalization_enabled: boolean  // AI personalization toggle (default: true)
  created_at: string
  updated_at: string
}

// Insert type
export type CampaignInsert = Omit<Campaign, 'id' | 'created_at' | 'updated_at'>

// Update type
export type CampaignUpdate = Partial<Omit<Campaign, 'id' | 'business_id' | 'is_preset' | 'created_at' | 'updated_at'>>

// Campaign touch in a sequence
export interface CampaignTouch {
  id: string
  campaign_id: string
  touch_number: number  // 1-4
  channel: MessageChannel
  delay_hours: number
  template_id: string | null
  created_at: string
}

export type CampaignTouchInsert = Omit<CampaignTouch, 'id' | 'created_at'>
export type CampaignTouchUpdate = Partial<Omit<CampaignTouch, 'id' | 'campaign_id' | 'created_at'>>

// Campaign with nested touches for full view
export interface CampaignWithTouches extends Campaign {
  campaign_touches: CampaignTouch[]
}

// Enrollment status state machine
export type EnrollmentStatus = 'active' | 'completed' | 'stopped' | 'frozen'

// Stop reason when enrollment ends
export type EnrollmentStopReason =
  | 'review_clicked'
  | 'feedback_submitted'
  | 'opted_out_sms'
  | 'opted_out_email'
  | 'owner_stopped'
  | 'campaign_paused'
  | 'campaign_deleted'
  | 'repeat_job'

// Touch status within enrollment
export type TouchStatus = 'pending' | 'sent' | 'skipped' | 'failed'

// Campaign enrollment tracking
export interface CampaignEnrollment {
  id: string
  business_id: string
  campaign_id: string
  job_id: string
  customer_id: string
  status: EnrollmentStatus
  stop_reason: EnrollmentStopReason | null
  current_touch: number  // 1-4
  touch_1_scheduled_at: string | null
  touch_1_sent_at: string | null
  touch_1_status: TouchStatus | null
  touch_2_scheduled_at: string | null
  touch_2_sent_at: string | null
  touch_2_status: TouchStatus | null
  touch_3_scheduled_at: string | null
  touch_3_sent_at: string | null
  touch_3_status: TouchStatus | null
  touch_4_scheduled_at: string | null
  touch_4_sent_at: string | null
  touch_4_status: TouchStatus | null
  enrolled_at: string
  completed_at: string | null
  stopped_at: string | null
  created_at: string
  updated_at: string
}

export type CampaignEnrollmentInsert = Omit<CampaignEnrollment,
  'id' | 'created_at' | 'updated_at' | 'completed_at' | 'stopped_at'
>

// Enrollment with related data for list views
export interface CampaignEnrollmentWithDetails extends CampaignEnrollment {
  customers: Pick<Customer, 'id' | 'name' | 'email' | 'phone'>
  jobs: Pick<Job, 'id' | 'service_type' | 'completed_at'>
  campaigns: Pick<Campaign, 'id' | 'name'>
}

// Claimed touch from RPC for cron processing
export interface ClaimedCampaignTouch {
  enrollment_id: string
  business_id: string
  campaign_id: string
  job_id: string
  customer_id: string
  touch_number: number
  channel: MessageChannel
  template_id: string | null
  scheduled_at: string
  personalization_enabled: boolean  // Campaign-level AI toggle
}
