"use client"

import { useState, useTransition, useEffect } from 'react'
import Link from 'next/link'
import { X, Check, Circle, ArrowRight, CaretDown, CaretUp } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { updateChecklistState } from '@/lib/actions/checklist'
import { CHECKLIST_ITEMS, type ChecklistItemId } from '@/lib/data/checklist'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface GettingStartedChecklistProps {
  items: Record<ChecklistItemId, boolean>
  completedCount: number
  allComplete: boolean
  collapsed: boolean
  firstSeenAt: string | null
}

/**
 * Getting Started Checklist - Dashboard card for new users
 *
 * V2-aligned: Guides users through job completion workflow
 * - Add job -> Review campaign -> Complete job -> Get review click
 *
 * Behavior:
 * - Auto-collapses after 3 days (shows header only, expandable)
 * - User can dismiss with X button anytime
 * - Shows congratulations when all complete
 */
export function GettingStartedChecklist({
  items,
  completedCount,
  allComplete,
  collapsed: initialCollapsed,
  firstSeenAt,
}: GettingStartedChecklistProps) {
  const [isPending, startTransition] = useTransition()
  const [isDismissed, setIsDismissed] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(initialCollapsed)

  // Auto-collapse after 3 days
  useEffect(() => {
    if (firstSeenAt && !isCollapsed) {
      const firstSeen = new Date(firstSeenAt)
      const threeDaysLater = new Date(firstSeen.getTime() + 3 * 24 * 60 * 60 * 1000)
      if (new Date() > threeDaysLater) {
        setIsCollapsed(true)
        startTransition(async () => {
          await updateChecklistState('collapse')
        })
      }
    }
  }, [firstSeenAt, isCollapsed])

  // Mark as seen on first render
  useEffect(() => {
    if (!firstSeenAt) {
      startTransition(async () => {
        await updateChecklistState('markSeen')
      })
    }
  }, [firstSeenAt])

  const handleDismiss = () => {
    startTransition(async () => {
      const result = await updateChecklistState('dismiss')
      if (result.success) {
        setIsDismissed(true)
      } else {
        toast.error(result.error || 'Failed to dismiss checklist')
      }
    })
  }

  const handleToggleCollapse = () => {
    const newCollapsed = !isCollapsed
    setIsCollapsed(newCollapsed)
    startTransition(async () => {
      await updateChecklistState(newCollapsed ? 'collapse' : 'expand')
    })
  }

  // Don't render if dismissed
  if (isDismissed) {
    return null
  }

  // Show congratulations message when all complete
  if (allComplete) {
    return (
      <Card className="border-green-200 dark:border-green-800 bg-green-50/50 dark:bg-green-950/20">
        <CardContent className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <Check size={24} weight="bold" className="text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-green-900 dark:text-green-100">
                  You are all set!
                </h3>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Great job completing your setup. AvisLoop is now working for you.
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              disabled={isPending}
              className="text-green-600 hover:text-green-700 hover:bg-green-100 dark:text-green-400 dark:hover:bg-green-900"
              aria-label="Dismiss checklist"
            >
              <X size={20} />
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className={cn("pb-3", isCollapsed && "pb-4")}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div>
              <CardTitle className="text-lg">Getting Started</CardTitle>
              <p className="text-sm text-muted-foreground">
                {completedCount} of {CHECKLIST_ITEMS.length} complete
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleToggleCollapse}
              disabled={isPending}
              className="text-muted-foreground hover:text-foreground"
              aria-label={isCollapsed ? 'Expand checklist' : 'Collapse checklist'}
            >
              {isCollapsed ? <CaretDown size={20} /> : <CaretUp size={20} />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDismiss}
              disabled={isPending}
              className="text-muted-foreground hover:text-foreground"
              aria-label="Dismiss checklist"
            >
              <X size={20} />
            </Button>
          </div>
        </div>
        {/* Progress bar - always visible */}
        <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(completedCount / CHECKLIST_ITEMS.length) * 100}%` }}
          />
        </div>
      </CardHeader>

      {/* Collapsible content */}
      {!isCollapsed && (
        <CardContent className="pt-0">
          <ul className="space-y-3">
            {CHECKLIST_ITEMS.map((item) => {
              const isComplete = items[item.id]
              return (
                <li key={item.id}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-start gap-3 p-3 rounded-lg transition-colors',
                      isComplete
                        ? 'bg-muted/50'
                        : 'hover:bg-muted/50 group'
                    )}
                  >
                    <div className={cn(
                      'mt-0.5 h-5 w-5 rounded-full flex items-center justify-center shrink-0',
                      isComplete
                        ? 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400'
                        : 'border-2 border-muted-foreground/30 text-transparent'
                    )}>
                      {isComplete ? (
                        <Check size={14} weight="bold" />
                      ) : (
                        <Circle size={14} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        'font-medium text-sm',
                        isComplete && 'line-through text-muted-foreground'
                      )}>
                        {item.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.description}
                      </p>
                    </div>
                    {!isComplete && (
                      <ArrowRight
                        size={16}
                        className="mt-1 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                      />
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </CardContent>
      )}
    </Card>
  )
}
