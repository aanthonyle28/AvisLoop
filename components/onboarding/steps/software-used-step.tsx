'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { saveSoftwareUsed } from '@/lib/actions/onboarding'
import { SOFTWARE_OPTIONS } from '@/lib/validations/onboarding'
import { Info } from '@phosphor-icons/react'

interface SoftwareUsedStepProps {
  onComplete: () => void
  onGoBack: () => void
  defaultValue?: string
}

/**
 * Step 4: Software Used
 * Radio-style card selection for CRM/field service software.
 * This step is skippable.
 */
export function SoftwareUsedStep({
  onComplete,
  onGoBack,
  defaultValue,
}: SoftwareUsedStepProps) {
  const [selected, setSelected] = useState<string | null>(defaultValue || null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    startTransition(async () => {
      const result = await saveSoftwareUsed({
        softwareUsed: selected || '',
      })

      if (result.success) {
        onComplete()
      }
    })
  }

  const handleSkip = () => {
    onComplete()
  }

  // Software descriptions
  const descriptions: Record<string, string> = {
    servicetitan: 'Enterprise field service management',
    jobber: 'Small-to-mid field service scheduling',
    housecall_pro: 'Home service business management',
    none: 'I use something else or no software',
  }

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">What software do you use to manage jobs?</h1>
        <p className="text-muted-foreground text-lg">
          This helps us plan future integrations. Optional -- skip if unsure.
        </p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-lg">
        <Info size={20} className="text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-blue-900 dark:text-blue-100">
          This is for our roadmap planning only. No integration will be set up now.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Software option cards */}
        <div className="grid grid-cols-1 gap-3">
          {SOFTWARE_OPTIONS.map((option) => {
            const isSelected = selected === option.value

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => setSelected(option.value)}
                disabled={isPending}
                className={`
                  flex items-start gap-4 p-4 border rounded-lg text-left transition-all
                  ${
                    isSelected
                      ? 'border-primary ring-2 ring-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }
                  ${isPending ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                {/* Radio indicator */}
                <div
                  className={`
                    w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0
                    ${isSelected ? 'border-primary' : 'border-border'}
                  `}
                >
                  {isSelected && (
                    <div className="w-3 h-3 rounded-full bg-primary" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 space-y-1">
                  <div className="font-medium text-base">{option.label}</div>
                  <p className="text-sm text-muted-foreground">
                    {descriptions[option.value]}
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        {/* Button row */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onGoBack}
            disabled={isPending}
            className="flex-1 h-12 text-base"
          >
            Back
          </Button>
          <Button
            type="submit"
            disabled={isPending}
            className="flex-1 h-12 text-base"
          >
            {isPending ? 'Saving...' : 'Continue'}
          </Button>
        </div>

        {/* Skip link */}
        <div className="text-center">
          <button
            type="button"
            onClick={handleSkip}
            disabled={isPending}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            Skip for now
          </button>
        </div>
      </form>
    </div>
  )
}
