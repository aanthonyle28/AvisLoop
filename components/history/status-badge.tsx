'use client'

import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export type SendStatus = 'pending' | 'sent' | 'delivered' | 'bounced' | 'complained' | 'failed' | 'opened'

const statusConfig: Record<SendStatus, { label: string; className: string }> = {
  pending: { label: 'Pending', className: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800' },
  sent: { label: 'Sent', className: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 hover:bg-blue-100 dark:hover:bg-blue-900' },
  delivered: { label: 'Delivered', className: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 hover:bg-green-100 dark:hover:bg-green-900' },
  bounced: { label: 'Bounced', className: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-900' },
  complained: { label: 'Complained', className: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200 hover:bg-orange-100 dark:hover:bg-orange-900' },
  failed: { label: 'Failed', className: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 hover:bg-red-100 dark:hover:bg-red-900' },
  opened: { label: 'Opened', className: 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100 dark:hover:bg-emerald-900' },
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
