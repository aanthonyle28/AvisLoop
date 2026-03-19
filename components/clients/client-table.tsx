'use client'

import { useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type SortingState,
} from '@tanstack/react-table'
import { TableSkeleton } from '@/components/ui/table-skeleton'
import { clientColumns } from './client-columns'
import type { WebDesignClient } from '@/lib/data/clients'

interface ClientTableProps {
  clients: WebDesignClient[]
  onRowClick: (client: WebDesignClient) => void
  loading?: boolean
}

export function ClientTable({ clients, onRowClick, loading }: ClientTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    data: clients,
    columns: clientColumns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  })

  if (loading) {
    return <TableSkeleton columns={7} rows={5} />
  }

  return (
    <div className="rounded-md border border-border">
      <table className="w-full table-fixed">
        <thead className="bg-muted/50">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="h-10 px-4 text-left align-middle font-medium text-muted-foreground text-sm"
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.length === 0 ? (
            <tr>
              <td
                colSpan={7}
                className="p-8 text-center text-muted-foreground text-sm"
              >
                No web design clients yet.
              </td>
            </tr>
          ) : (
            table.getRowModel().rows.map((row) => (
              <tr
                key={row.id}
                onClick={() => onRowClick(row.original)}
                className="border-t border-border bg-card transition-colors hover:bg-muted/50 cursor-pointer"
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="p-4 overflow-hidden">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
