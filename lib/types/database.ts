// Database table types for businesses and email_templates
// These types match the schema in supabase/migrations/00002_create_business.sql

export interface Business {
  id: string
  user_id: string
  name: string
  google_review_link: string | null
  default_sender_name: string | null
  default_template_id: string | null
  tier: 'basic' | 'pro' | 'trial'
  stripe_customer_id: string | null
  created_at: string
  updated_at: string
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

/** @deprecated Use MessageTemplate with channel='email' instead */
export interface EmailTemplate {
  id: string
  business_id: string
  name: string
  subject: string
  body: string
  is_default: boolean
  created_at: string
  updated_at: string
}

// Combined type for business with nested templates (from Supabase joins)
export interface BusinessWithTemplates extends Business {
  email_templates: EmailTemplate[]  // Keep for backward compat
  message_templates?: MessageTemplate[]  // New unified templates
}

// Insert/Update types (omit auto-generated fields)
export type BusinessInsert = Omit<Business, 'id' | 'created_at' | 'updated_at'>
export type BusinessUpdate = Partial<Omit<Business, 'id' | 'user_id' | 'created_at' | 'updated_at'>>

export type EmailTemplateInsert = Omit<EmailTemplate, 'id' | 'created_at' | 'updated_at'>
export type EmailTemplateUpdate = Partial<Omit<EmailTemplate, 'id' | 'business_id' | 'created_at' | 'updated_at'>>

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

// Job status literal union
export type JobStatus = 'completed' | 'do_not_send'

// Job interface matching database schema
export interface Job {
  id: string
  business_id: string
  customer_id: string
  service_type: ServiceType
  status: JobStatus
  notes: string | null
  completed_at: string | null
  created_at: string
  updated_at: string
}

// Job with joined customer data for list views
export interface JobWithCustomer extends Job {
  customers: Pick<Customer, 'id' | 'name' | 'email' | 'phone'>
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
export interface SendLogWithCustomer extends SendLog {
  customers: Pick<Customer, 'name' | 'email'>
}

/** @deprecated Use SendLogWithCustomer instead */
export type SendLogWithContact = SendLogWithCustomer

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
  contact_id: string
  status: string
  error_message: string | null
  contacts: { name: string; email: string }
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
export type EnrollmentStatus = 'active' | 'completed' | 'stopped'

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
}
