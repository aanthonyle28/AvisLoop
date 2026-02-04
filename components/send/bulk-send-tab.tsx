'use client'

import { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  SortingState,
  RowSelectionState,
  flexRender,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { SendSettingsBar } from './send-settings-bar'
import { BulkSendActionBar } from './bulk-send-action-bar'
import { createBulkSendColumns } from './bulk-send-columns'
import type { Customer, MessageTemplate } from '@/lib/types/database'

type SchedulePreset = 'immediately' | '1hour' | 'morning' | 'custom'

type FilterType = 'never-sent' | 'added-today' | 'sent-30-days' | 'issues'

interface BulkSendTabProps {
  customers: Customer[]
  templates: MessageTemplate[]
  monthlyUsage: { count: number; limit: number; tier: string }
  hasReviewLink: boolean
  resendReadyContactIds: string[]
}

export function BulkSendTab({
  customers,
  templates,
  hasReviewLink,
  resendReadyContactIds,
}: BulkSendTabProps) {
  // Template + Schedule state
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    templates.find(t => t.is_default)?.id || templates[0]?.id || ''
  )
  const [schedulePreset, setSchedulePreset] = useState<SchedulePreset>('immediately')
  const [customDateTime, setCustomDateTime] = useState('')

  // Filter chips state
  const [activeFilters, setActiveFilters] = useState<Set<FilterType>>(new Set())

  // Table state
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'last_sent_at', desc: false }, // Oldest first (ready to re-send)
  ])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  // Calculate filter counts and filtered data
  const filterCounts = useMemo(() => {
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    return {
      'never-sent': customers.filter(c => !c.last_sent_at).length,
      'added-today': customers.filter(c => new Date(c.created_at) >= startOfToday).length,
      'sent-30-days': customers.filter(
        c => c.last_sent_at && new Date(c.last_sent_at) < thirtyDaysAgo
      ).length,
      'issues': customers.filter(c => c.opted_out || c.status === 'archived').length,
    }
  }, [customers])

  // Apply filters to contacts
  const filteredCustomers = useMemo(() => {
    if (activeFilters.size === 0) {
      return customers
    }

    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)

    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

    return customers.filter((customer: Customer) => {
      const checks: boolean[] = []

      if (activeFilters.has('never-sent')) {
        checks.push(!customer.last_sent_at)
      }
      if (activeFilters.has('added-today')) {
        checks.push(new Date(customer.created_at) >= startOfToday)
      }
      if (activeFilters.has('sent-30-days')) {
        checks.push(!!customer.last_sent_at && new Date(customer.last_sent_at) < thirtyDaysAgo)
      }
      if (activeFilters.has('issues')) {
        checks.push(customer.opted_out || customer.status === 'archived')
      }

      // OR logic: contact matches if ANY filter matches
      return checks.some(check => check)
    })
  }, [customers, activeFilters])

  // Toggle filter chip
  const toggleFilter = (filter: FilterType) => {
    setActiveFilters(prev => {
      const next = new Set(prev)
      if (next.has(filter)) {
        next.delete(filter)
      } else {
        next.add(filter)
      }
      return next
    })
  }

  // Create columns with resend ready IDs
  const resendReadySet = useMemo(
    () => new Set(resendReadyContactIds),
    [resendReadyContactIds]
  )

  const columns = useMemo(
    () => createBulkSendColumns({ resendReadyIds: resendReadySet }),
    [resendReadySet]
  )

  // Initialize table
  const table = useReactTable({
    data: filteredCustomers,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize: 50,
      },
    },
  })

  // Get selected contacts
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedContacts = selectedRows.map(row => row.original)
  const selectedCount = selectedContacts.length
  const filteredCount = filteredCustomers.length

  return (
    <div className="space-y-4">
      {/* Send Settings Bar */}
      <SendSettingsBar
        templates={templates}
        selectedTemplateId={selectedTemplateId}
        onTemplateChange={setSelectedTemplateId}
        schedulePreset={schedulePreset}
        onSchedulePresetChange={setSchedulePreset}
        customDateTime={customDateTime}
        onCustomDateTimeChange={setCustomDateTime}
      />

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => toggleFilter('never-sent')}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
            activeFilters.has('never-sent')
              ? 'bg-primary/10 border-primary text-primary'
              : 'bg-background border-border hover:bg-muted'
          }`}
        >
          Never sent ({filterCounts['never-sent']})
        </button>
        <button
          type="button"
          onClick={() => toggleFilter('added-today')}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
            activeFilters.has('added-today')
              ? 'bg-primary/10 border-primary text-primary'
              : 'bg-background border-border hover:bg-muted'
          }`}
        >
          Added today ({filterCounts['added-today']})
        </button>
        <button
          type="button"
          onClick={() => toggleFilter('sent-30-days')}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
            activeFilters.has('sent-30-days')
              ? 'bg-primary/10 border-primary text-primary'
              : 'bg-background border-border hover:bg-muted'
          }`}
        >
          Sent &gt; 30 days ({filterCounts['sent-30-days']})
        </button>
        <button
          type="button"
          onClick={() => toggleFilter('issues')}
          className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-colors ${
            activeFilters.has('issues')
              ? 'bg-primary/10 border-primary text-primary'
              : 'bg-background border-border hover:bg-muted'
          }`}
        >
          Issues ({filterCounts['issues']})
        </button>
      </div>

      {/* Contact table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => {
                const customer = row.original
                const isOptedOut = customer.opted_out

                return (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && 'selected'}
                    className={`transition-colors duration-150 hover:bg-muted/50 ${
                      isOptedOut ? 'opacity-50' : ''
                    }`}
                  >
                    {row.getVisibleCells().map(cell => (
                      <TableCell key={cell.id}>
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </TableRow>
                )
              })
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No contacts found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination controls */}
      {filteredCustomers.length > 50 && (
        <div className="flex items-center justify-end space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      )}

      {/* Sticky action bar */}
      {selectedCount > 0 && (
        <BulkSendActionBar
          selectedCount={selectedCount}
          filteredCount={filteredCount}
          selectedContacts={selectedContacts}
          allFilteredContacts={filteredCustomers}
          template={templates.find(t => t.id === selectedTemplateId)!}
          schedulePreset={schedulePreset}
          customDateTime={customDateTime}
          resendReadyIds={resendReadySet}
          hasReviewLink={hasReviewLink}
          onClearSelection={() => setRowSelection({})}
        />
      )}
    </div>
  )
}
