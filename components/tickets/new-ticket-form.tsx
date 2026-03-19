'use client'

import { useState, useTransition } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetBody,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Warning } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { createTicket } from '@/lib/actions/ticket'

interface NewTicketFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  subscriptionTier: string | null
  monthlyCount: number
  monthlyLimit: number
  onTicketCreated: (ticketId: string, isOverage: boolean) => void
}

export function NewTicketForm({
  open,
  onOpenChange,
  projectId,
  subscriptionTier,
  monthlyCount: initialMonthlyCount,
  monthlyLimit,
  onTicketCreated,
}: NewTicketFormProps) {
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [body, setBody] = useState('')
  const [overageConfirmed, setOverageConfirmed] = useState(false)
  // Local count that may be updated if the RPC returns a fresh over_limit count
  const [monthlyCount, setMonthlyCount] = useState(initialMonthlyCount)

  const isAtLimit = monthlyCount >= monthlyLimit
  const isOverSubmit = isAtLimit && !overageConfirmed

  function handleClose(nextOpen: boolean) {
    if (!nextOpen) {
      // Reset form state on close
      setTitle('')
      setDescription('')
      setBody('')
      setOverageConfirmed(false)
      setMonthlyCount(initialMonthlyCount)
    }
    onOpenChange(nextOpen)
  }

  function handleSubmit() {
    if (!title.trim() || isPending) return
    if (isAtLimit && !overageConfirmed) return

    startTransition(async () => {
      const result = await createTicket({
        projectId,
        title: title.trim(),
        description: description.trim() || undefined,
        body: body.trim() || undefined,
        isOverage: overageConfirmed && isAtLimit,
        subscriptionTier,
      })

      if (!result.success) {
        if (result.overLimit) {
          // Race condition: count changed between load and submit — update local count
          if (result.currentCount !== undefined) {
            setMonthlyCount(result.currentCount)
          }
          toast.error('Monthly revision limit reached. Confirm the $50 overage to continue.')
        } else {
          toast.error(result.error ?? 'Failed to create ticket')
        }
        return
      }

      toast.success(
        result.isOverage
          ? `Ticket created ($${result.overageFee ?? 50} overage applied)`
          : 'Ticket created'
      )
      onTicketCreated(result.ticketId, result.isOverage)
      handleClose(false)
    })
  }

  const quotaPercent = monthlyLimit > 0 ? (monthlyCount / monthlyLimit) * 100 : 0
  const isNearLimit = quotaPercent >= 80 && !isAtLimit

  return (
    <Sheet open={open} onOpenChange={handleClose}>
      <SheetContent side="right" className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle>New Revision Request</SheetTitle>
          <SheetDescription asChild>
            <div
              className={cn(
                'text-sm',
                isAtLimit
                  ? 'text-red-600 dark:text-red-400'
                  : isNearLimit
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-muted-foreground'
              )}
            >
              {monthlyCount} of {monthlyLimit} revisions used this month
            </div>
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="space-y-5">
          {/* Overage alert */}
          {isAtLimit && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950 p-4 space-y-3">
              <div className="flex items-start gap-2">
                <Warning
                  size={18}
                  weight="bold"
                  className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5"
                />
                <p className="text-sm text-amber-800 dark:text-amber-200">
                  You&apos;ve used all {monthlyLimit} revisions for this month.
                  Additional requests are available at{' '}
                  <strong>$50 each</strong>.
                </p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={overageConfirmed}
                  onChange={(e) => setOverageConfirmed(e.target.checked)}
                  className="h-4 w-4 rounded border-amber-400 text-amber-600 focus:ring-amber-500"
                />
                <span className="text-sm font-medium text-amber-800 dark:text-amber-200">
                  Confirm $50 overage charge
                </span>
              </label>
            </div>
          )}

          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="ticket-title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="ticket-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Describe the change needed..."
              maxLength={200}
              disabled={isPending}
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <Label htmlFor="ticket-description">Description</Label>
            <Textarea
              id="ticket-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe what needs to be changed..."
              rows={4}
              disabled={isPending}
            />
          </div>

          {/* First message */}
          <div className="space-y-1.5">
            <Label htmlFor="ticket-body">Add a message (optional)</Label>
            <Textarea
              id="ticket-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Any additional context for the client..."
              rows={3}
              disabled={isPending}
            />
          </div>
        </SheetBody>

        <SheetFooter>
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={isPending}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || isPending || isOverSubmit}
            title={
              isOverSubmit
                ? 'Confirm overage charge to continue'
                : undefined
            }
            className={cn(
              'flex-1',
              isAtLimit && overageConfirmed
                ? 'bg-amber-600 hover:bg-amber-700 text-white border-amber-600'
                : ''
            )}
          >
            {isPending
              ? 'Creating...'
              : isAtLimit && overageConfirmed
              ? 'Create ($50 overage)'
              : 'Create Ticket'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
