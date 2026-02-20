'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DotsThree, PencilSimple, Copy, Trash } from '@phosphor-icons/react'
import { toggleCampaignStatus, deleteCampaign, duplicateCampaign } from '@/lib/actions/campaign'
import { toast } from 'sonner'
import type { CampaignWithTouches } from '@/lib/types/database'
import { SERVICE_TYPE_LABELS } from '@/lib/validations/job'

interface CampaignCardProps {
  campaign: CampaignWithTouches
  onEdit?: (campaignId: string) => void
}

export function CampaignCard({ campaign, onEdit }: CampaignCardProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [optimisticStatus, setOptimisticStatus] = useState(campaign.status)

  const handleStatusToggle = () => {
    const newStatus = optimisticStatus === 'active' ? 'paused' : 'active'
    setOptimisticStatus(newStatus)

    startTransition(async () => {
      const result = await toggleCampaignStatus(campaign.id)
      if (result.error) {
        setOptimisticStatus(campaign.status) // Revert
        toast.error(result.error)
      } else {
        toast.success(newStatus === 'active' ? 'Campaign resumed' : 'Campaign paused')
      }
    })
  }

  const handleDuplicate = () => {
    startTransition(async () => {
      const result = await duplicateCampaign(campaign.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Campaign duplicated')
      }
    })
  }

  const handleDelete = () => {
    if (!confirm('Delete this campaign? This cannot be undone.')) return

    startTransition(async () => {
      const result = await deleteCampaign(campaign.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Campaign deleted')
      }
    })
  }

  const touchCount = campaign.campaign_touches?.length || 0
  const emailCount = campaign.campaign_touches?.filter(t => t.channel === 'email').length || 0
  const smsCount = campaign.campaign_touches?.filter(t => t.channel === 'sms').length || 0

  return (
    <Link
      href={`/campaigns/${campaign.id}`}
      className="block rounded-lg border bg-card p-4 hover:shadow-sm transition-shadow"
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <span className="font-medium truncate">{campaign.name}</span>

            {campaign.service_type ? (
              <Badge variant="secondary" className="shrink-0">
                {SERVICE_TYPE_LABELS[campaign.service_type] || campaign.service_type}
              </Badge>
            ) : (
              <Badge variant="outline" className="shrink-0">
                All Services
              </Badge>
            )}
          </div>

          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
            <span>
              {touchCount} {touchCount === 1 ? 'touch' : 'touches'}
            </span>
            {emailCount > 0 && <span>{emailCount} email</span>}
            {smsCount > 0 && <span>{smsCount} SMS</span>}
          </div>
        </div>

        <div
          className="flex items-center gap-3 shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {optimisticStatus === 'active' ? 'Active' : 'Paused'}
            </span>
            <Switch
              checked={optimisticStatus === 'active'}
              onCheckedChange={handleStatusToggle}
              disabled={isPending}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" disabled={isPending}>
                <DotsThree className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => onEdit ? onEdit(campaign.id) : router.push(`/campaigns/${campaign.id}/edit`)}
              >
                <PencilSimple className="mr-2 h-4 w-4" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-destructive focus:text-destructive"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </Link>
  )
}
