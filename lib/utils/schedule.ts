import { addHours, setHours, setMinutes, setSeconds, addDays, isBefore, format } from 'date-fns'

export interface SchedulePreset {
  id: string
  label: string
  getDate: () => Date | null // null means "send now"
}

export const SCHEDULE_PRESETS: SchedulePreset[] = [
  {
    id: 'now',
    label: 'Send now',
    getDate: () => null,
  },
  {
    id: '1hour',
    label: 'In 1 hour',
    getDate: () => addHours(new Date(), 1),
  },
  {
    id: 'morning',
    label: 'Next morning',
    getDate: () => {
      const now = new Date()
      let morning = setSeconds(setMinutes(setHours(now, 9), 0), 0)
      // If it's already past 9 AM, schedule for tomorrow morning
      if (isBefore(morning, now)) {
        morning = addDays(morning, 1)
      }
      return morning
    },
  },
  {
    id: '24hours',
    label: 'In 24 hours',
    getDate: () => addHours(new Date(), 24),
  },
  {
    id: 'custom',
    label: 'Custom',
    getDate: () => null, // Determined by user input
  },
]

/** Format a Date for <input type="datetime-local"> */
export function formatForDateTimeInput(date: Date): string {
  return format(date, "yyyy-MM-dd'T'HH:mm")
}

/** Validate that a schedule date is in the future (at least 1 minute) */
export function isValidScheduleDate(date: Date): boolean {
  return date.getTime() > Date.now() + 60_000
}

/** Format a schedule date for display */
export function formatScheduleDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return format(d, 'MMM d, h:mm a')
}
