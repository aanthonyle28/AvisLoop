'use client'

import { useState } from 'react'
import { ArrowRight, Settings, Users, Send, History } from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ReviewLinkModal } from '@/components/dashboard/review-link-modal'
import type { OnboardingStatus } from '@/lib/data/onboarding'

type NextAction = {
  title: string
  description: string
  href?: string
  action?: 'review-link-modal'
  icon: React.ReactNode
  variant: 'default' | 'secondary'
}

/**
 * Determine the next recommended action based on onboarding status.
 * Priority order: review link -> contacts -> send -> history
 */
function determineNextAction(status: OnboardingStatus): NextAction {
  if (!status.steps.hasReviewLink) {
    return {
      title: 'Add your review link',
      description:
        'Connect your Google Business Profile to start collecting reviews.',
      action: 'review-link-modal',
      icon: <Settings className="h-5 w-5 text-primary" />,
      variant: 'default',
    }
  }

  if (!status.steps.hasContacts) {
    return {
      title: 'Add your first contact',
      description: 'Import or manually add customers to send review requests.',
      href: '/contacts',
      icon: <Users className="h-5 w-5 text-primary" />,
      variant: 'default',
    }
  }

  if (!status.steps.hasSentMessage) {
    return {
      title: 'Send your first request',
      description: 'Choose a contact and send your first review request.',
      href: '/send',
      icon: <Send className="h-5 w-5 text-primary" />,
      variant: 'default',
    }
  }

  // All onboarding complete - suggest viewing history
  return {
    title: 'View your sent messages',
    description: 'Check the status of your review requests and follow up.',
    href: '/history',
    icon: <History className="h-5 w-5 text-primary" />,
    variant: 'secondary',
  }
}

/**
 * Smart recommendation card showing the next best action.
 * Displays context-aware suggestion based on onboarding completion state.
 */
export function NextActionCard({ status }: { status: OnboardingStatus }) {
  const [modalOpen, setModalOpen] = useState(false)
  const action = determineNextAction(status)

  return (
    <>
      <div className="rounded-lg border bg-card p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-primary/10 flex-shrink-0">
            {action.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold mb-1">{action.title}</h3>
            <p className="text-sm text-muted-foreground mb-4">
              {action.description}
            </p>
            {action.action === 'review-link-modal' ? (
              <Button variant={action.variant} onClick={() => setModalOpen(true)}>
                {action.title}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button asChild variant={action.variant}>
                <Link href={action.href!}>
                  {action.title}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      <ReviewLinkModal open={modalOpen} onOpenChange={setModalOpen} />
    </>
  )
}
