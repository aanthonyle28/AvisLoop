'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { saveSoftwareUsed } from '@/lib/actions/onboarding'
import { CRM_PLATFORMS } from '@/lib/validations/onboarding'
import { Info, Minus } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

interface CRMPlatformStepProps {
  onComplete: () => void
  onGoBack: () => void
  defaultValue?: string | null
}

/**
 * Step 3: CRM Platform Selection
 * Square logo-style cards for field service management software.
 * Captures CRM data for v2.1 integration planning. This step is skippable.
 */
export function CRMPlatformStep({
  onComplete,
  onGoBack,
  defaultValue,
}: CRMPlatformStepProps) {
  const [selected, setSelected] = useState<string | null>(defaultValue || null)
  const [customText, setCustomText] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleContinue = () => {
    const valueToSave = selected === 'other'
      ? (customText.trim() || 'other')
      : (selected || '')

    startTransition(async () => {
      await saveSoftwareUsed({ softwareUsed: valueToSave })
      onComplete()
    })
  }

  const handleSkip = () => {
    onComplete()
  }

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">What software do you use to manage jobs?</h1>
        <p className="text-muted-foreground text-lg">
          This helps us plan integrations. Skip if you&apos;re unsure.
        </p>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 bg-info-bg border border-info-border rounded-lg">
        <Info size={20} className="text-info mt-0.5 flex-shrink-0" />
        <p className="text-sm text-info-foreground">
          This is for our roadmap planning only. No integration will be set up now.
        </p>
      </div>

      {/* CRM platform cards grid */}
      <div
        className="grid grid-cols-2 sm:grid-cols-3 gap-3"
        role="radiogroup"
        aria-label="CRM platform options"
      >
        {/* Main CRM platform cards */}
        {CRM_PLATFORMS.map((platform) => {
          const isSelected = selected === platform.value
          return (
            <button
              key={platform.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setSelected(platform.value)}
              disabled={isPending}
              className={cn(
                'flex flex-col items-center justify-center gap-2 p-4 border rounded-lg transition-all text-center',
                isSelected
                  ? 'border-primary ring-2 ring-primary bg-primary/5'
                  : 'border-border hover:border-primary/50',
                isPending && 'opacity-50 cursor-not-allowed'
              )}
            >
              {/* Colored abbreviation circle */}
              <div
                className={cn(
                  'w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm',
                  platform.color
                )}
              >
                {platform.abbr}
              </div>
              <span className="text-sm font-medium leading-tight">{platform.label}</span>
            </button>
          )
        })}

        {/* None card */}
        {(() => {
          const isSelected = selected === 'none'
          return (
            <button
              key="none"
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setSelected('none')}
              disabled={isPending}
              className={cn(
                'flex flex-col items-center justify-center gap-2 p-4 border rounded-lg transition-all text-center',
                isSelected
                  ? 'border-primary ring-2 ring-primary bg-primary/5'
                  : 'border-border hover:border-primary/50',
                isPending && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-muted">
                <Minus size={18} className="text-muted-foreground" />
              </div>
              <span className="text-sm font-medium leading-tight">None</span>
            </button>
          )
        })()}

        {/* Other card */}
        {(() => {
          const isSelected = selected === 'other'
          return (
            <button
              key="other"
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setSelected('other')}
              disabled={isPending}
              className={cn(
                'flex flex-col items-center justify-center gap-2 p-4 border rounded-lg transition-all text-center',
                isSelected
                  ? 'border-primary ring-2 ring-primary bg-primary/5'
                  : 'border-border hover:border-primary/50',
                isPending && 'opacity-50 cursor-not-allowed'
              )}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-muted text-muted-foreground font-bold text-lg">
                ?
              </div>
              <span className="text-sm font-medium leading-tight">Other</span>
            </button>
          )
        })()}
      </div>

      {/* Custom text input — shown when "Other" is selected */}
      {selected === 'other' && (
        <div className="space-y-1">
          <Input
            placeholder="e.g. Workiz, Kickserv..."
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            disabled={isPending}
            aria-label="Custom CRM platform name"
          />
        </div>
      )}

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
          type="button"
          onClick={handleContinue}
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
    </div>
  )
}

