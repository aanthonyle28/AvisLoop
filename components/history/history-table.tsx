'use client'

import { useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  SortingState,
  RowSelectionState,
} from '@tanstack/react-table'
import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { createColumns, RESENDABLE_STATUSES } from './history-columns'
import type { SendLogWithContact } from '@/lib/types/database'
import { TableSkeleton } from '@/components/ui/table-skeleton'

interface HistoryTableProps {
  data: SendLogWithContact[]
  /** Show skeleton loading state */
  loading?: boolean
  onRowClick?: (request: SendLogWithContact) => void
  onResend?: (request: SendLogWithContact) => void
  rowSelection?: RowSelectionState
  onRowSelectionChange?: (selection: RowSelectionState) => void
}

export function HistoryTable({ data, loading, onRowClick, onResend, rowSelection, onRowSelectionChange }: HistoryTableProps) {
  const enableSelection = !!onRowSelectionChange
  const columns = useMemo(() => createColumns({ onResend, enableSelection }), [onResend, enableSelection])
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    enableRowSelection: (row) => RESENDABLE_STATUSES.includes(row.original.status),
    onRowSelectionChange: onRowSelectionChange
      ? (updater) => {
          const newSelection = typeof updater === 'function' ? updater(rowSelection || {}) : updater
          onRowSelectionChange(newSelection)
        }
      : undefined,
    state: {
      sorting,
      ...(rowSelection !== undefined ? { rowSelection } : {}),
    },
  })

  // Show skeleton when loading
  if (loading) {
    return <TableSkeleton columns={5} rows={5} />
  }

  return (
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
              <TableRow
                key={row.id}
                className="group cursor-pointer bg-card hover:bg-muted/50"
                data-state={row.getIsSelected() && 'selected'}
                onClick={() => onRowClick?.(row.original)}
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
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No messages found.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  )
}
