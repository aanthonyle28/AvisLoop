'use client'

import { useState } from 'react'
import { cancelScheduledSend } from '@/lib/actions/schedule'
import { toast } from 'sonner'
import { CircleNotch, X } from '@phosphor-icons/react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface CancelButtonProps {
  scheduledSendId: string
}

export function CancelButton({ scheduledSendId }: CancelButtonProps) {
  const [isPending, setIsPending] = useState(false)
  const [showDialog, setShowDialog] = useState(false)

  const handleCancel = async () => {
    setIsPending(true)
    const result = await cancelScheduledSend(scheduledSendId)
    setIsPending(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Scheduled send cancelled')
      setShowDialog(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setShowDialog(true)}
        className="text-sm text-destructive hover:underline disabled:opacity-50 inline-flex items-center gap-1"
      >
        <X className="h-3 w-3" />
        Cancel
      </button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel this scheduled send?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This scheduled send will be cancelled and will not be processed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDialog(false)}
              disabled={isPending}
            >
              Keep Scheduled
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isPending}
            >
              {isPending && <CircleNotch className="h-4 w-4 animate-spin" />}
              Cancel Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
