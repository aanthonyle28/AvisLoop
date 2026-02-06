'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle, CircleNotch } from '@phosphor-icons/react'
import { markJobComplete } from '@/lib/actions/job'
import { toast } from 'sonner'

interface MarkCompleteButtonProps {
  jobId: string
  size?: 'default' | 'sm' | 'xs'
}

export function MarkCompleteButton({ jobId, size = 'sm' }: MarkCompleteButtonProps) {
  const [isPending, startTransition] = useTransition()

  const handleClick = () => {
    startTransition(async () => {
      const result = await markJobComplete(jobId, true)  // true = enroll in campaign

      if (result.success) {
        toast.success('Job marked complete! Campaign enrollment started.')
      } else {
        toast.error(result.error || 'Failed to complete job')
      }
    })
  }

  return (
    <Button
      variant="default"
      size={size}
      onClick={handleClick}
      disabled={isPending}
      className="gap-1.5"
    >
      {isPending ? (
        <CircleNotch className="h-4 w-4 animate-spin" />
      ) : (
        <CheckCircle className="h-4 w-4" weight="bold" />
      )}
      {size !== 'xs' && (isPending ? 'Completing...' : 'Mark Complete')}
    </Button>
  )
}
