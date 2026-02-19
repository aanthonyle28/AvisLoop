'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import { XCircle, WarningCircle, Info, CheckCircle, DotsThree } from '@phosphor-icons/react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
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
import type { AttentionAlert } from '@/lib/types/dashboard'

interface AttentionAlertsProps {
  alerts: AttentionAlert[]
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

function AlertRow({ alert }: { alert: AttentionAlert }) {
  const [isPending, startTransition] = useTransition()

  const handleRetry = async () => {
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

  const handleAcknowledge = async () => {
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
    <div className="flex items-start justify-between gap-4 py-3 border-b last:border-0">
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <SeverityIcon severity={alert.severity} />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium">{alert.title}</div>
          <div className="text-xs text-muted-foreground">
            {alert.description} • {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {/* Primary action */}
        {alert.type === 'failed_send' && alert.retryable && (
          <Button
            size="sm"
            variant="outline"
            onClick={handleRetry}
            disabled={isPending}
          >
            {isPending ? 'Retrying...' : 'Retry'}
          </Button>
        )}

        {alert.type === 'bounced_email' && (
          <Button size="sm" variant="outline" asChild>
            <Link href={alert.contextualAction.href}>
              {alert.contextualAction.label}
            </Link>
          </Button>
        )}

        {alert.type === 'unresolved_feedback' && (
          <Button size="sm" variant="outline" asChild>
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
      </div>
    </div>
  )
}

export function AttentionAlerts({ alerts }: AttentionAlertsProps) {
  const [expanded, setExpanded] = useState(false)

  const displayedAlerts = expanded ? alerts : alerts.slice(0, 3)
  const hasMore = alerts.length > 3

  return (
    <Card id="attention-alerts">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-semibold">Needs Attention</CardTitle>
        {alerts.length > 0 && (
          <Badge variant="destructive">{alerts.length}</Badge>
        )}
      </CardHeader>
      <CardContent>
        {alerts.length === 0 ? (
          <div className="flex items-center gap-3 py-8 text-center justify-center">
            <CheckCircle weight="fill" className="size-6 text-success" />
            <p className="text-sm text-muted-foreground">
              No issues — everything is running smoothly
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-0">
              {displayedAlerts.map((alert) => (
                <AlertRow key={alert.id} alert={alert} />
              ))}
            </div>

            {hasMore && (
              <div className="pt-4">
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-sm text-primary hover:underline"
                >
                  {expanded ? 'Show less' : `View all (${alerts.length})`}
                </button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export function AttentionAlertsSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="h-5 w-32 bg-muted animate-pulse rounded" />
        <div className="h-5 w-8 bg-muted animate-pulse rounded" />
      </CardHeader>
      <CardContent>
        <div className="space-y-0">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start justify-between gap-4 py-3 border-b last:border-0">
              <div className="flex items-start gap-3 min-w-0 flex-1">
                <div className="size-5 bg-muted animate-pulse rounded-full shrink-0" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-48 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-64 bg-muted animate-pulse rounded" />
                </div>
              </div>
              <div className="h-8 w-20 bg-muted animate-pulse rounded shrink-0" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
