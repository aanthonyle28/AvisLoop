'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, X } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface SetupProgressPillProps {
  completedSteps: number
  totalSteps: number
  isAllComplete: boolean
  onOpenDrawer: () => void
}

const DISMISS_KEY = 'avisloop_setupDismissed'

export function SetupProgressPill({
  completedSteps,
  totalSteps,
  isAllComplete,
  onOpenDrawer,
}: SetupProgressPillProps) {
  const [isDismissed, setIsDismissed] = useState(false)

  // Load dismiss state from localStorage on mount
  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISS_KEY)
    if (dismissed === 'true') {
      setIsDismissed(true)
    }
  }, [])

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation()
    localStorage.setItem(DISMISS_KEY, 'true')
    setIsDismissed(true)
  }

  // Don't render if dismissed
  if (isDismissed) {
    return null
  }

  // All complete state
  if (isAllComplete) {
    return (
      <div className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200">
        <CheckCircle weight="fill" className="h-4 w-4" />
        <span>Setup complete</span>
        <button
          onClick={handleDismiss}
          className="ml-1 hover:bg-green-100 rounded-full p-0.5 transition-colors"
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
      <span>Complete Setup: {completedSteps}/{totalSteps}</span>
      <span className="text-[10px]">&gt;</span>
    </button>
  )
}
