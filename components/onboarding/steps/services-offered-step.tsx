'use client'

import { useState, useTransition } from 'react'
import { Check } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { saveServicesOffered } from '@/lib/actions/onboarding'
import {
  SERVICE_TYPES,
  SERVICE_TYPE_LABELS,
  type ServiceTypeValue,
} from '@/lib/validations/job'
import { cn } from '@/lib/utils'

interface ServicesOfferedStepProps {
  onComplete: () => void
  onGoBack: () => void
  defaultEnabled?: string[]
}

/**
 * Step 3: Services Offered
 * Multi-select pill chips for service types.
 * Selecting "Other" reveals a custom service name input.
 * At least one selection is required.
 */
export function ServicesOfferedStep({
  onComplete,
  onGoBack,
  defaultEnabled,
}: ServicesOfferedStepProps) {
  const [selected, setSelected] = useState<string[]>(defaultEnabled || [])
  const [customServiceLabel, setCustomServiceLabel] = useState('')
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
        {/* Horizontal chip tiles */}
        <div className="flex flex-wrap gap-2">
          {SERVICE_TYPES.map((serviceType) => {
            const isSelected = selected.includes(serviceType)
            const label = SERVICE_TYPE_LABELS[serviceType]
            return (
              <button
                key={serviceType}
                type="button"
                onClick={() => handleToggle(serviceType)}
                className={cn(
                  'inline-flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-medium transition-colors',
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-border hover:border-primary/50 text-foreground'
                )}
              >
                {isSelected && <Check size={14} weight="bold" />}
                {label}
              </button>
            )
          })}
        </div>

        {/* "Other" custom service name reveal */}
        {selected.includes('other') && (
          <div className="space-y-1.5">
            <Label htmlFor="custom-service">What type of service? (optional)</Label>
            <Input
              id="custom-service"
              value={customServiceLabel}
              onChange={(e) => setCustomServiceLabel(e.target.value)}
              placeholder="e.g. Pest Control, Pool Cleaning..."
            />
          </div>
        )}

        {error && <p className="text-sm text-error-text">{error}</p>}

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
