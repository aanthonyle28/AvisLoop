'use client'

import { useState, useTransition } from 'react'
import { Check } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { saveServicesOffered } from '@/lib/actions/onboarding'
import {
  SERVICE_TYPES,
  SERVICE_TYPE_LABELS,
  DEFAULT_TIMING_HOURS,
  type ServiceTypeValue,
} from '@/lib/validations/job'

interface ServicesOfferedStepProps {
  onComplete: () => void
  onGoBack: () => void
  defaultEnabled?: string[]
}

/**
 * Step 3: Services Offered
 * Multi-select checkboxes for service types with timing info display.
 * At least one selection is required.
 */
export function ServicesOfferedStep({
  onComplete,
  onGoBack,
  defaultEnabled,
}: ServicesOfferedStepProps) {
  const [selected, setSelected] = useState<string[]>(defaultEnabled || [])
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleToggle = (serviceType: string) => {
    setSelected((prev) =>
      prev.includes(serviceType)
        ? prev.filter((s) => s !== serviceType)
        : [...prev, serviceType]
    )
    setError(null)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (selected.length === 0) {
      setError('Select at least one service type')
      return
    }

    startTransition(async () => {
      const result = await saveServicesOffered({
        serviceTypes: selected as ServiceTypeValue[],
      })

      if (result.success) {
        onComplete()
        return
      }

      if (result.error) {
        setError(result.error)
      }
    })
  }

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">What services does your business offer?</h1>
        <p className="text-muted-foreground text-lg">
          We&apos;ll use this to set up smart follow-up timing.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Service type grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {SERVICE_TYPES.map((serviceType) => {
            const isChecked = selected.includes(serviceType)
            const timingHours = DEFAULT_TIMING_HOURS[serviceType]
            const label = SERVICE_TYPE_LABELS[serviceType]

            return (
              <button
                type="button"
                key={serviceType}
                className={`
                  relative flex items-start gap-3 p-4 border rounded-lg cursor-pointer transition-colors text-left
                  ${isChecked ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}
                `}
                onClick={() => handleToggle(serviceType)}
              >
                <div
                  className={`
                    mt-0.5 h-4 w-4 shrink-0 rounded-sm border shadow transition-colors
                    ${isChecked ? 'bg-primary border-primary' : 'border-primary'}
                  `}
                >
                  {isChecked && (
                    <Check size={16} className="text-primary-foreground" />
                  )}
                </div>
                <div className="flex-1 space-y-1">
                  <div className="text-base font-medium">
                    {label}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Review request: {timingHours}h after job
                  </p>
                </div>
              </button>
            )
          })}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

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
            disabled={isPending || selected.length === 0}
            className="flex-1 h-12 text-base"
          >
            {isPending ? 'Saving...' : 'Continue'}
          </Button>
        </div>
      </form>
    </div>
  )
}
