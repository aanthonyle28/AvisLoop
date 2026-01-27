'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type SendStatus = 'pending' | 'sent' | 'delivered' | 'bounced' | 'complained' | 'failed' | 'opened'

const statusConfig: Record<SendStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-gray-100 text-gray-800 hover:bg-gray-100' },
  sent: { label: 'Sent', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' },
  delivered: { label: 'Delivered', className: 'bg-green-100 text-green-800 hover:bg-green-100' },
  bounced: { label: 'Bounced', className: 'bg-red-100 text-red-800 hover:bg-red-100' },
  complained: { label: 'Complained', className: 'bg-orange-100 text-orange-800 hover:bg-orange-100' },
  failed: { label: 'Failed', className: 'bg-red-100 text-red-800 hover:bg-red-100' },
  opened: { label: 'Opened', className: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100' },
}

interface StatusBadgeProps {
  status: SendStatus
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status]

  return (
    <Badge
      variant="secondary"
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  )
}
