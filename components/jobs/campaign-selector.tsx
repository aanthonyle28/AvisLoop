'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
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
  /** When set, suppresses auto-recommendation on initial load (preserves saved campaign_override when editing) */
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
  const [lastServiceType, setLastServiceType] = useState<string>('')
  const isInitialFetch = useRef(true)

  // Stable callback ref so useEffect doesn't re-fire on every render
  const onCampaignChangeRef = useCallback(onCampaignChange, [onCampaignChange])

  // Fetch campaigns when serviceType changes
  useEffect(() => {
    if (serviceType === lastServiceType) return
    setLastServiceType(serviceType)

    startTransition(async () => {
      const result = await getAvailableCampaignsForJob(serviceType)
      setCampaigns(result)

      // On initial fetch with a defaultCampaignId, preserve the saved choice
      // BUT only if the saved campaign still exists (wasn't deleted)
      if (isInitialFetch.current && defaultCampaignId !== undefined && defaultCampaignId !== null) {
        isInitialFetch.current = false
        const savedExists =
          defaultCampaignId === CAMPAIGN_ONE_OFF ||
          defaultCampaignId === CAMPAIGN_DO_NOT_SEND ||
          result.some(c => c.id === defaultCampaignId)
        if (savedExists) return
        // Saved campaign was deleted — fall through to auto-select
      }
      isInitialFetch.current = false

      // Auto-select recommended campaign
      const recommended = result.find(c => c.isRecommended)
      onCampaignChangeRef(recommended?.id ?? null)
    })
  }, [serviceType, lastServiceType, onCampaignChangeRef, defaultCampaignId])

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
