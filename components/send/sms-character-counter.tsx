'use client'

/**
 * SMS character counter components for the send page
 *
 * Provides real-time feedback on SMS message length and segment estimation.
 * Uses simple length-based counting (GSM-7 encoding detection deferred).
 *
 * Thresholds:
 * - 0-160 chars: Green (single segment)
 * - 161-320 chars: Yellow/amber warning (2 segments)
 * - 320+ chars: Red warning (3+ segments, may be blocked)
 *
 * @module components/send/sms-character-counter
 */

import { GSM7_LIMIT, SMS_SOFT_LIMIT, estimateSegments } from '@/lib/validations/sms'
import { cn } from '@/lib/utils'

interface SmsCharacterCounterProps {
  text: string
  className?: string
}

/**
 * SMS character counter with segment estimation.
 * Shows character count and estimated SMS segments.
 *
 * Color coding:
 * - Green: Single segment (0-160 chars)
 * - Amber: 2 segments (161-320 chars)
 * - Red: 3+ segments (>320 chars)
 */
export function SmsCharacterCounter({ text, className }: SmsCharacterCounterProps) {
  const length = text.length
  const segments = estimateSegments(text)
  const remaining = GSM7_LIMIT - length

  const isOverSingle = length > GSM7_LIMIT
  const isOverSoft = length > SMS_SOFT_LIMIT

  return (
    <div className={cn('flex items-center gap-2 text-sm', className)}>
      <span
        className={cn(
          'tabular-nums',
          isOverSoft
            ? 'text-red-600 dark:text-red-400 font-medium'
            : isOverSingle
              ? 'text-amber-600 dark:text-amber-400'
              : 'text-muted-foreground'
        )}
      >
        {length}/{GSM7_LIMIT}
      </span>

      {isOverSingle && (
        <>
          <span className="text-muted-foreground">|</span>
          <span
            className={cn(
              isOverSoft ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
            )}
          >
            {segments} segment{segments > 1 ? 's' : ''}
          </span>
        </>
      )}

      {!isOverSingle && remaining >= 0 && (
        <span className="text-muted-foreground">({remaining} remaining)</span>
      )}
    </div>
  )
}

/**
 * SMS character limit notice shown below textarea.
 * Only displays when message exceeds single segment.
 */
export function SmsCharacterNotice({ length }: { length: number }) {
  const isOverSingle = length > GSM7_LIMIT
  const isOverSoft = length > SMS_SOFT_LIMIT

  if (!isOverSingle) return null

  return (
    <p
      className={cn(
        'text-sm mt-1',
        isOverSoft ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
      )}
    >
      {isOverSoft
        ? 'Message exceeds recommended limit. Consider shortening to avoid delivery issues.'
        : 'Message will be split into multiple SMS (higher cost).'}
    </p>
  )
}
