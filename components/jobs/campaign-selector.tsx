'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Info } from '@phosphor-icons/react'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getAvailableCampaignsForJob, type AvailableCampaign } from '@/lib/actions/add-job-campaigns'
import type { ServiceType } from '@/lib/types/database'

// Special campaign choice values
export const CAMPAIGN_DO_NOT_SEND = '__do_not_send__'
export const CAMPAIGN_ONE_OFF = '__one_off__'
export const CAMPAIGN_CREATE = '__create_campaign__'

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
  const router = useRouter()
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

  const noCampaigns = campaigns.length === 0

  const handleValueChange = (value: string) => {
    if (value === CAMPAIGN_CREATE) {
      router.push('/campaigns')
      return
    }
    onCampaignChange(value || null)
  }

  return (
    <div className={noCampaigns ? 'space-y-1.5' : undefined}>
      {noCampaigns && (
        <div className="flex items-start gap-2 text-sm text-muted-foreground mb-2">
          <Info size={16} className="mt-0.5 shrink-0" />
          <span>No active campaign for this service type.</span>
        </div>
      )}
      <Select
        value={selectedCampaignId || undefined}
        onValueChange={handleValueChange}
      >
        <SelectTrigger>
          <SelectValue placeholder="No campaign" />
        </SelectTrigger>
        <SelectContent>
          {campaigns.map((c) => {
            let label = c.name
            if (c.isRecommended && campaigns.length > 1) label += ' (Recommended)'
            label += ` \u2014 ${c.touchCount} ${c.touchCount === 1 ? 'touch' : 'touches'}, starts ${formatDelay(c.firstTouchDelayHours)}`
            return (
              <SelectItem key={c.id} value={c.id}>
                {label}
              </SelectItem>
            )
          })}

          {campaigns.length > 0 && <SelectSeparator />}

          {showOneOff && (
            <SelectItem value={CAMPAIGN_ONE_OFF}>
              Send one-off review request
            </SelectItem>
          )}
          <SelectItem value={CAMPAIGN_DO_NOT_SEND}>
            Do not send
          </SelectItem>

          <SelectSeparator />

          <SelectItem value={CAMPAIGN_CREATE}>
            + Create new campaign
          </SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}

function formatDelay(hours: number): string {
  if (hours < 24) return `${hours}h`
  const days = Math.round(hours / 24)
  return `${days}d`
}
