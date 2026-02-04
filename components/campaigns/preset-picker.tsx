'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EnvelopeSimple, ChatCircle } from '@phosphor-icons/react'
import { duplicateCampaign } from '@/lib/actions/campaign'
import { CAMPAIGN_PRESETS } from '@/lib/constants/campaigns'
import { toast } from 'sonner'
import type { CampaignWithTouches } from '@/lib/types/database'
import { cn } from '@/lib/utils'

interface PresetPickerProps {
  presets: CampaignWithTouches[]
  compact?: boolean
}

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
  const presetsWithMeta = presets.map(preset => {
    const meta = CAMPAIGN_PRESETS.find(p =>
      preset.name.toLowerCase().includes(p.id)
    )
    return { ...preset, meta }
  })

  return (
    <div className={cn(
      'grid gap-4',
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

          <CardContent>
            {/* Touch visualization */}
            <div className={cn('flex items-center gap-2', compact && 'flex-wrap')}>
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
                    {!compact && (
                      <span className="text-xs">
                        {touch.delay_hours < 24
                          ? `${touch.delay_hours}h`
                          : `${Math.round(touch.delay_hours / 24)}d`}
                      </span>
                    )}
                  </Badge>
                </div>
              ))}
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
