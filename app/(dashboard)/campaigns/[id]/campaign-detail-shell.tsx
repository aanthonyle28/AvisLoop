'use client'

import { useState, useEffect, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { PencilSimple, DotsThree, Copy, Trash } from '@phosphor-icons/react'
import { CampaignForm } from '@/components/campaigns/campaign-form'
import { DeleteCampaignDialog } from '@/components/campaigns/delete-campaign-dialog'
import { toggleCampaignStatus, duplicateCampaign } from '@/lib/actions/campaign'
import { toast } from 'sonner'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import type { CampaignWithTouches, MessageTemplate } from '@/lib/types/database'

interface CampaignDetailShellProps {
  campaign: CampaignWithTouches
  templates: MessageTemplate[]
}

export function CampaignDetailShell({
  campaign,
  templates,
}: CampaignDetailShellProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [editOpen, setEditOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [optimisticStatus, setOptimisticStatus] = useState(campaign.status)

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // Auto-open edit sheet when ?edit=true is present (e.g. after creation)
  useEffect(() => {
    if (searchParams.get('edit') === 'true') {
      setEditOpen(true)
      router.replace(`/campaigns/${campaign.id}`, { scroll: false })
    }
  }, [searchParams, campaign.id, router])

  const handleEditClose = () => {
    setEditOpen(false)
    router.refresh()
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
        router.refresh()
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
        if (result.data?.campaignId) {
          router.push(`/campaigns/${result.data.campaignId}`)
        }
      }
    })
  }

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true)
  }

  return (
    <>
      {!campaign.is_preset && (
        <div className="flex items-center gap-3">
          {/* Status toggle */}
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

          {/* Edit button */}
          <Button onClick={() => setEditOpen(true)} disabled={isPending}>
            <PencilSimple className="mr-2 h-4 w-4" />
            Edit Campaign
          </Button>

          {/* Overflow menu: Duplicate + Delete */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" disabled={isPending} aria-label="Campaign actions">
                <DotsThree className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleDuplicate}>
                <Copy className="mr-2 h-4 w-4" />
                Duplicate
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleDeleteClick}
                className="text-destructive focus:text-destructive"
              >
                <Trash className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}

      {/* Edit Campaign Sheet */}
      <Sheet open={editOpen} onOpenChange={(open) => !open && handleEditClose()}>
        <SheetContent className="overflow-y-auto sm:max-w-2xl">
          <SheetHeader>
            <SheetTitle>Edit Campaign</SheetTitle>
            <SheetDescription>
              Update your campaign settings and touch sequence
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6">
            <CampaignForm
              campaign={campaign}
              templates={templates}
              onSuccess={handleEditClose}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <DeleteCampaignDialog
        campaignId={campaign.id}
        campaignName={campaign.name}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onDeleted={() => router.push('/campaigns')}
      />
    </>
  )
}
