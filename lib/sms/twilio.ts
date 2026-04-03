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
 *   - TWILIO_MESSAGING_SERVICE_SID: Your Twilio Messaging Service SID (A2P 10DLC)
 *
 * @module lib/sms/twilio
 */

import 'server-only'
import twilio from 'twilio'

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN

/**
 * The Twilio Messaging Service SID for A2P 10DLC compliant sending.
 * The Messaging Service automatically selects the best number from its sender pool.
 */
export const TWILIO_MESSAGING_SERVICE_SID = process.env.TWILIO_MESSAGING_SERVICE_SID

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
 * Requires both the Twilio client and a Messaging Service SID configured
 *
 * @returns true if SMS can be sent, false otherwise
 */
export function isSmsEnabled(): boolean {
  return twilioClient !== null && !!TWILIO_MESSAGING_SERVICE_SID
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
 * Get the Twilio Messaging Service SID, throwing if not configured
 *
 * @throws Error if TWILIO_MESSAGING_SERVICE_SID is not set
 * @returns The Messaging Service SID
 */
export function getTwilioMessagingServiceSid(): string {
  if (!TWILIO_MESSAGING_SERVICE_SID) {
    throw new Error(
      'Twilio Messaging Service SID not configured. Set TWILIO_MESSAGING_SERVICE_SID environment variable.'
    )
  }
  return TWILIO_MESSAGING_SERVICE_SID
}
