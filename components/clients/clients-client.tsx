'use client'

import { useState, useEffect, useMemo } from 'react'
import { Plus } from '@phosphor-icons/react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import { ClientTable } from './client-table'
import { ClientDetailDrawer } from './client-detail-drawer'
import { AddClientSheet } from './add-client-sheet'
import type { WebDesignClient } from '@/lib/data/clients'

interface ClientsClientProps {
  clients: WebDesignClient[]
}

type StatusFilter = 'all' | 'active' | 'paused' | 'churned'
type TierFilter = 'all' | 'basic' | 'advanced'

export function ClientsClient({ clients }: ClientsClientProps) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [tierFilter, setTierFilter] = useState<TierFilter>('all')
  const [selectedClient, setSelectedClient] = useState<WebDesignClient | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [addSheetOpen, setAddSheetOpen] = useState(false)
  const [localClients, setLocalClients] = useState<WebDesignClient[]>(clients)

  // Sync localClients when prop changes (e.g. after revalidatePath fires)
  useEffect(() => {
    setLocalClients(clients)
  }, [clients])

  const filteredClients = useMemo(() => {
    return localClients.filter((client) => {
      const statusMatch =
        statusFilter === 'all' || client.status === statusFilter
      const tierMatch =
        tierFilter === 'all' || client.web_design_tier === tierFilter
      return statusMatch && tierMatch
    })
  }, [localClients, statusFilter, tierFilter])

  const handleClientUpdated = (updated: WebDesignClient) => {
    setLocalClients((prev) =>
      prev.map((c) => (c.id === updated.id ? updated : c))
    )
    setSelectedClient(updated)
  }

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
          <p className="text-muted-foreground mt-1">Web design client roster</p>
        </div>
        <Button onClick={() => setAddSheetOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Client
        </Button>
      </div>

      {/* Filters row */}
      <div className="flex gap-2 flex-wrap">
        <Select
          value={statusFilter}
          onValueChange={(v) => setStatusFilter(v as StatusFilter)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="churned">Churned</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={tierFilter}
          onValueChange={(v) => setTierFilter(v as TierFilter)}
        >
          <SelectTrigger className="w-[140px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Tiers</SelectItem>
            <SelectItem value="basic">Basic</SelectItem>
            <SelectItem value="advanced">Advanced</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <ClientTable
        clients={filteredClients}
        onRowClick={(c) => {
          setSelectedClient(c)
          setDrawerOpen(true)
        }}
      />

      {/* Detail drawer */}
      <ClientDetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        client={selectedClient}
        onClientUpdated={handleClientUpdated}
      />

      {/* Add client sheet */}
      <AddClientSheet
        open={addSheetOpen}
        onOpenChange={setAddSheetOpen}
      />
    </div>
  )
}
