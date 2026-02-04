/**
 * TypeScript types for SMS functionality
 *
 * These types are used throughout the SMS sending pipeline,
 * from API handlers through to database storage.
 *
 * @module lib/sms/types
 */

/**
 * Parameters for sending an SMS message
 */
export interface SendSmsParams {
  /** Recipient phone number in E.164 format (e.g., +15125551234) */
  to: string
  /** Message body (max 320 chars recommended for 2 segments) */
  body: string
  /** Business ID for scoping and logging */
  businessId: string
  /** Customer ID for tracking and consent verification */
  customerId: string
  /** Send log ID for correlating with send_logs table */
  sendLogId: string
}

/**
 * Result of an SMS send operation
 */
export interface SendSmsResult {
  /** Whether the send operation succeeded */
  success: boolean
  /** Twilio message SID (for tracking and webhooks) */
  messageSid?: string
  /** Twilio message status (queued, sent, delivered, etc.) */
  status?: string
  /** Error message if send failed */
  error?: string
  /** Twilio error code for specific error handling */
  errorCode?: number
}

/**
 * Result of a quiet hours check
 */
export interface QuietHoursResult {
  /** Whether sending is allowed right now */
  canSend: boolean
  /** Next UTC time when sending will be allowed (if currently blocked) */
  nextSendTime?: Date
  /** Reason why sending is blocked */
  reason?: 'too_early' | 'too_late'
}

/**
 * Reasons an SMS might be queued for retry
 */
export type SmsRetryReason = 'quiet_hours' | 'twilio_error' | 'rate_limit'

/**
 * Status values for SMS retry queue items
 */
export type SmsRetryStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'

/**
 * Row from the sms_retry_queue table
 */
export interface SmsRetryQueueItem {
  /** Unique identifier */
  id: string
  /** Business ID (for RLS and scoping) */
  business_id: string
  /** Reference to the original send_logs entry */
  send_log_id: string
  /** Customer ID for the recipient */
  customer_id: string
  /** Current status of the retry */
  status: SmsRetryStatus
  /** Number of retry attempts made */
  attempt_count: number
  /** Maximum number of retry attempts allowed */
  max_attempts: number
  /** When this retry is scheduled to execute */
  scheduled_for: string
  /** When the last attempt was made */
  last_attempted_at: string | null
  /** Error message from the last failed attempt */
  last_error: string | null
  /** Why this message is in the retry queue */
  reason: SmsRetryReason | null
  /** When this retry was created */
  created_at: string
  /** When this retry was last updated */
  updated_at: string
}

/**
 * Input for creating a new SMS retry queue entry
 */
export interface CreateSmsRetryInput {
  /** Business ID */
  businessId: string
  /** Send log ID */
  sendLogId: string
  /** Customer ID */
  customerId: string
  /** When to retry */
  scheduledFor: Date
  /** Why we're retrying */
  reason: SmsRetryReason
  /** Error message from initial attempt (if twilio_error) */
  lastError?: string
}

/**
 * SMS consent status for TCPA compliance
 */
export type SmsConsentStatus = 'opted_in' | 'opted_out' | 'unknown'

/**
 * Customer with SMS-relevant fields
 */
export interface SmsEligibleCustomer {
  /** Customer ID */
  id: string
  /** Customer name */
  name: string
  /** Phone number in E.164 format */
  phone: string
  /** Phone validation status */
  phone_status: 'valid' | 'invalid' | 'missing'
  /** SMS consent status */
  sms_consent_status: SmsConsentStatus
  /** Customer's timezone for quiet hours */
  timezone: string
}
