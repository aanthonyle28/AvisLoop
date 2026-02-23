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
      variant="outline"
      size={size}
      onClick={handleClick}
      disabled={isPending}
      className={cn("text-success-foreground border-success/40 hover:bg-success-bg", className)}
    >
      {isPending ? (
        <CircleNotch size={14} className="mr-1 animate-spin" />
      ) : (
        <CheckCircle size={14} weight="fill" className="mr-1 text-success" />
      )}
      {isPending ? 'Completing...' : 'Complete'}
    </Button>
  )
}
