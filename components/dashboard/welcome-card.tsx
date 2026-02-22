'use client'

import Link from 'next/link'
import { Sparkle, CheckCircle, Circle, ArrowRight } from '@phosphor-icons/react'
import { CHECKLIST_ITEMS, type ChecklistItemId } from '@/lib/constants/checklist'
import { cn } from '@/lib/utils'

interface WelcomeCardProps {
  items: Record<ChecklistItemId, boolean>
}

export function WelcomeCard({ items }: WelcomeCardProps) {
  return (
    <div className="rounded-xl border border-accent/30 bg-accent/5 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkle size={24} weight="fill" className="text-accent" />
        <h2 className="text-xl font-semibold">Welcome to AvisLoop!</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        Complete these steps to start collecting reviews automatically.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {CHECKLIST_ITEMS.map((item) => {
          const isComplete = items[item.id]
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'group flex items-start gap-3 rounded-lg border p-4 transition-colors',
                isComplete
                  ? 'border-border/50 bg-muted/30'
                  : 'border-border bg-card hover:border-accent/50 hover:bg-accent/5'
              )}
            >
              <div className="mt-0.5 shrink-0">
                {isComplete ? (
                  <CheckCircle size={20} weight="fill" className="text-green-500" />
                ) : (
                  <Circle size={20} className="text-muted-foreground" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={cn(
                  'text-sm font-medium',
                  isComplete && 'line-through text-muted-foreground'
                )}>
                  {item.title}
                </p>
                <p className={cn(
                  'text-xs mt-0.5',
                  isComplete ? 'text-muted-foreground/70' : 'text-muted-foreground'
                )}>
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
