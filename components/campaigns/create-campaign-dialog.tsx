'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { EnvelopeSimple, ChatCircle, Clock, Star, Wrench, PaperPlaneTilt } from '@phosphor-icons/react'
import { duplicateCampaign, createCampaign } from '@/lib/actions/campaign'
import { CAMPAIGN_PRESETS, type CampaignPreset } from '@/lib/constants/campaigns'
import { SERVICE_TYPE_LABELS } from '@/lib/validations/job'
import { toast } from 'sonner'
import type { CampaignWithTouches } from '@/lib/types/database'
import { cn } from '@/lib/utils'

function formatDelay(hours: number): string {
  if (hours < 24) return `${hours}h`
  const days = Math.round(hours / 24)
  return `${days}d`
}

const PRESET_ORDER = ['conservative', 'standard', 'aggressive']

interface CreateCampaignDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  presets: CampaignWithTouches[]
  onOneOff?: () => void
}

type Selection = { type: 'preset'; presetId: string; meta: CampaignPreset } | { type: 'custom' }

export function CreateCampaignDialog({ open, onOpenChange, presets, onOneOff }: CreateCampaignDialogProps) {
  const router = useRouter()
  const [selected, setSelected] = useState<Selection | null>(null)
  const [isPending, startTransition] = useTransition()

  const presetsWithMeta = presets
    .map(preset => {
      const meta = CAMPAIGN_PRESETS.find(p => preset.name.toLowerCase().includes(p.id))
      return { ...preset, meta }
    })
    .filter(p => p.meta)
    .sort((a, b) => {
      const aIdx = PRESET_ORDER.indexOf(a.meta!.id)
      const bIdx = PRESET_ORDER.indexOf(b.meta!.id)
      return aIdx - bIdx
    })

  const handleContinue = () => {
    if (!selected) return

    startTransition(async () => {
      if (selected.type === 'custom') {
        // Create a blank campaign with default touch
        const result = await createCampaign({
          name: 'Untitled Campaign',
          service_type: null,
          status: 'active',
          personalization_enabled: true,
          touches: [
            { touch_number: 1, channel: 'email', delay_hours: 24, template_id: null },
          ],
        })
        if (result.error) {
          toast.error(result.error)
        } else if (result.data?.campaignId) {
          toast.success('Campaign created! Customize your settings.')
          onOpenChange(false)
          setSelected(null)
          router.push(`/campaigns/${result.data.campaignId}?edit=true`)
        }
        return
      }

      // Preset: duplicate and navigate to detail page with edit drawer open
      const result = await duplicateCampaign(selected.presetId, selected.meta.name)
      if (result.error) {
        toast.error(result.error)
      } else if (result.data?.campaignId) {
        toast.success('Campaign created! Customize your settings.')
        onOpenChange(false)
        setSelected(null)
        router.push(`/campaigns/${result.data.campaignId}?edit=true`)
      }
    })
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) setSelected(null)
    onOpenChange(nextOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Campaign</DialogTitle>
          <DialogDescription>
            Choose a preset to get started quickly, or build a custom sequence from scratch.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 py-2" role="radiogroup" aria-label="Campaign type options">
          {presetsWithMeta.map((preset) => {
            const meta = preset.meta!
            const isSelected = selected?.type === 'preset' && selected.presetId === preset.id
            const isStandard = meta.id === 'standard'

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
                    : 'border-border hover:border-primary/50',
                  isPending && 'opacity-50 pointer-events-none'
                )}
                onClick={() => setSelected({ type: 'preset', presetId: preset.id, meta })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setSelected({ type: 'preset', presetId: preset.id, meta })
                  }
                }}
              >
                {isStandard && (
                  <Badge className="absolute -top-2.5 right-3 gap-1">
                    <Star weight="fill" className="h-3 w-3" />
                    Most popular
                  </Badge>
                )}

                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">{meta.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{meta.description}</p>

                    {/* Touch visualization */}
                    <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
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

                    {/* Recommended for */}
                    {meta.recommended_for.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Recommended for: {meta.recommended_for.map(s => SERVICE_TYPE_LABELS[s] || s).join(', ')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {/* Custom option */}
          <div
            role="radio"
            tabIndex={0}
            aria-checked={selected?.type === 'custom'}
            className={cn(
              'relative border rounded-lg p-4 cursor-pointer transition-all',
              selected?.type === 'custom'
                ? 'border-primary ring-2 ring-primary bg-primary/5'
                : 'border-border hover:border-primary/50',
              isPending && 'opacity-50 pointer-events-none'
            )}
            onClick={() => setSelected({ type: 'custom' })}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                setSelected({ type: 'custom' })
              }
            }}
          >
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-muted p-2">
                <Wrench className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-semibold">Custom Campaign</h3>
                <p className="text-sm text-muted-foreground">
                  Build your own sequence from scratch.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* One-off send option */}
        {onOneOff && (
          <div className="border-t pt-4 mt-1">
            <button
              type="button"
              onClick={onOneOff}
              className="flex items-start gap-3 w-full text-left rounded-lg p-3 hover:bg-muted/50 transition-colors"
            >
              <div className="rounded-full bg-muted p-2 shrink-0 mt-0.5">
                <PaperPlaneTilt className="h-4 w-4 text-muted-foreground" />
              </div>
              <div>
                <p className="text-sm font-medium">Send a one-off request instead</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Best for one-time customers who won&apos;t return, like a handyman visit or emergency repair.
                  Sends a single review request without creating a campaign.
                </p>
              </div>
            </button>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button onClick={handleContinue} disabled={!selected || isPending}>
            {isPending ? 'Creating...' : 'Continue'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
