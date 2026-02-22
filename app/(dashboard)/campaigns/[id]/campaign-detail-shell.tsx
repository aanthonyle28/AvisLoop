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
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { PencilSimple, DotsThree, Copy, Trash, Warning } from '@phosphor-icons/react'
import { CampaignForm } from '@/components/campaigns/campaign-form'
import { toggleCampaignStatus, deleteCampaign, duplicateCampaign, getCampaignDeletionInfo } from '@/lib/actions/campaign'
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
  enabledServiceTypes: string[]
}

export function CampaignDetailShell({
  campaign,
  templates,
  enabledServiceTypes,
}: CampaignDetailShellProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [editOpen, setEditOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [optimisticStatus, setOptimisticStatus] = useState(campaign.status)

  // Delete confirmation dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletionInfo, setDeletionInfo] = useState<{ activeEnrollments: number; affectedJobs: number } | null>(null)
  const [isLoadingDeletionInfo, setIsLoadingDeletionInfo] = useState(false)

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

  const handleDeleteClick = async () => {
    setDeleteDialogOpen(true)
    setIsLoadingDeletionInfo(true)
    const info = await getCampaignDeletionInfo(campaign.id)
    setDeletionInfo(info)
    setIsLoadingDeletionInfo(false)
  }

  const handleDeleteConfirm = () => {
    setDeleteDialogOpen(false)
    startTransition(async () => {
      const result = await deleteCampaign(campaign.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Campaign deleted')
        router.push('/campaigns')
      }
    })
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
              enabledServiceTypes={enabledServiceTypes}
              onSuccess={handleEditClose}
            />
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Warning size={20} className="text-destructive" weight="fill" />
              Delete &ldquo;{campaign.name}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p>This action cannot be undone. The campaign and all its touch sequences will be permanently deleted.</p>

                {isLoadingDeletionInfo ? (
                  <p className="text-sm text-muted-foreground">Checking impact...</p>
                ) : deletionInfo && (deletionInfo.activeEnrollments > 0 || deletionInfo.affectedJobs > 0) ? (
                  <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 space-y-1.5">
                    {deletionInfo.activeEnrollments > 0 && (
                      <p className="text-sm font-medium">
                        {deletionInfo.activeEnrollments} active enrollment{deletionInfo.activeEnrollments !== 1 ? 's' : ''} will be stopped
                      </p>
                    )}
                    {deletionInfo.affectedJobs > 0 && (
                      <p className="text-sm font-medium">
                        {deletionInfo.affectedJobs} job{deletionInfo.affectedJobs !== 1 ? 's' : ''} referencing this campaign will be reset to auto-detect
                      </p>
                    )}
                  </div>
                ) : null}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isLoadingDeletionInfo}
            >
              Delete Campaign
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
