import { getHours, setHours, setMinutes, addDays } from 'date-fns'
import { toZonedTime, fromZonedTime } from 'date-fns-tz'
import { QUIET_HOURS } from '@/lib/constants/campaigns'

/**
 * Check if a given time is within quiet hours in the specified timezone.
 * Quiet hours: 9pm - 8am (configurable via constants)
 */
export function isInQuietHours(
  utcTime: Date,
  timezone: string = 'America/New_York'
): boolean {
  try {
    // Convert UTC to customer's local time
    const localTime = toZonedTime(utcTime, timezone)
    const hour = getHours(localTime)

    // Quiet hours: after 9pm OR before 8am
    return hour >= QUIET_HOURS.start || hour < QUIET_HOURS.end
  } catch {
    // On invalid timezone, assume not in quiet hours (send anyway)
    return false
  }
}

/**
 * Adjust a scheduled time to respect quiet hours.
 * If the time falls in quiet hours, delay to next 8am.
 *
 * @param scheduledAt - UTC time when touch was originally scheduled
 * @param timezone - Customer's IANA timezone
 * @returns Adjusted UTC time (same time if not in quiet hours, or next 8am if in quiet hours)
 */
export function adjustForQuietHours(
  scheduledAt: Date,
  timezone: string = 'America/New_York'
): Date {
  if (!isInQuietHours(scheduledAt, timezone)) {
    return scheduledAt
  }

  try {
    // Convert to local time
    const localTime = toZonedTime(scheduledAt, timezone)
    const hour = getHours(localTime)

    // Set to 8am
    let nextWindow = setMinutes(setHours(localTime, QUIET_HOURS.end), 0)

    // If currently after 9pm, add a day to get to next morning
    if (hour >= QUIET_HOURS.start) {
      nextWindow = addDays(nextWindow, 1)
    }

    // Convert back to UTC
    return fromZonedTime(nextWindow, timezone)
  } catch {
    // On error, return original time
    return scheduledAt
  }
}

/**
 * Get the next available send window in a timezone.
 * Useful for UI display ("Will send at 8am tomorrow").
 */
export function getNextSendWindow(timezone: string = 'America/New_York'): Date {
  const now = new Date()

  if (!isInQuietHours(now, timezone)) {
    return now
  }

  return adjustForQuietHours(now, timezone)
}
