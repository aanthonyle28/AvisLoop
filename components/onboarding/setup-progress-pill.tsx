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
      <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium bg-success-bg text-success-foreground border border-success-border">
        <CheckCircle weight="fill" className="h-4 w-4" />
        <span>Setup complete</span>
        <button
          onClick={handleDismiss}
          disabled={isPending}
          className="ml-1 hover:bg-success/10 rounded-full p-0.5 transition-colors disabled:opacity-50"
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
        'bg-warning-bg text-warning-foreground border border-warning-border',
        'hover:bg-warning-bg/80 transition-colors'
      )}
    >
      <span>Getting Started: {completedCount}/{totalCount}</span>
      <span className="text-[10px]">&gt;</span>
    </button>
  )
}
