'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { saveBrandVoice } from '@/lib/actions/onboarding'
import { BRAND_VOICE_PRESETS, type BrandVoicePresetKey } from '@/lib/validations/onboarding'
import { cn } from '@/lib/utils'

interface BrandVoiceSectionProps {
  currentValue: string | null
}

/**
 * Settings section for editing brand voice / AI tone preference.
 * Same chip grid + optional textarea as the onboarding step.
 */
export function BrandVoiceSection({ currentValue }: BrandVoiceSectionProps) {
  const defaultPreset = (currentValue?.split('|')[0] || null) as BrandVoicePresetKey | null
  const defaultCustom = currentValue?.includes('|') ? currentValue.split('|').slice(1).join('|') : ''

  const [selected, setSelected] = useState<BrandVoicePresetKey | null>(defaultPreset)
  const [customText, setCustomText] = useState(defaultCustom)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)

  const hasChanges = (() => {
    const newValue = selected
      ? (customText.trim() ? `${selected}|${customText.trim()}` : selected)
      : null
    return newValue !== currentValue
  })()

  const handleSave = () => {
    if (!selected) return

    startTransition(async () => {
      await saveBrandVoice({ preset: selected, customText: customText.trim() || '' })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Brand Voice</h3>
        <p className="text-sm text-muted-foreground">
          Set the tone for AI-personalized messages. This affects how your review requests sound.
        </p>
      </div>

      <div
        className="grid grid-cols-2 sm:grid-cols-3 gap-2"
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
                'flex items-center justify-center px-3 py-2 border rounded-lg transition-all text-center',
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

      {selected && (
        <div className="space-y-2">
          <label htmlFor="settings-brand-voice-custom" className="text-sm font-medium text-muted-foreground">
            Extra context (optional)
          </label>
          <Textarea
            id="settings-brand-voice-custom"
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

      <Button
        onClick={handleSave}
        disabled={isPending || !selected || !hasChanges}
        size="sm"
      >
        {isPending ? 'Saving...' : saved ? 'Saved' : 'Save'}
      </Button>
    </div>
  )
}
