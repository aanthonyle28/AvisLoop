'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { createCampaignFromPreset } from '@/lib/actions/onboarding'
import { CAMPAIGN_PRESETS } from '@/lib/constants/campaigns'
import { toast } from 'sonner'
import type { CampaignWithTouches } from '@/lib/types/database'
import { cn } from '@/lib/utils'

interface CampaignPresetStepProps {
  onComplete: () => void
  onGoBack: () => void
  presets: CampaignWithTouches[]
}

/**
 * Step 5: Campaign Preset Selection
 * Shows 3 campaign presets and creates campaign on selection.
 * This is a self-contained onboarding version that creates and continues (not navigating to edit page).
 */
export function CampaignPresetStep({
  onComplete,
  onGoBack,
  presets,
}: CampaignPresetStepProps) {
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Match database presets with constant definitions for descriptions
  const presetsWithMeta = presets.map(preset => {
    const meta = CAMPAIGN_PRESETS.find(p =>
      preset.name.toLowerCase().includes(p.id)
    )
    return { ...preset, meta }
  })

  // Sort to match CAMPAIGN_PRESETS order: conservative → standard → aggressive
  const sortedPresets = [...presetsWithMeta].sort((a, b) => {
    const aIdx = CAMPAIGN_PRESETS.findIndex(p => p.id === a.meta?.id)
    const bIdx = CAMPAIGN_PRESETS.findIndex(p => p.id === b.meta?.id)
    return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx)
  })

  const handleSelectPreset = (presetId: string) => {
    setSelectedPresetId(presetId)
  }

  const handleContinue = () => {
    if (!selectedPresetId) return

    startTransition(async () => {
      const result = await createCampaignFromPreset(selectedPresetId)
      if (result.error) {
        toast.error(result.error)
      } else if (result.data?.campaignId) {
        toast.success('Campaign created!')
        onComplete()
      }
    })
  }

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Choose your follow-up approach</h1>
        <p className="text-muted-foreground text-lg">
          Select a campaign style. You can change this later in Campaigns.
        </p>
      </div>

      {/* Preset cards — vertical stack */}
      <div className="flex flex-col gap-3 max-w-lg mx-auto" role="radiogroup" aria-label="Campaign preset options">
        {sortedPresets.map((preset) => {
          const isSelected = selectedPresetId === preset.id
          return (
            <div
              key={preset.id}
              role="radio"
              tabIndex={0}
              aria-checked={isSelected}
              className={cn(
                'relative border rounded-lg p-4 cursor-pointer transition-all',
                isSelected
                  ? 'border-primary ring-2 ring-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              )}
              onClick={() => handleSelectPreset(preset.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  handleSelectPreset(preset.id)
                }
              }}
            >
              {/* Title + description */}
              <h3 className="font-semibold text-lg">
                {preset.meta?.name || preset.name}
              </h3>
              <p className="text-sm text-muted-foreground mt-1">
                {preset.meta?.description || `${preset.campaign_touches.length} touches`}
              </p>
            </div>
          )
        })}
      </div>

      {/* Button row */}
      <div className="flex gap-3 max-w-lg mx-auto">
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
          onClick={handleContinue}
          disabled={isPending || !selectedPresetId}
          className="flex-1 h-12 text-base"
        >
          {isPending ? 'Creating...' : 'Continue'}
        </Button>
      </div>
    </div>
  )
}
