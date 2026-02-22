'use client'

import { useState, useEffect, useTransition } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Warning } from '@phosphor-icons/react'
import { deleteCampaign, getCampaignDeletionInfo } from '@/lib/actions/campaign'
import { toast } from 'sonner'

type DeletionInfo = {
  activeEnrollments: number
  affectedJobs: number
  availableCampaigns: { id: string; name: string; service_type: string | null }[]
}

interface DeleteCampaignDialogProps {
  campaignId: string
  campaignName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted?: () => void
}

export function DeleteCampaignDialog({
  campaignId,
  campaignName,
  open,
  onOpenChange,
  onDeleted,
}: DeleteCampaignDialogProps) {
  const [, startTransition] = useTransition()
  const [deletionInfo, setDeletionInfo] = useState<DeletionInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [selectedReassignId, setSelectedReassignId] = useState<string>('none')

  // Load deletion info when dialog opens
  useEffect(() => {
    if (open) {
      setIsLoading(true)
      setDeletionInfo(null)
      setSelectedReassignId('none')
      getCampaignDeletionInfo(campaignId)
        .then(info => setDeletionInfo(info))
        .catch(() => {
          setDeletionInfo({ activeEnrollments: 0, affectedJobs: 0, availableCampaigns: [] })
          toast.error('Failed to load deletion impact info')
        })
        .finally(() => setIsLoading(false))
    }
  }, [open, campaignId])

  const handleConfirm = () => {
    const reassignId = selectedReassignId === 'none' ? null : selectedReassignId
    onOpenChange(false)
    startTransition(async () => {
      const result = await deleteCampaign(campaignId, reassignId)
      if (result.error) {
        toast.error(result.error)
      } else {
        const movedCount = deletionInfo?.activeEnrollments ?? 0
        if (reassignId && movedCount > 0) {
          const targetName = deletionInfo?.availableCampaigns.find(c => c.id === reassignId)?.name
          toast.success(`Campaign deleted. ${movedCount} enrollment${movedCount !== 1 ? 's' : ''} moved to ${targetName}.`)
        } else {
          toast.success('Campaign deleted')
        }
        onDeleted?.()
      }
    })
  }

  const hasEnrollments = deletionInfo && deletionInfo.activeEnrollments > 0
  const hasOtherCampaigns = deletionInfo && deletionInfo.availableCampaigns.length > 0

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Warning size={20} className="text-destructive" weight="fill" />
            Delete &ldquo;{campaignName}&rdquo;?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>This action cannot be undone. The campaign and all its touch sequences will be permanently deleted.</p>

              {isLoading ? (
                <p className="text-sm text-muted-foreground">Checking impact...</p>
              ) : deletionInfo && (deletionInfo.activeEnrollments > 0 || deletionInfo.affectedJobs > 0) ? (
                <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3 space-y-3">
                  {hasEnrollments && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">
                        {deletionInfo.activeEnrollments} active enrollment{deletionInfo.activeEnrollments !== 1 ? 's' : ''} in this campaign
                      </p>

                      {hasOtherCampaigns ? (
                        <div className="space-y-1.5">
                          <label className="text-sm text-muted-foreground">
                            Move enrolled customers to:
                          </label>
                          <Select value={selectedReassignId} onValueChange={setSelectedReassignId}>
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">
                                Don&apos;t re-enroll (stop all)
                              </SelectItem>
                              {deletionInfo.availableCampaigns.map(c => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {selectedReassignId !== 'none' && (
                            <p className="text-xs text-muted-foreground">
                              Customers will restart from touch 1 in the selected campaign.
                            </p>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">
                          All active enrollments will be stopped.
                        </p>
                      )}
                    </div>
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
            onClick={handleConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isLoading}
          >
            Delete Campaign
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
