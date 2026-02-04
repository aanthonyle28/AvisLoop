/**
 * Zod validation schemas for SMS messages
 *
 * Provides validation for SMS content with character limits
 * and segment estimation for cost optimization.
 *
 * @module lib/validations/sms
 */

import { z } from 'zod'

/**
 * GSM-7 single segment character limit
 * Messages up to this length are sent as one segment
 */
export const GSM7_LIMIT = 160

/**
 * SMS soft limit (2 segments)
 * Recommended maximum for cost-effective messaging
 */
export const SMS_SOFT_LIMIT = 320

/**
 * SMS hard limit (3 segments)
 * Maximum allowed length to prevent accidental high costs
 */
export const SMS_HARD_LIMIT = 480

/**
 * Multi-part message segment size
 * When messages exceed 160 chars, each segment holds 153 chars
 * (7 chars reserved for concatenation headers)
 */
export const MULTIPART_SEGMENT_SIZE = 153

/**
 * Validation schema for SMS message input
 */
export const smsMessageSchema = z.object({
  /** Message body with character limit */
  body: z.string()
    .min(1, 'Message is required')
    .max(SMS_SOFT_LIMIT, `Message cannot exceed ${SMS_SOFT_LIMIT} characters`),
  /** Customer ID (UUID) */
  customerId: z.string().uuid('Invalid customer ID'),
  /** Optional template ID (UUID) */
  templateId: z.string().uuid('Invalid template ID').optional(),
})

/**
 * Type for validated SMS message input
 */
export type SmsMessageInput = z.infer<typeof smsMessageSchema>

/**
 * Validation schema for bulk SMS sending
 */
export const bulkSmsSchema = z.object({
  /** Message body */
  body: z.string()
    .min(1, 'Message is required')
    .max(SMS_SOFT_LIMIT, `Message cannot exceed ${SMS_SOFT_LIMIT} characters`),
  /** Array of customer IDs */
  customerIds: z.array(z.string().uuid('Invalid customer ID'))
    .min(1, 'At least one customer required')
    .max(100, 'Maximum 100 recipients per bulk send'),
  /** Optional template ID */
  templateId: z.string().uuid('Invalid template ID').optional(),
})

/**
 * Type for validated bulk SMS input
 */
export type BulkSmsInput = z.infer<typeof bulkSmsSchema>

/**
 * Check if message fits in a single SMS segment
 *
 * @param body - The message text
 * @returns true if message is 160 characters or less
 */
export function isSingleSegment(body: string): boolean {
  return body.length <= GSM7_LIMIT
}

/**
 * Estimate the number of SMS segments for a message
 *
 * This is a simplified estimate that doesn't account for GSM-7 vs UCS-2 encoding.
 * GSM-7 supports basic Latin characters (160 chars/segment single, 153 multi).
 * UCS-2 is used for Unicode/emoji (70 chars/segment single, 67 multi).
 *
 * @param body - The message text
 * @returns Estimated number of segments
 */
export function estimateSegments(body: string): number {
  if (!body || body.length === 0) return 0
  if (body.length <= GSM7_LIMIT) return 1
  return Math.ceil(body.length / MULTIPART_SEGMENT_SIZE)
}

/**
 * Check if message contains non-GSM-7 characters (emoji, unicode)
 * These require UCS-2 encoding which has lower character limits
 *
 * @param body - The message text
 * @returns true if message contains characters requiring UCS-2
 */
export function containsUnicodeChars(body: string): boolean {
  // GSM-7 basic character set (simplified check)
  // Full GSM-7 includes more characters, but this catches common cases
  const gsm7Regex = /^[@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&'()*+,\-./0-9:;<=>?¡A-ZÄÖÑܧ¿a-zäöñüà]*$/
  return !gsm7Regex.test(body)
}

/**
 * Get detailed segment information for a message
 *
 * @param body - The message text
 * @returns Segment count, encoding type, and character info
 */
export function getSegmentInfo(body: string): {
  segments: number
  encoding: 'gsm7' | 'ucs2'
  charsRemaining: number
  maxChars: number
} {
  const isUnicode = containsUnicodeChars(body)

  if (isUnicode) {
    // UCS-2 encoding: 70 chars single segment, 67 per multi-segment
    const singleLimit = 70
    const multiLimit = 67

    if (body.length <= singleLimit) {
      return {
        segments: 1,
        encoding: 'ucs2',
        charsRemaining: singleLimit - body.length,
        maxChars: singleLimit,
      }
    }

    const segments = Math.ceil(body.length / multiLimit)
    const maxChars = segments * multiLimit
    return {
      segments,
      encoding: 'ucs2',
      charsRemaining: maxChars - body.length,
      maxChars,
    }
  }

  // GSM-7 encoding: 160 chars single segment, 153 per multi-segment
  if (body.length <= GSM7_LIMIT) {
    return {
      segments: 1,
      encoding: 'gsm7',
      charsRemaining: GSM7_LIMIT - body.length,
      maxChars: GSM7_LIMIT,
    }
  }

  const segments = Math.ceil(body.length / MULTIPART_SEGMENT_SIZE)
  const maxChars = segments * MULTIPART_SEGMENT_SIZE
  return {
    segments,
    encoding: 'gsm7',
    charsRemaining: maxChars - body.length,
    maxChars,
  }
}
