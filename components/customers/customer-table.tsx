'use client'

import { useState, useMemo } from 'react'
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
import type { Customer } from '@/lib/types/database'
import { createColumns } from './customer-columns'
import { CustomerFilters } from './customer-filters'

interface CustomerTableProps {
  data: Customer[]
  onEdit: (customer: Customer) => void
  onArchive: (id: string) => void
  onRestore: (id: string) => void
  onDelete: (id: string) => void
  onBulkArchive: (ids: string[]) => void
  onBulkDelete: (ids: string[]) => void
  onRowClick?: (customer: Customer) => void
}

export function CustomerTable({
  data,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
  onBulkArchive,
  onBulkDelete,
  onRowClick,
}: CustomerTableProps) {
  // Table state
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'last_sent_at', desc: true }, // Default sort: most recent first
  ])
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'archived'>('all')

  // Filter data based on search query and status
  const filteredData = useMemo(() => {
    return data.filter((customer) => {
      // Status filter
      if (statusFilter !== 'all' && customer.status !== statusFilter) {
        return false
      }

      // Search filter (name or email)
      if (debouncedSearch) {
        const query = debouncedSearch.toLowerCase()
        return (
          customer.name.toLowerCase().includes(query) ||
          customer.email.toLowerCase().includes(query)
        )
      }

      return true
    })
  }, [data, statusFilter, debouncedSearch])

  // Memoize columns with handlers to prevent recreation
  const columns = useMemo(() => createColumns({
    onEdit,
    onArchive,
    onRestore,
    onDelete,
  }), [onEdit, onArchive, onRestore, onDelete])

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
    <div className='space-y-4'>
      {/* Filters */}
      <CustomerFilters
        searchQuery={searchQuery}
        onSearchChange={(query) => {
          setSearchQuery(query)
          // Debounce the actual filter update
          setTimeout(() => setDebouncedSearch(query), 300)
        }}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {/* Bulk action bar */}
      {hasSelection && (
        <div className='flex items-center gap-2 rounded-lg border bg-muted/50 p-3'>
          <span className='text-sm font-medium'>
            {selectedIds.length} {selectedIds.length === 1 ? 'customer' : 'contacts'} selected
          </span>
          <div className='ml-auto flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => {
                onBulkArchive(selectedIds)
                setRowSelection({})
              }}
            >
              <Archive className='mr-1 h-4 w-4' />
              Archive
            </Button>
            <Button
              variant='destructive'
              size='sm'
              onClick={() => {
                onBulkDelete(selectedIds)
                setRowSelection({})
              }}
            >
              <Trash2 className='mr-1 h-4 w-4' />
              Delete
            </Button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className='rounded-md border'>
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
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  onClick={() => onRowClick?.(row.original)}
                  className='cursor-pointer transition-colors duration-150 hover:bg-muted/50'
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className='h-24 text-center'>
                  No contacts found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination controls */}
      {filteredData.length > 10 && (
        <div className='flex items-center justify-end space-x-2'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant='outline'
            size='sm'
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
