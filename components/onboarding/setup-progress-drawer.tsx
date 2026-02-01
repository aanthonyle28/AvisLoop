'use client'

import { AddressBook, Gear, NotePencil, PaperPlaneTilt, SquaresFour, CheckCircle } from '@phosphor-icons/react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'

interface SetupStep {
  id: string
  title: string
  description: string
  icon: React.ComponentType<{ className?: string; weight?: 'regular' | 'fill' }>
  href: string
  completed: boolean
  isBonus?: boolean
}

interface SetupProgressDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contactCount: number
  hasReviewLink: boolean
  hasTemplate: boolean
  hasContact: boolean
  hasSent: boolean
}

export function SetupProgressDrawer({
  open,
  onOpenChange,
  contactCount,
  hasReviewLink,
  hasTemplate,
  hasContact,
  hasSent,
}: SetupProgressDrawerProps) {
  const coreSteps: SetupStep[] = [
    {
      id: 'contact',
      title: 'Add first contact',
      description: 'Create or import a customer',
      icon: AddressBook,
      href: '/contacts',
      completed: hasContact,
    },
    {
      id: 'review-link',
      title: 'Set review link',
      description: 'Connect your Google Business Profile',
      icon: Gear,
      href: '/dashboard/settings',
      completed: hasReviewLink,
    },
    {
      id: 'message',
      title: 'Choose a message',
      description: 'Customize your review request email',
      icon: NotePencil,
      href: '/dashboard/settings',
      completed: hasTemplate,
    },
    {
      id: 'send',
      title: 'Send your first request',
      description: 'Start collecting reviews',
      icon: PaperPlaneTilt,
      href: '/send',
      completed: hasSent,
    },
  ]

  const bonusStep: SetupStep = {
    id: 'bulk',
    title: 'Try Bulk Send',
    description: 'Send to multiple contacts at once',
    icon: SquaresFour,
    href: '/send',
    completed: false,
    isBonus: true,
  }

  const steps = contactCount >= 3 ? [...coreSteps, bonusStep] : coreSteps
  const completedCount = coreSteps.filter(s => s.completed).length
  const totalCount = coreSteps.length
  const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Setup Your Account</SheetTitle>
          <SheetDescription>
            Complete these steps to get started
          </SheetDescription>
        </SheetHeader>

        {/* Progress bar */}
        <div className="px-4">
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
        <div className="flex-1 overflow-y-auto px-4 space-y-3">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isComplete = step.completed

            return (
              <div
                key={step.id}
                className={cn(
                  'relative flex items-start gap-3 p-4 rounded-lg border transition-colors',
                  isComplete && 'bg-muted/50 border-muted',
                  !isComplete && 'border-border hover:border-primary/50',
                  step.isBonus && 'border-dashed'
                )}
              >
                {/* Number or checkmark */}
                <div className="flex-shrink-0 mt-0.5">
                  {isComplete ? (
                    <CheckCircle weight="fill" className="h-6 w-6 text-green-600" />
                  ) : (
                    <div className="h-6 w-6 rounded-full border-2 border-primary flex items-center justify-center text-xs font-semibold text-primary">
                      {index + 1}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2 mb-1">
                    <Icon
                      weight={isComplete ? 'fill' : 'regular'}
                      className={cn(
                        'h-5 w-5 flex-shrink-0 mt-0.5',
                        isComplete ? 'text-muted-foreground' : 'text-primary'
                      )}
                    />
                    <div className="flex-1">
                      <h4
                        className={cn(
                          'font-semibold text-sm',
                          isComplete && 'text-muted-foreground line-through'
                        )}
                      >
                        {step.title}
                        {step.isBonus && (
                          <span className="ml-2 text-xs font-normal text-amber-600">Bonus</span>
                        )}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {step.description}
                      </p>
                    </div>
                  </div>

                  {/* CTA button for incomplete steps */}
                  {!isComplete && (
                    <Link
                      href={step.href}
                      onClick={() => onOpenChange(false)}
                      className="inline-flex items-center text-xs font-medium text-primary hover:underline mt-2"
                    >
                      {step.id === 'send' ? 'Go to Send' :
                       step.id === 'contact' ? 'Add Contact' :
                       step.id === 'bulk' ? 'Try Bulk Send' :
                       'Open Settings'}
                      <span className="ml-1">&rarr;</span>
                    </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer note */}
        {completedCount === totalCount && (
          <div className="px-4 py-3 bg-green-50 rounded-lg mx-4">
            <p className="text-xs text-green-700">
              All done! You can dismiss the setup reminder from the header.
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}
