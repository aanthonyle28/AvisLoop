'use client'

import { StatusDot } from '@/components/ui/status-dot'

// Primary status types
export type SendStatus = 'pending' | 'delivered' | 'clicked' | 'failed' | 'reviewed' | 'scheduled'

const statusConfig: Record<SendStatus, {
  label: string
  dotColor: string
}> = {
  pending: {
    label: 'Pending',
    dotColor: 'bg-warning',
  },
  delivered: {
    label: 'Delivered',
    dotColor: 'bg-success',
  },
  clicked: {
    label: 'Clicked',
    dotColor: 'bg-info',
  },
  failed: {
    label: 'Failed',
    dotColor: 'bg-destructive',
  },
  reviewed: {
    label: 'Reviewed',
    dotColor: 'bg-success',
  },
  scheduled: {
    label: 'Scheduled',
    dotColor: 'bg-purple-500 dark:bg-purple-400',
  },
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

  return (
    <StatusDot
      dotColor={config.dotColor}
      label={config.label}
      className={className}
    />
  )
}
