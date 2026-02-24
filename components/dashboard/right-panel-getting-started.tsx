'use client'

import Link from 'next/link'
import { Sparkle, CheckCircle, Circle, ArrowRight } from '@phosphor-icons/react'
import { CHECKLIST_ITEMS, type ChecklistItemId } from '@/lib/constants/checklist'
import { cn } from '@/lib/utils'

interface RightPanelGettingStartedProps {
  items: Record<ChecklistItemId, boolean>
}

export function RightPanelGettingStarted({ items }: RightPanelGettingStartedProps) {
  const allComplete = Object.values(items).every(Boolean)
  const firstJobAdded = items['first_job_added']
  const firstReviewClick = items['first_review_click']

  // Hidden: all items complete or user has first review
  if (allComplete || firstReviewClick) {
    return null
  }

  const incompleteItems = CHECKLIST_ITEMS.filter((item) => !items[item.id])

  // Compact mode: first job is done but no review click yet
  if (firstJobAdded) {
    return (
      <div className="rounded-xl border border-accent/20 bg-accent/5 p-3">
        <div className="flex items-center gap-1.5 mb-2.5">
          <Sparkle size={16} weight="fill" className="text-accent shrink-0" />
          <h3 className="text-sm font-semibold">Almost there!</h3>
        </div>

        <div className="space-y-1.5">
          {incompleteItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="group flex items-start gap-2.5 rounded-lg border border-border bg-card p-2.5 transition-colors hover:border-accent/50 hover:bg-accent/5"
            >
              <Circle
                size={16}
                className="mt-0.5 shrink-0 text-muted-foreground"
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium leading-snug">{item.title}</p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                  {item.description}
                </p>
              </div>
              <ArrowRight
                size={14}
                className="mt-0.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity"
              />
            </Link>
          ))}
        </div>
      </div>
    )
  }

  // Full card mode: first job not yet added
  return (
    <div className="rounded-xl border border-accent/30 bg-accent/5 p-4">
      <div className="flex items-center gap-2 mb-2">
        <Sparkle size={20} weight="fill" className="text-accent shrink-0" />
        <h3 className="text-base font-semibold">Getting Started</h3>
      </div>
      <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
        Complete these steps to start collecting reviews automatically.
      </p>

      <div className="space-y-2">
        {CHECKLIST_ITEMS.map((item) => {
          const isComplete = items[item.id]
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'group flex items-start gap-3 rounded-lg border p-3 transition-colors',
                isComplete
                  ? 'border-border/50 bg-muted/30'
                  : 'border-border bg-card hover:border-accent/50 hover:bg-accent/5'
              )}
            >
              <div className="mt-0.5 shrink-0">
                {isComplete ? (
                  <CheckCircle
                    size={18}
                    weight="fill"
                    className="text-green-500"
                  />
                ) : (
                  <Circle size={18} className="text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    'text-sm font-medium leading-snug',
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
                  size={16}
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
