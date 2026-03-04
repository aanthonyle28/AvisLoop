import { cn } from '@/lib/utils'
import type { Grade } from '@/lib/audit/types'

interface ScoreBadgeProps {
  grade: Grade
  size?: 'sm' | 'lg'
}

const gradeStyles: Record<Grade, string> = {
  A: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  B: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  C: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  D: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  F: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

/**
 * Circular letter grade badge with color coding.
 * A = green, B = blue, C = amber, D = orange, F = red.
 *
 * Size 'lg' (default): w-24 h-24 text-5xl — for report page hero
 * Size 'sm': w-12 h-12 text-xl — for inline use in search preview
 */
export function ScoreBadge({ grade, size = 'lg' }: ScoreBadgeProps) {
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-bold',
        gradeStyles[grade],
        size === 'lg' ? 'w-24 h-24 text-5xl' : 'w-12 h-12 text-xl',
      )}
      aria-label={`Reputation grade: ${grade}`}
    >
      {grade}
    </div>
  )
}
