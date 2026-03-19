'use client'

import { useState } from 'react'
import { formatDistanceToNow, format } from 'date-fns'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { Plus, Warning } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import type { ProjectTicket, TicketStatus, TicketPriority } from '@/lib/types/database'

interface TicketListProps {
  tickets: ProjectTicket[]
  projectDomain: string | null
  subscriptionTier: string | null
  monthlyCount: number
  monthlyLimit: number
  onTicketSelect: (ticket: ProjectTicket) => void
  onNewTicket: () => void
  selectedTicketId?: string
}

function StatusBadge({ status }: { status: TicketStatus }) {
  const config: Record<string, { label: string; className: string }> = {
    submitted: {
      label: 'Submitted',
      className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
    },
    in_progress: {
      label: 'In Progress',
      className: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100',
    },
    completed: {
      label: 'Completed',
      className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    },
    open: {
      label: 'Open',
      className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
    },
    waiting_client: {
      label: 'Waiting',
      className: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100',
    },
    resolved: {
      label: 'Resolved',
      className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    },
    closed: {
      label: 'Closed',
      className: 'bg-muted text-muted-foreground',
    },
  }

  const cfg = config[status] ?? {
    label: status,
    className: 'bg-muted text-muted-foreground',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        cfg.className
      )}
    >
      {cfg.label}
    </span>
  )
}

function PriorityBadge({ priority }: { priority: TicketPriority }) {
  const config: Record<string, { label: string; className: string }> = {
    low: { label: 'Low', className: 'bg-muted text-muted-foreground' },
    normal: {
      label: 'Normal',
      className: 'bg-secondary text-secondary-foreground',
    },
    high: {
      label: 'High',
      className: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
    },
    urgent: {
      label: 'Urgent',
      className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
    },
  }

  const cfg = config[priority] ?? {
    label: priority,
    className: 'bg-muted text-muted-foreground',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        cfg.className
      )}
    >
      {cfg.label}
    </span>
  )
}

function formatTicketDate(dateStr: string): string {
  try {
    const date = new Date(dateStr)
    const diffDays = Math.floor(
      (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)
    )
    if (diffDays < 7) {
      return formatDistanceToNow(date, { addSuffix: true })
    }
    return format(date, 'MMM d')
  } catch {
    return dateStr
  }
}

export function TicketList({
  tickets,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  projectDomain: _projectDomain,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  subscriptionTier: _subscriptionTier,
  monthlyCount,
  monthlyLimit,
  onTicketSelect,
  onNewTicket,
  selectedTicketId,
}: TicketListProps) {
  const [statusFilter, setStatusFilter] = useState<string>('all')

  const filtered =
    statusFilter === 'all'
      ? tickets
      : tickets.filter((t) => t.status === statusFilter)

  const quotaPercent = monthlyLimit > 0 ? (monthlyCount / monthlyLimit) * 100 : 0
  const isAtLimit = monthlyCount >= monthlyLimit
  const isNearLimit = quotaPercent >= 80 && !isAtLimit

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">Revision Tickets</h2>
          <p
            className={cn(
              'text-sm mt-0.5',
              isAtLimit
                ? 'text-red-600 dark:text-red-400 flex items-center gap-1'
                : isNearLimit
                ? 'text-amber-600 dark:text-amber-400 flex items-center gap-1'
                : 'text-muted-foreground'
            )}
          >
            {isAtLimit && <Warning size={14} weight="bold" className="shrink-0" />}
            {isNearLimit && <Warning size={14} className="shrink-0" />}
            {monthlyCount} of {monthlyLimit} revisions used this month
          </p>
        </div>
        <Button size="sm" onClick={onNewTicket}>
          <Plus size={16} weight="bold" className="mr-1" />
          New Ticket
        </Button>
      </div>

      {/* Status filter */}
      <div className="flex items-center gap-2">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tickets</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {filtered.length} {filtered.length === 1 ? 'ticket' : 'tickets'}
        </span>
      </div>

      {/* Ticket table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground text-sm">
            {statusFilter === 'all'
              ? 'No tickets yet. Create one to get started.'
              : `No ${statusFilter.replace('_', ' ')} tickets.`}
          </p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">
                  Title
                </th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground hidden sm:table-cell">
                  Status
                </th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground hidden md:table-cell">
                  Priority
                </th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground hidden lg:table-cell">
                  Source
                </th>
                <th className="text-left px-4 py-2 font-medium text-muted-foreground">
                  Created
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((ticket, idx) => (
                <tr
                  key={ticket.id}
                  onClick={() => onTicketSelect(ticket)}
                  className={cn(
                    'border-b last:border-0 cursor-pointer transition-colors',
                    selectedTicketId === ticket.id
                      ? 'bg-muted'
                      : idx % 2 === 0
                      ? 'hover:bg-muted/50'
                      : 'bg-muted/20 hover:bg-muted/50'
                  )}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate max-w-[200px] sm:max-w-[300px]">
                        {ticket.title}
                      </span>
                      {ticket.is_overage && (
                        <span className="inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-100 shrink-0">
                          $50
                        </span>
                      )}
                    </div>
                    {/* Show status on mobile */}
                    <div className="sm:hidden mt-1">
                      <StatusBadge status={ticket.status} />
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <PriorityBadge priority={ticket.priority} />
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-muted-foreground text-xs">
                      {ticket.source === 'client_portal' ? 'Client' : 'Agency'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                    {formatTicketDate(ticket.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
