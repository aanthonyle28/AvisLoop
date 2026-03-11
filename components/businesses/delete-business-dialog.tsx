'use client'

import { useTransition } from 'react'
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
import { Warning } from '@phosphor-icons/react'
import { deleteBusiness } from '@/lib/actions/create-additional-business'
import { toast } from 'sonner'

interface DeleteBusinessDialogProps {
  businessId: string
  businessName: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onDeleted?: () => void
}

export function DeleteBusinessDialog({
  businessId,
  businessName,
  open,
  onOpenChange,
  onDeleted,
}: DeleteBusinessDialogProps) {
  const [isPending, startTransition] = useTransition()

  const handleConfirm = () => {
    startTransition(async () => {
      const result = await deleteBusiness(businessId)
      if (!result.success) {
        toast.error(result.error || 'Failed to delete business')
      } else {
        toast.success(`"${businessName}" has been deleted`)
        onOpenChange(false)
        onDeleted?.()
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Warning size={20} className="text-destructive" weight="fill" />
            Delete &ldquo;{businessName}&rdquo;?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-3">
              <p>This action cannot be undone.</p>
              <div className="rounded-md border border-destructive/20 bg-destructive/5 p-3">
                <p className="text-sm font-medium">
                  All data associated with this business will be permanently deleted:
                </p>
                <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                  <li>Jobs and customers</li>
                  <li>Campaigns and enrollments</li>
                  <li>Send history and feedback</li>
                  <li>Templates and settings</li>
                </ul>
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            disabled={isPending}
          >
            {isPending ? 'Deleting...' : 'Delete Business'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
