'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { CircleNotch, CheckCircle, Cursor, WarningCircle, Star } from '@phosphor-icons/react'

// Primary status types
export type SendStatus = 'pending' | 'delivered' | 'clicked' | 'failed' | 'reviewed' | 'scheduled'

const statusConfig: Record<SendStatus, {
  label: string
  bg: string
  text: string
  Icon: typeof CircleNotch
}> = {
  pending: {
    label: 'Pending',
    bg: '#F3F4F6',
    text: '#101828',
    Icon: CircleNotch
  },
  delivered: {
    label: 'Delivered',
    bg: '#EAF3F6',
    text: '#2C879F',
    Icon: CheckCircle
  },
  clicked: {
    label: 'Clicked',
    bg: '#FEF9C2',
    text: '#894B00',
    Icon: Cursor
  },
  failed: {
    label: 'Failed',
    bg: '#FFE2E2',
    text: '#C10007',
    Icon: WarningCircle
  },
  reviewed: {
    label: 'Reviewed',
    bg: '#DCFCE7',
    text: '#008236',
    Icon: Star
  },
  scheduled: {
    label: 'Scheduled',
    bg: 'rgba(159, 44, 134, 0.1)',
    text: '#9F2C86',
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
      style={{
        backgroundColor: config.bg,
        color: config.text
      }}
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 text-xs font-semibold border-0 rounded-full',
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
