'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { LinkSimple as LinkIcon } from '@phosphor-icons/react'
import { toast } from 'sonner'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { TicketWithContext, TicketMessage, TicketStatus } from '@/lib/types/database'
import { TicketDetailDrawer } from '@/components/tickets/ticket-detail-drawer'
import { fetchTicketMessages } from '@/lib/actions/ticket'

interface AllTicketsClientProps {
  tickets: TicketWithContext[]
  businesses: Array<{ id: string; name: string }>
  portalToken?: string | null
}

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, string> = {
    submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
    in_progress:
      'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100',
    completed:
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    open: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
    waiting_client:
      'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100',
    resolved:
      'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    closed: 'bg-muted text-muted-foreground',
  }
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colorMap[status] ?? 'bg-muted text-muted-foreground'}`}
    >
      {label}
    </span>
  )
}

function PriorityBadge({ priority }: { priority: string }) {
  const colorMap: Record<string, string> = {
    low: 'bg-muted text-muted-foreground',
    normal: 'bg-muted text-muted-foreground',
    high: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100',
    urgent: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100',
  }
  const label = priority.charAt(0).toUpperCase() + priority.slice(1)
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colorMap[priority] ?? 'bg-muted text-muted-foreground'}`}
    >
      {label}
    </span>
  )
}

export function AllTicketsClient({ tickets: initialTickets, businesses, portalToken }: AllTicketsClientProps) {
  const [tickets, setTickets] = useState(initialTickets)
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [businessFilter, setBusinessFilter] = useState<string>('all')

  // Sync tickets when server re-renders with new data (e.g., business switch)
  useEffect(() => {
    setTickets(initialTickets)
  }, [initialTickets])
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<TicketWithContext | null>(null)
  const [drawerMessages, setDrawerMessages] = useState<TicketMessage[]>([])

  const handleTicketClick = useCallback(async (ticket: TicketWithContext) => {
    setSelectedTicket(ticket)
    setDrawerMessages([])
    setDrawerOpen(true)
    // Fetch messages from server
    const messages = await fetchTicketMessages(ticket.id)
    setDrawerMessages(messages)
  }, [])

  const handleStatusChange = useCallback((ticketId: string, status: TicketStatus) => {
    setTickets((prev) => prev.map((t) => t.id === ticketId ? { ...t, status } : t))
    setSelectedTicket((prev) => prev?.id === ticketId ? { ...prev, status } : prev)
  }, [])

  const filtered = useMemo(() => {
    return tickets.filter((t) => {
      if (statusFilter !== 'all' && t.status !== statusFilter) return false
      if (businessFilter !== 'all' && t.business_id !== businessFilter)
        return false
      return true
    })
  }, [tickets, statusFilter, businessFilter])

  const totalCount = tickets.length
  const openCount = tickets.filter(
    (t) =>
      t.status === 'submitted' ||
      t.status === 'in_progress' ||
      t.status === 'open' ||
      t.status === 'waiting_client'
  ).length
  const completedCount = tickets.filter(
    (t) => t.status === 'completed' || t.status === 'resolved'
  ).length

  const hasActiveFilters = statusFilter !== 'all' || businessFilter !== 'all'

  return (
    <>
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Revision Tickets</h1>
          <p className="text-muted-foreground mt-1">Manage revision requests</p>
        </div>
        {portalToken && (
          <button
            type="button"
            onClick={() => {
              const url = `${window.location.origin}/portal/${portalToken}`
              navigator.clipboard.writeText(url)
              toast.success('Portal link copied')
            }}
            className="shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-md border border-border text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <LinkIcon size={14} />
            Copy Portal Link
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>

        <Select value={businessFilter} onValueChange={setBusinessFilter}>
          <SelectTrigger className="w-52">
            <SelectValue placeholder="All Clients" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Clients</SelectItem>
            {businesses.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <button
            onClick={() => {
              setStatusFilter('all')
              setBusinessFilter('all')
            }}
            className="text-sm text-muted-foreground hover:text-foreground underline-offset-4 hover:underline transition-colors"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Summary stats */}
      <div className="flex flex-wrap gap-3">
        <div className="inline-flex items-center rounded-md bg-muted px-3 py-1.5 text-sm text-muted-foreground">
          <span className="font-medium text-foreground mr-1">{totalCount}</span>
          total
        </div>
        <div className="inline-flex items-center rounded-md bg-muted px-3 py-1.5 text-sm text-muted-foreground">
          <span className="font-medium text-foreground mr-1">{openCount}</span>
          open
        </div>
        <div className="inline-flex items-center rounded-md bg-muted px-3 py-1.5 text-sm text-muted-foreground">
          <span className="font-medium text-foreground mr-1">{completedCount}</span>
          completed
        </div>
      </div>

      {/* Result count when filtered */}
      {hasActiveFilters && (
        <p className="text-sm text-muted-foreground">
          Showing {filtered.length} of {totalCount} tickets
        </p>
      )}

      {/* Ticket table */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-lg border border-dashed">
          <p className="text-lg font-semibold">
            {hasActiveFilters ? 'No tickets match your filters' : 'No tickets found'}
          </p>
          <p className="text-muted-foreground mt-1 text-sm">
            {hasActiveFilters
              ? 'Try adjusting the status or client filters.'
              : 'Tickets will appear here when clients submit revision requests.'}
          </p>
          {hasActiveFilters && (
            <button
              onClick={() => {
                setStatusFilter('all')
                setBusinessFilter('all')
              }}
              className="mt-4 text-sm text-primary hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Title
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Client
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Project
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Priority
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Source
                </th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((ticket) => (
                <tr
                  key={ticket.id}
                  onClick={() => handleTicketClick(ticket)}
                  className="hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="font-medium line-clamp-1 max-w-[200px] block" title={ticket.title}>
                      {ticket.title.length > 50
                        ? ticket.title.slice(0, 50) + '…'
                        : ticket.title}
                    </span>
                    {ticket.is_overage && (
                      <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100 px-1.5 py-0.5 text-xs font-medium">
                        $50
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {ticket.business_name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {ticket.project?.domain ?? 'No domain'}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={ticket.status} />
                  </td>
                  <td className="px-4 py-3">
                    <PriorityBadge priority={ticket.priority} />
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {ticket.source === 'client_portal' ? 'Client' : 'Agency'}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                    {formatDistanceToNow(new Date(ticket.created_at), {
                      addSuffix: true,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>

    <TicketDetailDrawer
      open={drawerOpen}
      onOpenChange={setDrawerOpen}
      ticket={selectedTicket}
      messages={drawerMessages}
      onStatusChange={handleStatusChange}
      onMessageSent={() => {}}
    />
    </>
  )
}
