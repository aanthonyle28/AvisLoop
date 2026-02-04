/**
 * Core SMS sending function via Twilio
 *
 * This module provides the low-level SMS sending capability used by
 * all SMS sending paths in the application. It handles Twilio integration,
 * error handling, and TCPA-compliant opt-out footer appending.
 *
 * IMPORTANT: This function does NOT check quiet hours or consent.
 * The caller is responsible for those checks before calling sendSms().
 *
 * @module lib/sms/send-sms
 */

import { twilioClient, TWILIO_PHONE_NUMBER, isSmsEnabled } from './twilio'
import type { SendSmsParams, SendSmsResult } from './types'

/**
 * TCPA-compliant opt-out footer
 * Required on all SMS messages to allow recipients to unsubscribe
 */
const OPT_OUT_FOOTER = '\n\nReply STOP to opt out.'

/**
 * Common Twilio error codes for SMS
 * Use these for specific error handling and retry decisions
 */
export const TWILIO_ERROR_CODES = {
  /** Invalid 'To' phone number format */
  INVALID_TO_NUMBER: 21211,
  /** Message cannot be sent to unsubscribed recipient */
  UNSUBSCRIBED: 21610,
  /** 'To' number is not a valid mobile number */
  NOT_MOBILE: 21614,
  /** Unreachable destination handset */
  UNREACHABLE: 30003,
  /** Unknown destination handset */
  UNKNOWN_HANDSET: 30005,
  /** Landline or unreachable carrier */
  LANDLINE: 30006,
  /** Message blocked by carrier */
  CARRIER_BLOCKED: 30007,
  /** Unknown error from carrier */
  UNKNOWN: 30008,
} as const

/**
 * Send SMS via Twilio with error handling.
 * Adds TCPA-compliant opt-out footer automatically.
 *
 * IMPORTANT: This function does NOT check:
 * - Quiet hours (caller must check with checkQuietHours())
 * - SMS consent (caller must verify sms_consent_status === 'opted_in')
 * - Phone number validity (caller should check phone_status === 'valid')
 *
 * @param params - SMS parameters including recipient, message, and tracking IDs
 * @returns Promise<SendSmsResult> with success/failure status, never throws
 *
 * @example
 * const result = await sendSms({
 *   to: '+15125551234',
 *   body: 'Thanks for choosing us! How was your service?',
 *   businessId: 'uuid',
 *   customerId: 'uuid',
 *   sendLogId: 'uuid'
 * })
 *
 * if (result.success) {
 *   console.log('Sent:', result.messageSid)
 * } else {
 *   console.error('Failed:', result.error)
 *   if (!isRetryableError(result.errorCode)) {
 *     // Mark customer as unreachable via SMS
 *   }
 * }
 */
export async function sendSms(params: SendSmsParams): Promise<SendSmsResult> {
  // Check if SMS is enabled
  if (!isSmsEnabled() || !twilioClient) {
    return {
      success: false,
      error: 'SMS sending is not configured. Check Twilio environment variables.',
    }
  }

  // Validate phone number
  if (!TWILIO_PHONE_NUMBER) {
    return {
      success: false,
      error: 'Twilio phone number not configured. Set TWILIO_PHONE_NUMBER environment variable.',
    }
  }

  // Append opt-out footer if message doesn't already include STOP instruction
  const bodyWithFooter = params.body.toLowerCase().includes('stop')
    ? params.body
    : params.body + OPT_OUT_FOOTER

  try {
    const message = await twilioClient.messages.create({
      body: bodyWithFooter,
      to: params.to,
      from: TWILIO_PHONE_NUMBER,
      // Status callback for delivery tracking (will be implemented in 21-04)
      statusCallback: process.env.NEXT_PUBLIC_SITE_URL
        ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/twilio/status`
        : undefined,
    })

    return {
      success: true,
      messageSid: message.sid,
      status: message.status,
    }
  } catch (error: unknown) {
    // Handle Twilio-specific errors with error code
    if (error && typeof error === 'object' && 'code' in error && 'message' in error) {
      const twilioError = error as { code: number; message: string }
      console.error(`Twilio Error ${twilioError.code}: ${twilioError.message}`)
      return {
        success: false,
        error: twilioError.message,
        errorCode: twilioError.code,
      }
    }

    // Handle generic errors
    console.error('SMS send error:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error sending SMS',
    }
  }
}

/**
 * Check if a Twilio error is retryable (transient) vs permanent.
 * Permanent errors should not be retried as they will always fail.
 *
 * @param errorCode - Twilio error code from SendSmsResult
 * @returns true if the error is transient and retry may succeed
 *
 * @example
 * const result = await sendSms(params)
 * if (!result.success) {
 *   if (isRetryableError(result.errorCode)) {
 *     // Queue for retry
 *   } else {
 *     // Mark as permanently failed
 *   }
 * }
 */
export function isRetryableError(errorCode?: number): boolean {
  // Unknown errors default to retryable (conservative approach)
  if (!errorCode) return true

  // These errors are permanent - phone number issues that won't change
  const permanentErrors: number[] = [
    TWILIO_ERROR_CODES.INVALID_TO_NUMBER,  // Bad phone format
    TWILIO_ERROR_CODES.UNSUBSCRIBED,       // Recipient opted out
    TWILIO_ERROR_CODES.NOT_MOBILE,         // Not a mobile number
    TWILIO_ERROR_CODES.LANDLINE,           // Landline number
  ]

  return !permanentErrors.includes(errorCode)
}

/**
 * Get human-readable description of a Twilio error code
 * Useful for logging and error messages to users
 *
 * @param errorCode - Twilio error code
 * @returns Human-readable description of the error
 */
export function getTwilioErrorDescription(errorCode: number): string {
  switch (errorCode) {
    case TWILIO_ERROR_CODES.INVALID_TO_NUMBER:
      return 'Invalid phone number format'
    case TWILIO_ERROR_CODES.UNSUBSCRIBED:
      return 'Recipient has opted out of SMS'
    case TWILIO_ERROR_CODES.NOT_MOBILE:
      return 'Phone number is not a mobile number'
    case TWILIO_ERROR_CODES.UNREACHABLE:
      return 'Phone is temporarily unreachable'
    case TWILIO_ERROR_CODES.UNKNOWN_HANDSET:
      return 'Unknown phone or carrier'
    case TWILIO_ERROR_CODES.LANDLINE:
      return 'Cannot send SMS to landline'
    case TWILIO_ERROR_CODES.CARRIER_BLOCKED:
      return 'Message blocked by carrier'
    case TWILIO_ERROR_CODES.UNKNOWN:
      return 'Unknown carrier error'
    default:
      return `Twilio error code ${errorCode}`
  }
}
