/**
 * Quiet hours enforcement for TCPA-compliant SMS sending
 *
 * TCPA regulations require SMS messages to be sent only during
 * reasonable hours (8am-9pm) in the recipient's local timezone.
 *
 * This module provides functions to check quiet hours and calculate
 * the next allowable send time when outside the permitted window.
 *
 * @module lib/sms/quiet-hours
 */

import { toZonedTime, fromZonedTime } from 'date-fns-tz'
import type { QuietHoursResult } from './types'

/**
 * TCPA-compliant quiet hours boundaries
 * Sending allowed from 8:00 AM to 9:00 PM local time
 */
export const QUIET_HOURS_START = 8   // 8:00 AM
export const QUIET_HOURS_END = 21    // 9:00 PM (21:00)

/**
 * Default timezone for US-based home service businesses
 * Used when customer timezone is unknown
 */
export const DEFAULT_TIMEZONE = 'America/New_York'

/**
 * Check if current time is within quiet hours for customer's timezone.
 * Returns canSend: true if within 8am-9pm local time.
 * Returns nextSendTime (UTC) if currently in quiet hours.
 *
 * @param customerTimezone - IANA timezone string (e.g., 'America/New_York')
 * @param now - Optional current time for testing (defaults to new Date())
 * @returns QuietHoursResult with canSend status and optional nextSendTime
 *
 * @example
 * // Check if we can send to a customer in Eastern time
 * const result = checkQuietHours('America/New_York')
 * if (result.canSend) {
 *   // Send SMS now
 * } else {
 *   // Schedule for result.nextSendTime
 * }
 */
export function checkQuietHours(
  customerTimezone: string,
  now: Date = new Date()
): QuietHoursResult {
  // Validate timezone - use default if invalid
  let timezone = customerTimezone
  try {
    // Test if timezone is valid by attempting conversion
    toZonedTime(now, timezone)
  } catch {
    console.warn(`Invalid timezone "${customerTimezone}", using default: ${DEFAULT_TIMEZONE}`)
    timezone = DEFAULT_TIMEZONE
  }

  // Convert current UTC time to customer's local timezone
  const zonedNow = toZonedTime(now, timezone)
  const currentHour = zonedNow.getHours()

  // Check if within 8am-9pm (8 <= hour < 21)
  if (currentHour >= QUIET_HOURS_START && currentHour < QUIET_HOURS_END) {
    return { canSend: true }
  }

  // Calculate next 8am in customer's timezone
  const next8am = new Date(zonedNow)

  if (currentHour >= QUIET_HOURS_END) {
    // After 9pm - send tomorrow at 8am
    next8am.setDate(next8am.getDate() + 1)
  }
  // Before 8am - send today at 8am (no date change needed)

  next8am.setHours(QUIET_HOURS_START, 0, 0, 0)

  // Convert back to UTC for storage
  const nextSendTimeUTC = fromZonedTime(next8am, timezone)

  return {
    canSend: false,
    nextSendTime: nextSendTimeUTC,
    reason: currentHour >= QUIET_HOURS_END ? 'too_late' : 'too_early',
  }
}

/**
 * Get hours remaining until quiet hours start
 * Useful for UI display of "X hours left to send today"
 *
 * @param customerTimezone - IANA timezone string
 * @param now - Optional current time for testing
 * @returns Hours until 9pm, or 0 if already in quiet hours
 */
export function getHoursUntilQuietHours(
  customerTimezone: string,
  now: Date = new Date()
): number {
  const timezone = customerTimezone || DEFAULT_TIMEZONE
  const zonedNow = toZonedTime(now, timezone)
  const currentHour = zonedNow.getHours()

  if (currentHour >= QUIET_HOURS_END || currentHour < QUIET_HOURS_START) {
    return 0 // Already in quiet hours
  }

  return QUIET_HOURS_END - currentHour
}
