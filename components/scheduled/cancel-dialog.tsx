'use client'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CircleNotch } from '@phosphor-icons/react'

interface CancelDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedCount: number
  onConfirm: () => void
  isPending: boolean
}

export function CancelDialog({
  open,
  onOpenChange,
  selectedCount,
  onConfirm,
  isPending,
}: CancelDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel {selectedCount} scheduled send{selectedCount !== 1 ? 's' : ''}?</DialogTitle>
          <DialogDescription>
            This action cannot be undone. These scheduled sends will be cancelled and will not be processed.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Keep Scheduled
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
          >
            {isPending && <CircleNotch className="h-4 w-4 animate-spin" />}
            Cancel {selectedCount} Send{selectedCount !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
