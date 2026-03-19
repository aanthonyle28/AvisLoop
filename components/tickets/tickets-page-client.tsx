'use client'

import { useState, useCallback } from 'react'
import { TicketList } from '@/components/tickets/ticket-list'
import { TicketDetailDrawer } from '@/components/tickets/ticket-detail-drawer'
import { NewTicketForm } from '@/components/tickets/new-ticket-form'
import type {
  ProjectTicket,
  TicketMessage,
  TicketStatus,
} from '@/lib/types/database'

interface TicketsPageClientProps {
  tickets: ProjectTicket[]
  projectId: string
  projectDomain: string | null
  subscriptionTier: string | null
  monthlyCount: number
  monthlyLimit: number
}

export function TicketsPageClient({
  tickets: initialTickets,
  projectId,
  projectDomain,
  subscriptionTier,
  monthlyCount: initialMonthlyCount,
  monthlyLimit,
}: TicketsPageClientProps) {
  const [tickets, setTickets] = useState<ProjectTicket[]>(initialTickets)
  const [monthlyCount, setMonthlyCount] = useState(initialMonthlyCount)

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<ProjectTicket | null>(null)
  const [drawerMessages, setDrawerMessages] = useState<TicketMessage[]>([])

  // New ticket form state
  const [newTicketOpen, setNewTicketOpen] = useState(false)

  const handleTicketSelect = useCallback((ticket: ProjectTicket) => {
    setSelectedTicket(ticket)
    setDrawerMessages([]) // will be fetched fresh on open
    setDrawerOpen(true)
  }, [])

  const handleStatusChange = useCallback(
    (ticketId: string, status: TicketStatus) => {
      setTickets((prev) =>
        prev.map((t) =>
          t.id === ticketId ? { ...t, status } : t
        )
      )
      setSelectedTicket((prev) =>
        prev?.id === ticketId ? { ...prev, status } : prev
      )
    },
    []
  )

  const handleMessageSent = useCallback(() => {
    // Messages are revalidated server-side; for now just trigger a visual hint
    // Full refresh happens when drawer reopens via revalidatePath
  }, [])

  const handleTicketCreated = useCallback(
    (ticketId: string, isOverage: boolean) => {
      // Optimistically bump monthly count if this was a non-overage ticket
      if (!isOverage) {
        setMonthlyCount((prev) => prev + 1)
      }
      // Trigger a page refresh to get the new ticket from the server
      // revalidatePath was called in the server action
      window.location.reload()
      void ticketId // used in future for selecting the new ticket
    },
    []
  )

  return (
    <>
      <TicketList
        tickets={tickets}
        projectDomain={projectDomain}
        subscriptionTier={subscriptionTier}
        monthlyCount={monthlyCount}
        monthlyLimit={monthlyLimit}
        onTicketSelect={handleTicketSelect}
        onNewTicket={() => setNewTicketOpen(true)}
        selectedTicketId={selectedTicket?.id}
      />

      <TicketDetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        ticket={selectedTicket}
        messages={drawerMessages}
        onStatusChange={handleStatusChange}
        onMessageSent={handleMessageSent}
      />

      <NewTicketForm
        open={newTicketOpen}
        onOpenChange={setNewTicketOpen}
        projectId={projectId}
        subscriptionTier={subscriptionTier}
        monthlyCount={monthlyCount}
        monthlyLimit={monthlyLimit}
        onTicketCreated={handleTicketCreated}
      />
    </>
  )
}
