'use client'

import { useTransition } from 'react'
import { Button } from '@/components/ui/button'
import { CheckCircle, CircleNotch } from '@phosphor-icons/react'
import { markJobComplete } from '@/lib/actions/job'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface MarkCompleteButtonProps {
  jobId: string
  size?: 'default' | 'sm' | 'xs'
  className?: string
}

export function MarkCompleteButton({ jobId, size = 'sm', className }: MarkCompleteButtonProps) {
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
      className={cn("gap-1.5", className)}
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
