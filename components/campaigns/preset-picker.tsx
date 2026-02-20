'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { EnvelopeSimple, ChatCircle, Clock } from '@phosphor-icons/react'
import { duplicateCampaign } from '@/lib/actions/campaign'
import { CAMPAIGN_PRESETS } from '@/lib/constants/campaigns'
import { toast } from 'sonner'
import type { CampaignWithTouches } from '@/lib/types/database'
import { cn } from '@/lib/utils'

/**
 * Format delay hours into human-readable format.
 * Under 24h: show hours (e.g., "4h")
 * 24h and above: show days (e.g., "1d", "3d", "7d")
 */
function formatDelay(hours: number): string {
  if (hours < 24) return `${hours}h`
  const days = Math.round(hours / 24)
  return `${days}d`
}

interface PresetPickerProps {
  presets: CampaignWithTouches[]
  compact?: boolean
}

const PRESET_ORDER = ['conservative', 'standard', 'aggressive']

export function PresetPicker({ presets, compact = false }: PresetPickerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleSelectPreset = (presetId: string) => {
    startTransition(async () => {
      const result = await duplicateCampaign(presetId)
      if (result.error) {
        toast.error(result.error)
      } else if (result.data?.campaignId) {
        toast.success('Campaign created! Configure your templates.')
        router.push(`/campaigns/${result.data.campaignId}/edit`)
      }
    })
  }

  // Match database presets with constant definitions for descriptions
  // Sort to ensure deterministic order: Conservative → Standard → Aggressive
  const presetsWithMeta = presets
    .map(preset => {
      const meta = CAMPAIGN_PRESETS.find(p =>
        preset.name.toLowerCase().includes(p.id)
      )
      return { ...preset, meta }
    })
    .sort((a, b) => {
      const aIdx = PRESET_ORDER.indexOf(a.meta?.id || '')
      const bIdx = PRESET_ORDER.indexOf(b.meta?.id || '')
      return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx)
    })

  return (
    <div className={cn(
      'grid gap-4 max-w-3xl mx-auto',
      compact ? 'grid-cols-1 md:grid-cols-3' : 'grid-cols-1 lg:grid-cols-3'
    )}>
      {presetsWithMeta.map((preset) => (
        <Card
          key={preset.id}
          className={cn(
            'relative hover:border-primary/50 transition-colors cursor-pointer',
            isPending && 'opacity-50 pointer-events-none'
          )}
          onClick={() => handleSelectPreset(preset.id)}
        >
          <CardHeader className={compact ? 'pb-2' : undefined}>
            <CardTitle className={cn(compact && 'text-base')}>
              {preset.meta?.id === 'conservative' && 'Conservative'}
              {preset.meta?.id === 'standard' && 'Standard'}
              {preset.meta?.id === 'aggressive' && 'Aggressive'}
              {!preset.meta && preset.name}
            </CardTitle>
            {!compact && (
              <CardDescription>
                {preset.meta?.description || `${preset.campaign_touches.length} touches`}
              </CardDescription>
            )}
          </CardHeader>

          <CardContent className={compact ? 'pt-0' : undefined}>
            {/* Timing summary line with clock icon - always visible */}
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              <div className="flex items-center gap-1.5 flex-wrap">
                {preset.campaign_touches.map((touch, idx) => (
                  <span key={touch.id} className="flex items-center gap-0.5">
                    {touch.channel === 'email' ? (
                      <EnvelopeSimple className="h-3 w-3" />
                    ) : (
                      <ChatCircle className="h-3 w-3" />
                    )}
                    <span>{formatDelay(touch.delay_hours)}</span>
                    {idx < preset.campaign_touches.length - 1 && (
                      <span className="mx-1">→</span>
                    )}
                  </span>
                ))}
              </div>
            </div>

            {!compact && (
              <Button className="w-full mt-4" disabled={isPending}>
                Use this preset
              </Button>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
