'use client'

import { useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  SortingState,
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
import { createColumns } from './history-columns'
import type { SendLogWithContact } from '@/lib/types/database'
import { TableSkeleton } from '@/components/ui/table-skeleton'

interface HistoryTableProps {
  data: SendLogWithContact[]
  /** Show skeleton loading state */
  loading?: boolean
  onRowClick?: (request: SendLogWithContact) => void
  onResend?: (request: SendLogWithContact) => void
  onCancel?: (request: SendLogWithContact) => void
}

export function HistoryTable({ data, loading, onRowClick, onResend, onCancel }: HistoryTableProps) {
  const columns = useMemo(() => createColumns({ onResend, onCancel }), [onResend, onCancel])
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: {
      sorting,
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
                className="group cursor-pointer hover:bg-muted/50"
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
