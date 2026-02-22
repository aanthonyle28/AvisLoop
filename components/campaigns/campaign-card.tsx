'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
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

  const handleCardClick = () => {
    router.push(`/campaigns/${campaign.id}`)
  }

  const handleStatusToggle = () => {
    const newStatus = optimisticStatus === 'active' ? 'paused' : 'active'
    setOptimisticStatus(newStatus)

    startTransition(async () => {
      const result = await toggleCampaignStatus(campaign.id)
      if (result.error) {
        setOptimisticStatus(campaign.status)
        toast.error(result.error)
      } else {
        toast.success(newStatus === 'active' ? 'Campaign resumed' : 'Campaign paused')
      }
    })
  }

  const handleEdit = () => {
    if (onEdit) {
      onEdit(campaign.id)
    } else {
      router.push(`/campaigns/${campaign.id}?edit=true`)
    }
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
    <div
      className="rounded-lg border bg-card p-4 hover:shadow-sm transition-shadow cursor-pointer"
      onClick={handleCardClick}
      role="link"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          handleCardClick()
        }
      }}
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

        {/* Actions area — stopPropagation prevents card navigation */}
        <div
          className="flex items-center gap-3 shrink-0"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={(e) => e.stopPropagation()}
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

          {/* Desktop: visible action buttons */}
          <TooltipProvider delayDuration={300}>
            <div className="hidden md:flex items-center gap-1">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon-sm" onClick={handleEdit} disabled={isPending} aria-label="Edit campaign">
                    <PencilSimple className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Edit</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon-sm" onClick={handleDuplicate} disabled={isPending} aria-label="Duplicate campaign">
                    <Copy className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Duplicate</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon-sm" onClick={handleDelete} disabled={isPending} className="text-destructive hover:text-destructive" aria-label="Delete campaign">
                    <Trash className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Delete</TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>

          {/* Mobile: 3-dot menu */}
          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" disabled={isPending}>
                  <DotsThree className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleEdit}>
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
      </div>
    </div>
  )
}
