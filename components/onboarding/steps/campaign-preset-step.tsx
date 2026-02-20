'use client'

import { useState, useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EnvelopeSimple, ChatCircle } from '@phosphor-icons/react'
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
          Select a campaign style. You can customize it later in Settings.
        </p>
      </div>

      {/* Preset cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4" role="radiogroup" aria-label="Campaign preset options">
        {presetsWithMeta.map((preset) => {
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
              {/* Title */}
              <div className="mb-3">
                <h3 className="font-semibold text-lg">
                  {preset.meta?.name || preset.name}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {preset.meta?.description || `${preset.campaign_touches.length} touches`}
                </p>
              </div>

              {/* Touch visualization */}
              <div className="flex items-center gap-2 flex-wrap">
                {preset.campaign_touches.map((touch, idx) => (
                  <div key={touch.id} className="flex items-center gap-1">
                    {idx > 0 && (
                      <span className="text-xs text-muted-foreground mx-1">→</span>
                    )}
                    <Badge
                      variant={touch.channel === 'email' ? 'secondary' : 'default'}
                      className="gap-1"
                    >
                      {touch.channel === 'email' ? (
                        <EnvelopeSimple className="h-3 w-3" />
                      ) : (
                        <ChatCircle className="h-3 w-3" />
                      )}
                      <span className="text-xs">
                        {(() => {
                          const cumulativeHours = preset.campaign_touches
                            .slice(0, idx + 1)
                            .reduce((sum, t) => sum + t.delay_hours, 0)
                          if (cumulativeHours < 24) return `${cumulativeHours}h`
                          return `Day ${Math.round(cumulativeHours / 24)}`
                        })()}
                      </span>
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
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
