'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { batchSendReviewRequest } from '@/lib/actions/send'
import { scheduleReviewRequest } from '@/lib/actions/schedule'
import { toastError } from '@/lib/utils/toast'
import { toast } from 'sonner'
import { COOLDOWN_DAYS } from '@/lib/constants/billing'
import type { Contact, EmailTemplate } from '@/lib/types/database'
import { format } from 'date-fns'

type SchedulePreset = 'immediately' | '1hour' | 'morning' | 'custom'

interface BulkSendConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  contacts: Contact[]
  template: EmailTemplate
  schedulePreset: SchedulePreset
  customDateTime: string
  resendReadyIds: Set<string>
  onSuccess: () => void
}

export function BulkSendConfirmDialog({
  open,
  onOpenChange,
  contacts,
  template,
  schedulePreset,
  customDateTime,
  resendReadyIds,
  onSuccess,
}: BulkSendConfirmDialogProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Calculate eligible/skipped/opted-out counts
  const categorized = useMemo(() => {
    const cooldownDate = new Date(Date.now() - COOLDOWN_DAYS * 24 * 60 * 60 * 1000)

    const eligible: Contact[] = []
    const onCooldown: Contact[] = []
    const optedOut: Contact[] = []

    for (const contact of contacts) {
      // Opted out
      if (contact.opted_out) {
        optedOut.push(contact)
        continue
      }

      // Archived
      if (contact.status === 'archived') {
        optedOut.push(contact)
        continue
      }

      // Never sent or resend ready
      if (!contact.last_sent_at || resendReadyIds.has(contact.id)) {
        eligible.push(contact)
        continue
      }

      // On cooldown
      if (new Date(contact.last_sent_at) > cooldownDate) {
        onCooldown.push(contact)
        continue
      }

      // Default to eligible
      eligible.push(contact)
    }

    return { eligible, onCooldown, optedOut }
  }, [contacts, resendReadyIds])

  const totalCount = contacts.length
  const eligibleCount = categorized.eligible.length
  const skippedCount = categorized.onCooldown.length
  const optedOutCount = categorized.optedOut.length

  // Determine if we're scheduling
  const isScheduling = schedulePreset !== 'immediately'

  // Calculate scheduled time
  const scheduledFor = useMemo(() => {
    if (schedulePreset === 'immediately') return null

    if (schedulePreset === 'custom') {
      return customDateTime ? new Date(customDateTime).toISOString() : null
    }

    const now = new Date()

    if (schedulePreset === '1hour') {
      now.setHours(now.getHours() + 1)
      return now.toISOString()
    }

    if (schedulePreset === 'morning') {
      const tomorrow = new Date(now)
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(9, 0, 0, 0)
      return tomorrow.toISOString()
    }

    return null
  }, [schedulePreset, customDateTime])

  const handleConfirm = () => {
    if (eligibleCount === 0) {
      toastError('No eligible contacts', 'All contacts are either opted out or on cooldown')
      return
    }

    setError(null)

    startTransition(async () => {
      try {
        const formData = new FormData()
        formData.append('contactIds', JSON.stringify(categorized.eligible.map(c => c.id)))
        formData.append('templateId', template.id)

        if (isScheduling && scheduledFor) {
          // Schedule the send
          formData.append('scheduledFor', scheduledFor)

          const result = await scheduleReviewRequest(null, formData)

          if (result.error) {
            setError(result.error)
            toastError('Failed to schedule', result.error)
            return
          }

          if (result.success && result.data) {
            const timeStr = format(new Date(result.data.scheduledFor), 'MMM d, h:mm a')
            toast.success(`Scheduled for ${eligibleCount} contacts`, {
              description: `Will send ${timeStr}`,
              duration: 6000,
            })

            router.refresh()
            onSuccess()
          }
        } else {
          // Send immediately
          const result = await batchSendReviewRequest(null, formData)

          if (result.error) {
            setError(result.error)
            toastError('Failed to send', result.error)
            return
          }

          if (result.success && result.data) {
            toast.success(`Sent to ${result.data.sent} contacts`, {
              description: result.data.failed > 0
                ? `${result.data.failed} failed, ${result.data.skipped} skipped`
                : `${result.data.skipped} skipped`,
              duration: 6000,
              action: {
                label: 'View history',
                onClick: () => router.push('/history'),
              },
            })

            router.refresh()
            onSuccess()
          }
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Unknown error'
        setError(errorMsg)
        toastError('Error', errorMsg)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isScheduling ? 'Confirm Schedule' : 'Confirm Send'}
          </DialogTitle>
          <DialogDescription>
            Review the details before {isScheduling ? 'scheduling' : 'sending'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Summary section */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total contacts:</span>
              <span className="font-medium">{totalCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Eligible:</span>
              <span className="font-medium text-green-600">{eligibleCount}</span>
            </div>
            {skippedCount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Skipped (cooldown):</span>
                <span className="font-medium text-yellow-600">{skippedCount}</span>
              </div>
            )}
            {optedOutCount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Opted out:</span>
                <span className="font-medium text-destructive">{optedOutCount}</span>
              </div>
            )}
          </div>

          {/* Template info */}
          <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
            <div className="text-xs text-muted-foreground">Template</div>
            <div className="font-medium text-sm">{template.name}</div>
            <div className="text-xs text-muted-foreground">{template.subject}</div>
          </div>

          {/* Schedule info */}
          {isScheduling && scheduledFor && (
            <div className="rounded-lg border bg-muted/30 p-3 space-y-1.5">
              <div className="text-xs text-muted-foreground">Scheduled for</div>
              <div className="font-medium text-sm">
                {format(new Date(scheduledFor), 'EEEE, MMMM d, yyyy')}
              </div>
              <div className="text-xs text-muted-foreground">
                {format(new Date(scheduledFor), 'h:mm a')}
              </div>
            </div>
          )}

          {/* Warning if all skipped */}
          {eligibleCount === 0 && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              All contacts are either opted out or on cooldown. Cannot proceed.
            </div>
          )}

          {/* Error display */}
          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isPending || eligibleCount === 0}
          >
            {isPending
              ? isScheduling ? 'Scheduling...' : 'Sending...'
              : isScheduling
                ? `Schedule for ${eligibleCount} contacts`
                : `Send to ${eligibleCount} contacts`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
