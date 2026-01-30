'use client'

import { useState } from 'react'
import { cancelScheduledSend } from '@/lib/actions/schedule'
import { toast } from 'sonner'
import { Loader2, X } from 'lucide-react'

interface CancelButtonProps {
  scheduledSendId: string
}

export function CancelButton({ scheduledSendId }: CancelButtonProps) {
  const [isPending, setIsPending] = useState(false)

  const handleCancel = async () => {
    const confirmed = window.confirm('Cancel this scheduled send?')
    if (!confirmed) return

    setIsPending(true)
    const result = await cancelScheduledSend(scheduledSendId)
    setIsPending(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Scheduled send cancelled')
    }
  }

  return (
    <button
      onClick={handleCancel}
      disabled={isPending}
      className="text-sm text-destructive hover:underline disabled:opacity-50 inline-flex items-center gap-1"
    >
      {isPending ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : (
        <X className="h-3 w-3" />
      )}
      Cancel
    </button>
  )
}
