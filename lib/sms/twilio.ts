/**
 * Twilio client singleton with environment validation
 *
 * This module provides a singleton Twilio client for SMS sending.
 * It validates environment variables at module load and exports
 * a null client if credentials are not configured, allowing
 * graceful degradation in development without Twilio.
 *
 * Required environment variables:
 *   - TWILIO_ACCOUNT_SID: Your Twilio Account SID
 *   - TWILIO_AUTH_TOKEN: Your Twilio Auth Token
 *   - TWILIO_PHONE_NUMBER: Your Twilio phone number (E.164 format)
 *
 * @module lib/sms/twilio
 */

import 'server-only'
import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN

/**
 * The Twilio phone number to send SMS from (E.164 format)
 * Must be a number that has been registered with your A2P 10DLC campaign
 */
export const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER

// Validate env vars at module load (fail fast pattern)
if (!accountSid || !authToken) {
  console.warn('Twilio credentials not configured - SMS sending disabled')
}

/**
 * Twilio client instance
 * Will be null if TWILIO_ACCOUNT_SID or TWILIO_AUTH_TOKEN are not set
 */
export const twilioClient = accountSid && authToken
  ? twilio(accountSid, authToken)
  : null

/**
 * Check if SMS sending is available
 * Requires both the Twilio client to be initialized and a phone number configured
 *
 * @returns true if SMS can be sent, false otherwise
 */
export function isSmsEnabled(): boolean {
  return twilioClient !== null && !!TWILIO_PHONE_NUMBER
}

/**
 * Get the Twilio client, throwing if not configured
 * Use this when SMS is required and should fail loudly
 *
 * @throws Error if Twilio is not configured
 * @returns The Twilio client
 */
export function getTwilioClient() {
  if (!twilioClient) {
    throw new Error(
      'Twilio is not configured. Set TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN environment variables.'
    )
  }
  return twilioClient
}

/**
 * Get the Twilio phone number, throwing if not configured
 * Use this when sending SMS and phone number is required
 *
 * @throws Error if TWILIO_PHONE_NUMBER is not set
 * @returns The Twilio phone number in E.164 format
 */
export function getTwilioPhoneNumber(): string {
  if (!TWILIO_PHONE_NUMBER) {
    throw new Error(
      'Twilio phone number not configured. Set TWILIO_PHONE_NUMBER environment variable.'
    )
  }
  return TWILIO_PHONE_NUMBER
}
