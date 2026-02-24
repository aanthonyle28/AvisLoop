'use client'

import { useTransition } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import {
  XCircle,
  WarningCircle,
  Star,
  ArrowSquareOut,
  User,
  CircleNotch,
  CheckCircle,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { useDashboardPanel } from '@/components/dashboard/dashboard-shell'
import { retrySend, acknowledgeAlert } from '@/lib/actions/dashboard'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { SelectableAlertItem } from '@/lib/types/dashboard'

interface RightPanelAttentionDetailProps {
  alert: SelectableAlertItem
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={16}
          weight={star <= rating ? 'fill' : 'regular'}
          className={cn(
            star <= rating ? 'text-amber-500 dark:text-amber-400' : 'text-muted-foreground/40'
          )}
        />
      ))}
      <span className="ml-1.5 text-sm font-medium">{rating}/5</span>
    </div>
  )
}

function FailedSendDetail({
  alert,
  onClose,
}: {
  alert: SelectableAlertItem
  onClose: () => void
}) {
  const [isPending, startTransition] = useTransition()

  const handleRetry = () => {
    if (!alert.sendLogId) return
    startTransition(async () => {
      const result = await retrySend(alert.sendLogId!)
      if (result.success) {
        toast.success('Send queued for retry')
        onClose()
      } else {
        toast.error(result.error || 'Failed to retry')
      }
    })
  }

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <XCircle size={20} weight="fill" className="text-destructive shrink-0" />
          <p className="text-sm font-semibold text-destructive">Send Failed</p>
        </div>
        <div className="flex items-center gap-1.5">
          <User size={13} className="text-muted-foreground shrink-0" />
          <p className="text-base font-semibold">{alert.customerName}</p>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Error details */}
      <div>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">
          Error
        </span>
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3">
          <p className="text-xs text-foreground/80 leading-relaxed">
            {alert.errorMessage || alert.description || 'An error occurred while sending the message.'}
          </p>
        </div>
      </div>

      {/* Timestamp */}
      <div>
        <span className="text-xs text-muted-foreground">
          Failed {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
        </span>
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Actions */}
      <div className="space-y-2">
        {alert.retryable && (
          <Button
            className="w-full"
            onClick={handleRetry}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <CircleNotch size={14} className="mr-1.5 animate-spin" />
                Retrying...
              </>
            ) : (
              'Retry Send'
            )}
          </Button>
        )}
        <Button variant="outline" className="w-full" asChild>
          <Link href="/history">
            <ArrowSquareOut size={14} className="mr-1.5" />
            View in History
          </Link>
        </Button>
      </div>
    </div>
  )
}

function UnresolvedFeedbackDetail({
  alert,
  onClose,
}: {
  alert: SelectableAlertItem
  onClose: () => void
}) {
  // Close panel after navigation (not needed for link navigation, but signal intent)
  const handleResolveClick = () => {
    onClose()
  }

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-1.5 mb-3">
          <User size={13} className="text-muted-foreground shrink-0" />
          <p className="text-base font-semibold">{alert.customerName}</p>
        </div>
        {alert.rating != null && (
          <StarRating rating={alert.rating} />
        )}
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Feedback text */}
      {alert.feedbackText && (
        <div>
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">
            Feedback
          </span>
          <blockquote className="rounded-md bg-muted/30 border-l-2 border-border pl-3 pr-3 py-2.5">
            <p className="text-sm text-foreground/80 leading-relaxed italic">
              &ldquo;{alert.feedbackText}&rdquo;
            </p>
          </blockquote>
        </div>
      )}

      {/* Timestamp */}
      <div>
        <span className="text-xs text-muted-foreground">
          Submitted {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
        </span>
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Actions */}
      <div className="space-y-2">
        <Button
          className="w-full"
          asChild
          onClick={handleResolveClick}
        >
          <Link href={alert.feedbackId ? `/feedback?id=${alert.feedbackId}` : '/feedback'}>
            <CheckCircle size={14} className="mr-1.5" />
            Resolve Feedback
          </Link>
        </Button>
        <Button variant="outline" className="w-full" asChild>
          <Link href="/feedback">
            <ArrowSquareOut size={14} className="mr-1.5" />
            View All Feedback
          </Link>
        </Button>
      </div>
    </div>
  )
}

function BouncedEmailDetail({
  alert,
  onClose,
}: {
  alert: SelectableAlertItem
  onClose: () => void
}) {
  const [isPending, startTransition] = useTransition()

  const handleAcknowledge = () => {
    if (!alert.sendLogId) {
      onClose()
      return
    }
    startTransition(async () => {
      const result = await acknowledgeAlert(alert.sendLogId!)
      if (result.success) {
        toast.success('Alert acknowledged')
        onClose()
      } else {
        toast.error(result.error || 'Failed to acknowledge')
      }
    })
  }

  return (
    <div className="p-4 space-y-5">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <WarningCircle size={20} weight="fill" className="text-warning shrink-0" />
          <p className="text-sm font-semibold text-warning-foreground">Email Bounced</p>
        </div>
        <div className="flex items-center gap-1.5">
          <User size={13} className="text-muted-foreground shrink-0" />
          <p className="text-base font-semibold">{alert.customerName}</p>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Error details */}
      <div>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-2">
          Details
        </span>
        <div className="rounded-md bg-warning/10 border border-warning/20 p-3">
          <p className="text-xs text-foreground/80 leading-relaxed">
            {alert.errorMessage || 'The email address did not accept delivery. Update the customer email address and retry.'}
          </p>
        </div>
      </div>

      {/* Timestamp */}
      <div>
        <span className="text-xs text-muted-foreground">
          Bounced {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
        </span>
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Actions */}
      <div className="space-y-2">
        <Button className="w-full" asChild>
          <Link href="/customers">
            Update Customer Email
          </Link>
        </Button>
        <Button
          variant="ghost"
          className="w-full text-muted-foreground"
          onClick={handleAcknowledge}
          disabled={isPending}
        >
          {isPending ? (
            <>
              <CircleNotch size={14} className="mr-1.5 animate-spin" />
              Acknowledging...
            </>
          ) : (
            'Acknowledge'
          )}
        </Button>
      </div>
    </div>
  )
}

export function RightPanelAttentionDetail({ alert }: RightPanelAttentionDetailProps) {
  const { closePanel } = useDashboardPanel()

  switch (alert.type) {
    case 'failed_send':
      return <FailedSendDetail alert={alert} onClose={closePanel} />
    case 'unresolved_feedback':
      return <UnresolvedFeedbackDetail alert={alert} onClose={closePanel} />
    case 'bounced_email':
      return <BouncedEmailDetail alert={alert} onClose={closePanel} />
    default:
      return (
        <div className="p-4 text-center">
          <p className="text-sm text-muted-foreground">
            Unknown alert type
          </p>
        </div>
      )
  }
}
