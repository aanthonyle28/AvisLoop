'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { Info } from '@phosphor-icons/react'
import { Skeleton } from '@/components/ui/skeleton'
import { getAvailableCampaignsForJob, type AvailableCampaign } from '@/lib/actions/add-job-campaigns'
import type { ServiceType } from '@/lib/types/database'

// Special campaign choice values
export const CAMPAIGN_DO_NOT_SEND = '__do_not_send__'
export const CAMPAIGN_ONE_OFF = '__one_off__'

interface CampaignSelectorProps {
  serviceType: ServiceType
  selectedCampaignId: string | null
  onCampaignChange: (campaignId: string | null) => void
  /** Show "Send one-off review" option */
  showOneOff?: boolean
  /** When set, preserves the saved campaign choice instead of auto-selecting recommended */
  defaultCampaignId?: string | null
}

export function CampaignSelector({
  serviceType,
  selectedCampaignId,
  onCampaignChange,
  showOneOff = false,
  defaultCampaignId,
}: CampaignSelectorProps) {
  const [isLoading, startTransition] = useTransition()
  const [campaigns, setCampaigns] = useState<AvailableCampaign[]>([])
  const lastServiceTypeRef = useRef<string>('')
  const onCampaignChangeRef = useRef(onCampaignChange)
  onCampaignChangeRef.current = onCampaignChange

  // Fetch campaigns when serviceType changes
  useEffect(() => {
    if (serviceType === lastServiceTypeRef.current) return
    lastServiceTypeRef.current = serviceType

    startTransition(async () => {
      const result = await getAvailableCampaignsForJob(serviceType)
      setCampaigns(result)

      // If a saved value was provided, preserve it (unless the campaign was deleted)
      if (defaultCampaignId !== undefined) {
        if (
          defaultCampaignId === null ||
          defaultCampaignId === CAMPAIGN_ONE_OFF ||
          defaultCampaignId === CAMPAIGN_DO_NOT_SEND ||
          result.some(c => c.id === defaultCampaignId)
        ) {
          return // Saved choice is still valid — don't overwrite
        }
        // Saved campaign was deleted — fall through to auto-select
      }

      // Auto-select recommended campaign (AddJob flow, or deleted-campaign fallback)
      const recommended = result.find(c => c.isRecommended)
      onCampaignChangeRef.current(recommended?.id ?? null)
    })
  }, [serviceType, defaultCampaignId])

  if (isLoading) {
    return <Skeleton className="h-9 w-full" />
  }

  // Build all options
  const options: Array<{ value: string; label: string }> = []

  // Campaign options
  for (const c of campaigns) {
    let label = c.name
    if (c.isRecommended && campaigns.length > 1) label += ' (Recommended)'
    label += ` \u2014 ${c.touchCount} ${c.touchCount === 1 ? 'touch' : 'touches'}`
    label += `, starts ${formatDelay(c.firstTouchDelayHours)}`
    options.push({ value: c.id, label })
  }

  // One-off option
  if (showOneOff) {
    options.push({ value: CAMPAIGN_ONE_OFF, label: 'Send one-off review request' })
  }

  // Do not send option (always available)
  options.push({ value: CAMPAIGN_DO_NOT_SEND, label: 'Do not send' })

  // No campaigns info message
  const noCampaigns = campaigns.length === 0

  return (
    <div className={noCampaigns ? 'space-y-1.5' : undefined}>
      {noCampaigns && (
        <div className="flex items-start gap-2 text-sm text-muted-foreground mb-2">
          <Info size={16} className="mt-0.5 shrink-0" />
          <span>No active campaign for this service type.</span>
        </div>
      )}
      <select
        value={selectedCampaignId || ''}
        onChange={(e) => onCampaignChange(e.target.value || null)}
        className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
      >
        {noCampaigns && <option value="">No campaign</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}

function formatDelay(hours: number): string {
  if (hours < 24) return `${hours}h`
  const days = Math.round(hours / 24)
  return `${days}d`
}
