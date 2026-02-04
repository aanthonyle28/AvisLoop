/**
 * Twilio webhook signature validation helpers
 *
 * This module provides utilities for validating incoming Twilio webhooks
 * to prevent forgery attacks. Both inbound SMS and delivery status webhooks
 * MUST validate signatures before processing.
 *
 * @module lib/sms/webhook-validation
 */

import twilio from 'twilio'

const authToken = process.env.TWILIO_AUTH_TOKEN

/**
 * Validate Twilio webhook request signature.
 * CRITICAL: Always validate to prevent forgery attacks.
 *
 * Twilio signs each webhook request with HMAC-SHA1 using your auth token.
 * This function verifies that signature matches the expected value.
 *
 * @param signature - X-Twilio-Signature header value
 * @param url - Full webhook URL (must match exactly what Twilio sees)
 * @param params - Parsed URL-encoded body parameters
 * @returns true if signature is valid
 */
export function validateTwilioRequest(
  signature: string,
  url: string,
  params: Record<string, string>
): boolean {
  if (!authToken) {
    console.error('TWILIO_AUTH_TOKEN not configured')
    return false
  }

  return twilio.validateRequest(authToken, signature, url, params)
}

/**
 * Parse URL-encoded form body into params object.
 * Twilio sends webhooks as application/x-www-form-urlencoded.
 *
 * @param body - Raw request body string
 * @returns Parsed parameters as key-value pairs
 */
export function parseWebhookBody(body: string): Record<string, string> {
  const params: Record<string, string> = {}
  const searchParams = new URLSearchParams(body)
  searchParams.forEach((value, key) => {
    params[key] = value
  })
  return params
}

/**
 * Build webhook URL from request for signature validation.
 * Uses NEXT_PUBLIC_SITE_URL to ensure URL matches what Twilio sees.
 *
 * IMPORTANT: URL must match exactly (protocol, host, path, no trailing slash).
 * When behind a proxy/CDN, the internal URL won't match - use the public URL.
 *
 * @param pathname - The webhook path (e.g., '/api/webhooks/twilio/inbound')
 * @returns The full public URL
 */
export function buildWebhookUrl(pathname: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  return `${baseUrl}${pathname}`
}
