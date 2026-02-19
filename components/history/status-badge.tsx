'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { CircleNotch, CheckCircle, Cursor, WarningCircle, Star } from '@phosphor-icons/react'

// Primary status types
export type SendStatus = 'pending' | 'delivered' | 'clicked' | 'failed' | 'reviewed' | 'scheduled'

const statusConfig: Record<SendStatus, {
  label: string
  className: string
  Icon: typeof CircleNotch
}> = {
  pending: {
    label: 'Pending',
    className: 'bg-status-pending-bg text-status-pending-text border border-status-pending-text/20',
    Icon: CircleNotch
  },
  delivered: {
    label: 'Delivered',
    className: 'bg-status-delivered-bg text-status-delivered-text border border-status-delivered-text/20',
    Icon: CheckCircle
  },
  clicked: {
    label: 'Clicked',
    className: 'bg-status-clicked-bg text-status-clicked-text border border-status-clicked-text/20',
    Icon: Cursor
  },
  failed: {
    label: 'Failed',
    className: 'bg-status-failed-bg text-status-failed-text border border-status-failed-text/20',
    Icon: WarningCircle
  },
  reviewed: {
    label: 'Reviewed',
    className: 'bg-status-reviewed-bg text-status-reviewed-text border border-status-reviewed-text/20',
    Icon: Star
  },
  scheduled: {
    label: 'Scheduled',
    className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-200 dark:border-purple-800',
    Icon: CheckCircle
  }
}

// Normalize legacy status strings to primary statuses
function normalizeStatus(status: string): SendStatus {
  const normalized = status.toLowerCase()

  // Legacy mappings
  if (normalized === 'sent' || normalized === 'opened' || normalized === 'completed') {
    return 'delivered'
  }
  if (normalized === 'bounced' || normalized === 'complained') {
    return 'failed'
  }

  // If it's a valid primary status, return it
  if (['pending', 'delivered', 'clicked', 'failed', 'reviewed', 'scheduled'].includes(normalized)) {
    return normalized as SendStatus
  }

  // Unknown status defaults to pending
  return 'pending'
}

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const normalizedStatus = normalizeStatus(status)
  const config = statusConfig[normalizedStatus]
  const Icon = config.Icon

  return (
    <Badge
      className={cn(
        config.className,
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold rounded-full',
        className
      )}
    >
      <Icon
        className={normalizedStatus === 'pending' ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'}
        weight="bold"
      />
      {config.label}
    </Badge>
  )
}
