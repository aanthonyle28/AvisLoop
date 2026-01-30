'use client'

import { AddressBook, NotePencil, PaperPlaneTilt, ArrowRight, CheckCircle, Circle } from '@phosphor-icons/react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { OnboardingCardStatus } from '@/lib/data/onboarding'

type CardConfig = {
  id: keyof OnboardingCardStatus
  number: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string; weight?: string }>
  href: string
  prerequisite?: keyof OnboardingCardStatus
  prerequisiteLabel?: string
}

const CARDS: CardConfig[] = [
  {
    id: 'contact_created',
    number: '01',
    title: 'Create a test contact',
    description: 'Add someone to send a review request to',
    icon: AddressBook,
    href: '/contacts',
  },
  {
    id: 'template_created',
    number: '02',
    title: 'Create a message template',
    description: 'Customize your review request email',
    icon: NotePencil,
    href: '/dashboard/settings',
  },
  {
    id: 'test_sent',
    number: '03',
    title: 'Send a test review request',
    description: 'Try sending your first review request',
    icon: PaperPlaneTilt,
    href: '/send?test=true',
    prerequisite: 'contact_created',
    prerequisiteLabel: 'Create a contact first',
  },
]

export function OnboardingCards({ status }: { status: OnboardingCardStatus }) {
  const completedCount = Object.values(status).filter(Boolean).length
  const totalCount = CARDS.length

  // Hide if all cards complete
  if (completedCount === totalCount) {
    return null
  }

  return (
    <div className="space-y-4">
      {/* Section Heading */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Get Started</h2>
        <span className="text-sm text-muted-foreground">
          {completedCount} of {totalCount} complete
        </span>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {CARDS.map((card) => {
          const isComplete = status[card.id]
          const hasPrerequisite = card.prerequisite && !status[card.prerequisite]
          const Icon = card.icon

          return (
            <Link
              key={card.id}
              href={card.href}
              className={cn(
                'group relative block rounded-lg border p-6 transition-all hover:border-primary',
                isComplete && 'border-green-200 bg-green-50/50'
              )}
            >
              {/* Top Row: Number and Completion Indicator */}
              <div className="flex items-start justify-between mb-4">
                <span className="text-sm font-medium text-muted-foreground">
                  {card.number}
                </span>
                {isComplete ? (
                  <CheckCircle weight="fill" className="h-5 w-5 text-green-600" />
                ) : (
                  <Circle weight="regular" className="h-5 w-5 text-muted-foreground" />
                )}
              </div>

              {/* Icon */}
              <div className="mb-4">
                <Icon weight="regular" className="h-8 w-8 text-primary" />
              </div>

              {/* Title and Description */}
              <div className="mb-3">
                <h3 className="font-semibold mb-1">{card.title}</h3>
                <p className="text-sm text-muted-foreground">{card.description}</p>
              </div>

              {/* Prerequisite Warning */}
              {hasPrerequisite && (
                <p className="text-xs text-amber-600 mb-3">
                  {card.prerequisiteLabel}
                </p>
              )}

              {/* Arrow Icon (shows on hover) */}
              <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight weight="regular" className="h-5 w-5 text-primary" />
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
