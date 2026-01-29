'use client'

import { useState } from 'react'
import { CheckCircle2, Circle, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ReviewLinkModal } from '@/components/dashboard/review-link-modal'
import type { OnboardingStatus } from '@/lib/data/onboarding'

type ChecklistItem = {
  id: string
  title: string
  description: string
  href?: string
  action?: 'review-link-modal'
  completed: boolean
}

/**
 * Persistent onboarding checklist for dashboard.
 * Shows progress and links to complete each setup step.
 * Auto-hides when all items are complete.
 */
export function OnboardingChecklist({ status }: { status: OnboardingStatus }) {
  const [modalOpen, setModalOpen] = useState(false)

  // Build checklist items from onboarding status
  const items: ChecklistItem[] = [
    {
      id: 'business',
      title: 'Set up business profile',
      description: 'Add your business name',
      href: '/dashboard/settings',
      completed: status.steps.hasBusinessProfile,
    },
    {
      id: 'review-link',
      title: 'Add Google review link',
      description: 'Connect your Google Business Profile',
      action: 'review-link-modal',
      completed: status.steps.hasReviewLink,
    },
    {
      id: 'contact',
      title: 'Add your first contact',
      description: 'Import or create a customer contact',
      href: '/contacts',
      completed: status.steps.hasContacts,
    },
    {
      id: 'send',
      title: 'Send your first review request',
      description: 'Start collecting reviews',
      href: '/send',
      completed: status.steps.hasSentMessage,
    },
  ]

  const completedCount = items.filter((i) => i.completed).length
  const totalCount = items.length
  const progress = (completedCount / totalCount) * 100

  // Don't render if all complete
  if (completedCount === totalCount) {
    return null
  }

  function renderItem(item: ChecklistItem) {
    const content = (
      <>
        {item.completed ? (
          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
        )}
        <div className="flex-1 min-w-0">
          <p
            className={cn(
              'text-sm font-medium',
              item.completed && 'text-muted-foreground line-through'
            )}
          >
            {item.title}
          </p>
          <p className="text-xs text-muted-foreground">{item.description}</p>
        </div>
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground flex-shrink-0 mt-1 transition-colors" />
      </>
    )

    if (item.action === 'review-link-modal') {
      return (
        <button
          key={item.id}
          type="button"
          onClick={() => setModalOpen(true)}
          className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors group w-full text-left"
        >
          {content}
        </button>
      )
    }

    return (
      <Link
        key={item.id}
        href={item.href!}
        className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted transition-colors group"
      >
        {content}
      </Link>
    )
  }

  return (
    <>
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Get Started</h3>
          <span className="text-sm text-muted-foreground">
            {completedCount} of {totalCount} complete
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-muted rounded-full mb-6">
          <div
            className="h-2 bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Checklist items */}
        <div className="space-y-2">
          {items.map((item) => renderItem(item))}
        </div>

        {/* Quick Setup CTA */}
        <div className="mt-6 pt-4 border-t">
          <Button asChild className="w-full">
            <Link href="/onboarding?step=1">Quick Setup</Link>
          </Button>
        </div>
      </div>

      <ReviewLinkModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  )
}
