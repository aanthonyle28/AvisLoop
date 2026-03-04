'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { saveBrandVoice } from '@/lib/actions/onboarding'
import { BRAND_VOICE_PRESETS, type BrandVoicePresetKey } from '@/lib/validations/onboarding'
import { cn } from '@/lib/utils'

interface BrandVoiceStepProps {
  onComplete: () => void
  onGoBack: () => void
  defaultValue?: string | null
}

/**
 * Step 4: Brand Voice Selection
 * Chip-style presets for AI personalization tone + optional custom textarea.
 * Skippable — AI falls back to default warm/professional if not set.
 */
export function BrandVoiceStep({
  onComplete,
  onGoBack,
  defaultValue,
}: BrandVoiceStepProps) {
  // Parse default value: "preset" or "preset|custom text"
  const defaultPreset = (defaultValue?.split('|')[0] || null) as BrandVoicePresetKey | null
  const defaultCustom = defaultValue?.includes('|') ? defaultValue.split('|').slice(1).join('|') : ''

  const [selected, setSelected] = useState<BrandVoicePresetKey | null>(defaultPreset)
  const [customText, setCustomText] = useState(defaultCustom)
  const [isPending, startTransition] = useTransition()

  const handleContinue = () => {
    if (!selected) return

    startTransition(async () => {
      await saveBrandVoice({ preset: selected, customText: customText.trim() || '' })
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
        <h1 className="text-3xl font-bold">How should your messages sound?</h1>
        <p className="text-muted-foreground text-lg">
          Pick a tone that matches your brand. You can customize this later.
        </p>
      </div>

      {/* Preset chips grid */}
      <div
        className="grid grid-cols-2 sm:grid-cols-3 gap-3"
        role="radiogroup"
        aria-label="Brand voice options"
      >
        {BRAND_VOICE_PRESETS.map((preset) => {
          const isSelected = selected === preset.value
          return (
            <button
              key={preset.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setSelected(preset.value)}
              disabled={isPending}
              className={cn(
                'flex items-center justify-center px-4 py-3 border rounded-lg transition-all text-center',
                isSelected
                  ? 'border-primary ring-2 ring-primary bg-primary/5'
                  : 'border-border hover:border-primary/50',
                isPending && 'opacity-50 cursor-not-allowed'
              )}
            >
              <span className="text-sm font-medium">{preset.label}</span>
            </button>
          )
        })}
      </div>

      {/* Optional custom textarea — appears when any preset is selected */}
      {selected && (
        <div className="space-y-2">
          <label htmlFor="brand-voice-custom" className="text-sm font-medium text-muted-foreground">
            Add extra context (optional)
          </label>
          <Textarea
            id="brand-voice-custom"
            placeholder="e.g. We're a family-owned shop in Texas, keep it southern and friendly"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            disabled={isPending}
            maxLength={300}
            rows={3}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground text-right">{customText.length}/300</p>
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
          disabled={isPending || !selected}
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
          Skip without saving
        </button>
      </div>
    </div>
  )
}
