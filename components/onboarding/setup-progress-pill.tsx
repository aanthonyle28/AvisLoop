'use client'

import { CheckCircle, X } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface SetupProgressPillProps {
  completedCount: number
  totalCount: number
  isAllComplete: boolean
  onOpenDrawer: () => void
  onDismiss: () => void
  isPending?: boolean
}

export function SetupProgressPill({
  completedCount,
  totalCount,
  isAllComplete,
  onOpenDrawer,
  onDismiss,
  isPending,
}: SetupProgressPillProps) {
  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation()
    onDismiss()
  }

  // All complete state
  if (isAllComplete) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">
        <CheckCircle weight="fill" className="h-4 w-4" />
        <span>Setup complete</span>
        <button
          onClick={handleDismiss}
          disabled={isPending}
          className="ml-1 hover:bg-green-100 dark:hover:bg-green-900 rounded-full p-0.5 transition-colors disabled:opacity-50"
          aria-label="Dismiss"
        >
          <X weight="bold" className="h-3 w-3" />
        </button>
      </div>
    )
  }

  // Incomplete state
  return (
    <button
      onClick={onOpenDrawer}
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium',
        'bg-primary/10 text-primary border border-primary/20',
        'hover:bg-primary/20 transition-colors'
      )}
    >
      <span>Getting Started: {completedCount}/{totalCount}</span>
      <span className="text-[10px]">&gt;</span>
    </button>
  )
}
