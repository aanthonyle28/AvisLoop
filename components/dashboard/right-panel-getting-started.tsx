'use client'

import { useState, useEffect, useTransition, useRef } from 'react'
import Link from 'next/link'
import {
  Sparkle,
  CheckCircle,
  Circle,
  ArrowRight,
  CaretDown,
  CaretUp,
  X,
} from '@phosphor-icons/react'
import { CHECKLIST_ITEMS, type ChecklistItemId } from '@/lib/constants/checklist'
import { updateChecklistState } from '@/lib/actions/checklist'
import { cn } from '@/lib/utils'

interface RightPanelGettingStartedProps {
  items: Record<ChecklistItemId, boolean>
  completedCount: number
  allComplete: boolean
  initialCollapsed: boolean
  initialDismissed: boolean
}

export function RightPanelGettingStarted({
  items,
  completedCount,
  allComplete,
  initialCollapsed,
  initialDismissed,
}: RightPanelGettingStartedProps) {
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed)
  const [isDismissed, setIsDismissed] = useState(initialDismissed)
  const [, startTransition] = useTransition()
  const prevCountRef = useRef(completedCount)

  // Auto-collapse when steps 1-3 become complete (completedCount transitions to >=3)
  useEffect(() => {
    if (prevCountRef.current < 3 && completedCount >= 3 && !allComplete) {
      setIsCollapsed(true)
      startTransition(async () => {
        await updateChecklistState('collapse')
      })
    }
    prevCountRef.current = completedCount
  }, [completedCount, allComplete])

  // Dismissed — render nothing
  if (isDismissed) {
    return null
  }

  const totalCount = CHECKLIST_ITEMS.length

  // Steps 1-3 = first_job_added, campaign_reviewed, job_completed
  const firstThreeComplete =
    items['first_job_added'] && items['campaign_reviewed'] && items['job_completed']

  const handleCollapse = () => {
    setIsCollapsed(true)
    startTransition(async () => {
      await updateChecklistState('collapse')
    })
  }

  const handleExpand = () => {
    setIsCollapsed(false)
    startTransition(async () => {
      await updateChecklistState('expand')
    })
  }

  const handleDismiss = () => {
    setIsDismissed(true)
    startTransition(async () => {
      await updateChecklistState('dismiss')
    })
  }

  // ── Success state: all 4 complete ────────────────────────────────────────────
  if (allComplete) {
    return (
      <div className="rounded-xl border border-success-border bg-success-bg p-4 animate-in fade-in-0 zoom-in-95 duration-300">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle
              size={20}
              weight="fill"
              className="text-success-foreground shrink-0"
            />
            <div>
              <h3 className="text-sm font-semibold text-success-foreground">
                You&apos;re all set!
              </h3>
              <p className="text-xs text-success-foreground/80 mt-0.5">
                AvisLoop is now collecting reviews for you.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleDismiss}
            className="shrink-0 rounded-md p-1 text-success-foreground/60 hover:text-success-foreground hover:bg-success-foreground/10 transition-colors"
            aria-label="Dismiss"
          >
            <X size={14} weight="bold" />
          </button>
        </div>
      </div>
    )
  }

  // ── Collapsed state: steps 1-3 complete, step 4 pending ──────────────────────
  if (isCollapsed && firstThreeComplete) {
    return (
      <button
        type="button"
        onClick={handleExpand}
        className="w-full rounded-xl border border-border bg-card p-3 flex items-center gap-2 hover:bg-muted/50 transition-colors text-left"
      >
        <CheckCircle
          size={16}
          weight="fill"
          className="text-green-500 shrink-0"
        />
        <span className="text-sm font-medium">
          {completedCount}/{totalCount} complete
        </span>
        <span className="text-xs text-muted-foreground">
          · Waiting for first review
        </span>
        <CaretDown size={14} className="ml-auto text-muted-foreground shrink-0" />
      </button>
    )
  }

  // ── Expanded state: full checklist ───────────────────────────────────────────
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <div className="rounded-xl border border-accent/20 bg-accent/5 p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <Sparkle size={18} weight="fill" className="text-accent shrink-0" />
          <h3 className="text-sm font-semibold">Getting Started</h3>
        </div>
        {firstThreeComplete && (
          <button
            type="button"
            onClick={handleCollapse}
            className="shrink-0 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Collapse checklist"
          >
            <CaretUp size={14} />
          </button>
        )}
      </div>

      {/* Progress text + bar */}
      <p className="text-xs text-muted-foreground mb-2">
        {completedCount} of {totalCount} complete
      </p>
      <div className="h-1 bg-muted rounded-full overflow-hidden mb-3">
        <div
          className="h-full bg-accent transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Checklist items */}
      <div className="space-y-1.5">
        {CHECKLIST_ITEMS.map((item) => {
          const isComplete = items[item.id]
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'group flex items-start gap-2.5 rounded-lg border p-2.5 transition-colors',
                isComplete
                  ? 'border-border/50 bg-muted/30'
                  : 'border-border bg-card hover:border-accent/50 hover:bg-accent/5'
              )}
            >
              <div className="mt-0.5 shrink-0">
                {isComplete ? (
                  <CheckCircle
                    size={16}
                    weight="fill"
                    className="text-green-500"
                  />
                ) : (
                  <Circle size={16} className="text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    'text-xs font-medium leading-snug',
                    isComplete && 'line-through text-muted-foreground'
                  )}
                >
                  {item.title}
                </p>
                <p
                  className={cn(
                    'text-xs mt-0.5 leading-snug',
                    isComplete
                      ? 'text-muted-foreground/70'
                      : 'text-muted-foreground'
                  )}
                >
                  {item.description}
                </p>
              </div>
              {!isComplete && (
                <ArrowRight
                  size={14}
                  className="mt-0.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                />
              )}
            </Link>
          )
        })}
      </div>
    </div>
  )
}
