'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { XCircle, WarningCircle, Info, CheckCircle, DotsThree, DotsThreeVertical, X } from '@phosphor-icons/react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { retrySend, acknowledgeAlert } from '@/lib/actions/dashboard'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { AttentionAlert } from '@/lib/types/dashboard'

interface AttentionAlertsProps {
  alerts: AttentionAlert[]
  /** Called when user clicks an alert row to open right panel detail */
  onSelectAlert?: (alertId: string) => void
  /** Currently selected alert ID — highlights the row */
  selectedAlertId?: string
}

function SeverityIcon({ severity }: { severity: AttentionAlert['severity'] }) {
  switch (severity) {
    case 'critical':
      return <XCircle weight="fill" className="size-5 text-destructive shrink-0" />
    case 'warning':
      return <WarningCircle weight="fill" className="size-5 text-warning shrink-0" />
    case 'info':
      return <Info weight="fill" className="size-5 text-info shrink-0" />
  }
}

interface AlertRowProps {
  alert: AttentionAlert
  isSelected: boolean
  onSelect?: () => void
  onDismiss?: (id: string) => void
}

function AlertRow({ alert, isSelected, onSelect, onDismiss }: AlertRowProps) {
  const [isPending, startTransition] = useTransition()

  const handleRetry = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!alert.sendLogId) return

    startTransition(async () => {
      const result = await retrySend(alert.sendLogId!)
      if (result.success) {
        toast.success('Send queued for retry')
      } else {
        toast.error(result.error || 'Failed to retry')
      }
    })
  }

  const handleAcknowledge = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!alert.sendLogId) return

    startTransition(async () => {
      const result = await acknowledgeAlert(alert.sendLogId!)
      if (result.success) {
        toast.success('Alert acknowledged')
      } else {
        toast.error(result.error || 'Failed to acknowledge')
      }
    })
  }

  return (
    <div
      className={cn(
        'flex items-start justify-between gap-3 px-3 py-2.5 cursor-pointer transition-colors',
        isSelected ? 'bg-muted' : 'hover:bg-muted/50',
      )}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelect?.() }}
    >
      <div className="flex items-start gap-2 min-w-0 flex-1">
        <SeverityIcon severity={alert.severity} />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium leading-tight">{alert.title}</div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {alert.description} · {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
          </div>
        </div>
      </div>

      {/* Action buttons — desktop (stop propagation so row click doesn't fire) */}
      <div className="hidden lg:flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
        {alert.type === 'failed_send' && alert.retryable && (
          <Button
            size="sm"
            variant="soft"
            onClick={handleRetry}
            disabled={isPending}
          >
            {isPending ? 'Retrying...' : 'Retry'}
          </Button>
        )}

        {alert.type === 'bounced_email' && (
          <Button size="sm" variant="soft" asChild>
            <Link href={alert.contextualAction.href}>
              {alert.contextualAction.label}
            </Link>
          </Button>
        )}

        {alert.type === 'unresolved_feedback' && (
          <Button size="sm" variant="soft" asChild>
            <Link href={alert.contextualAction.href}>
              {alert.contextualAction.label}
            </Link>
          </Button>
        )}

        {/* Overflow menu for permanent failures */}
        {(alert.type === 'bounced_email' || alert.type === 'stop_request') && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="sm" variant="ghost" className="size-8 p-0">
                <DotsThree weight="bold" className="size-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleAcknowledge} disabled={isPending}>
                Acknowledge
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        <Button
          size="icon-sm"
          variant="ghost"
          className="text-muted-foreground hover:text-foreground"
          onClick={(e) => { e.stopPropagation(); onDismiss?.(alert.id) }}
          aria-label="Dismiss alert"
        >
          <X className="size-4" />
        </Button>
      </div>

      {/* Action buttons — mobile overflow menu */}
      <div className="flex lg:hidden items-center shrink-0" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon-sm" variant="ghost">
              <DotsThreeVertical className="h-5 w-5" weight="bold" />
              <span className="sr-only">Actions</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {alert.type === 'failed_send' && alert.retryable && (
              <DropdownMenuItem onClick={handleRetry} disabled={isPending}>
                {isPending ? 'Retrying...' : 'Retry'}
              </DropdownMenuItem>
            )}
            {(alert.type === 'bounced_email' || alert.type === 'unresolved_feedback') && (
              <DropdownMenuItem asChild>
                <Link href={alert.contextualAction.href}>
                  {alert.contextualAction.label}
                </Link>
              </DropdownMenuItem>
            )}
            {(alert.type === 'bounced_email' || alert.type === 'stop_request') && (
              <DropdownMenuItem onClick={handleAcknowledge} disabled={isPending}>
                Acknowledge
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onClick={() => onDismiss?.(alert.id)}>
              <X className="size-4 mr-2" />
              Dismiss
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

export function AttentionAlerts({ alerts, onSelectAlert, selectedAlertId }: AttentionAlertsProps) {
  const [expanded, setExpanded] = useState(false)
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  const visibleAlerts = alerts.filter(a => !dismissedIds.has(a.id))
  const displayedAlerts = expanded ? visibleAlerts : visibleAlerts.slice(0, 3)
  const hasMore = visibleAlerts.length > 3

  const handleDismiss = (id: string) => {
    setDismissedIds(prev => new Set([...prev, id]))
  }

  return (
    <div id="attention-alerts">
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <h2 className="text-lg font-semibold">Needs Attention</h2>
        {visibleAlerts.length > 0 && (
          <Badge variant="destructive">{visibleAlerts.length}</Badge>
        )}
      </div>

      {visibleAlerts.length === 0 ? (
        <div className="flex items-center gap-3 py-8 text-center justify-center">
          <CheckCircle weight="fill" className="size-5 text-success" />
          <p className="text-sm text-muted-foreground">
            No issues — everything is running smoothly
          </p>
        </div>
      ) : (
        <>
          <div className="divide-y divide-border">
            {displayedAlerts.map((alert) => (
              <AlertRow
                key={alert.id}
                alert={alert}
                isSelected={selectedAlertId === alert.id}
                onSelect={() => onSelectAlert?.(alert.id)}
                onDismiss={handleDismiss}
              />
            ))}
          </div>

          {hasMore && (
            <div className="pt-3">
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-sm text-accent hover:underline"
              >
                {expanded ? 'Show less' : `View all (${visibleAlerts.length})`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}

export function AttentionAlertsSkeleton() {
  return (
    <div>
      {/* Header skeleton */}
      <div className="flex items-center gap-2 mb-2">
        <div className="h-5 w-32 bg-muted animate-pulse rounded" />
        <div className="h-5 w-8 bg-muted animate-pulse rounded" />
      </div>
      {/* Row skeletons */}
      <div className="divide-y divide-border">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start justify-between gap-3 rounded-md px-3 py-2.5">
            <div className="flex items-start gap-2 min-w-0 flex-1">
              <div className="size-5 bg-muted animate-pulse rounded-full shrink-0" />
              <div className="space-y-1.5 flex-1">
                <div className="h-4 w-48 bg-muted animate-pulse rounded" />
                <div className="h-3 w-64 bg-muted animate-pulse rounded" />
              </div>
            </div>
            <div className="h-8 w-20 bg-muted animate-pulse rounded shrink-0" />
          </div>
        ))}
      </div>
    </div>
  )
}
