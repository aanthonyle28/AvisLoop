'use client'

import { Check, Circle, ArrowRight } from '@phosphor-icons/react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { CHECKLIST_ITEMS, type ChecklistItemId } from '@/lib/constants/checklist'

interface SetupProgressDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  items: Record<ChecklistItemId, boolean>
  completedCount: number
  allComplete: boolean
}

export function SetupProgressDrawer({
  open,
  onOpenChange,
  items,
  completedCount,
  allComplete,
}: SetupProgressDrawerProps) {
  const totalCount = CHECKLIST_ITEMS.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Getting Started</SheetTitle>
          <SheetDescription>
            Complete these steps to start collecting reviews
          </SheetDescription>
        </SheetHeader>

        {/* Progress bar */}
        <div className="px-4 mt-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>{completedCount} of {totalCount} complete</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Steps list */}
        <div className="flex-1 overflow-y-auto px-4 mt-6 space-y-2">
          {CHECKLIST_ITEMS.map((item) => {
            const isComplete = items[item.id]

            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => onOpenChange(false)}
                className={cn(
                  'flex items-start gap-3 p-3 rounded-lg transition-colors',
                  isComplete
                    ? 'bg-muted/50'
                    : 'hover:bg-muted/50 group'
                )}
              >
                {/* Checkmark or empty circle */}
                <div className={cn(
                  'mt-0.5 h-5 w-5 rounded-full flex items-center justify-center shrink-0',
                  isComplete
                    ? 'bg-success/10 text-success'
                    : 'border-2 border-muted-foreground/30 text-transparent'
                )}>
                  {isComplete ? (
                    <Check size={14} weight="bold" />
                  ) : (
                    <Circle size={14} />
                  )}
                </div>

                {/* Content */}
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

                {/* Arrow for incomplete items */}
                {!isComplete && (
                  <ArrowRight
                    size={16}
                    className="mt-1 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  />
                )}
              </Link>
            )
          })}
        </div>

        {/* Footer note when complete */}
        {allComplete && (
          <div className="px-4 py-3 bg-success-bg rounded-lg mx-4 mt-4">
            <p className="text-xs text-success-foreground">
              Great job! You&apos;re all set up. AvisLoop is now working for you.
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
