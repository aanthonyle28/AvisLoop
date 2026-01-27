'use client'

import { useState, useEffect } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  SortingState,
  ColumnFiltersState,
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
import { Archive, Trash2 } from 'lucide-react'
import type { Contact } from '@/lib/types/database'
import { createColumns } from './contact-columns'
import { ContactFilters } from './contact-filters'

interface ContactTableProps {
  data: Contact[]
  onEdit: (contact: Contact) => void
  onArchive: (id: string) => void
  onRestore: (id: string) => void
  onDelete: (id: string) => void
  onBulkArchive: (ids: string[]) => void
  onBulkDelete: (ids: string[]) => void
}

export function ContactTable({
  data,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
  onBulkArchive,
  onBulkDelete,
}: ContactTableProps) {
  // Table state
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'last_sent_at', desc: true }, // Default sort: most recent first
  ])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('all')

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      // Apply search to name and email columns
      if (searchQuery) {
        setColumnFilters([
          {
            id: 'name',
            value: searchQuery,
          },
        ])
      } else {
        setColumnFilters([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery])

  // Apply status filter
  useEffect(() => {
    const statusColumn = table.getColumn('status')
    if (statusColumn) {
      if (statusFilter === 'all') {
        statusColumn.setFilterValue(undefined)
      } else {
        statusColumn.setFilterValue(statusFilter)
      }
    }
  }, [statusFilter])

  // Filter data based on search query
  const filteredData = data.filter((contact) => {
    // Status filter
    if (statusFilter !== 'all' && contact.status !== statusFilter) {
      return false
    }

    // Search filter (name or email)
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      return (
        contact.name.toLowerCase().includes(query) ||
        contact.email.toLowerCase().includes(query)
      )
    }

    return true
  })

  // Create columns with handlers
  const columns = createColumns({
    onEdit,
    onArchive,
    onRestore,
    onDelete,
  })

  // Initialize table
  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      rowSelection,
    },
  })

  // Get selected row IDs
  const selectedRows = table.getFilteredSelectedRowModel().rows
  const selectedIds = selectedRows.map((row) => row.original.id)
  const hasSelection = selectedIds.length > 0

  return (
    <div className="space-y-4">
      {/* Filters */}
      <ContactFilters
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {/* Bulk action bar */}
      {hasSelection && (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/50 p-3">
          <span className="text-sm font-medium">
            {selectedIds.length} {selectedIds.length === 1 ? 'contact' : 'contacts'} selected
          </span>
          <div className="ml-auto flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onBulkArchive(selectedIds)
                setRowSelection({})
              }}
            >
              <Archive className="mr-1 h-4 w-4" />
              Archive
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                onBulkDelete(selectedIds)
                setRowSelection({})
              }}
            >
              <Trash2 className="mr-1 h-4 w-4" />
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
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
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && 'selected'}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
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
      {filteredData.length > 10 && (
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
    </div>
  )
}
