'use client'

import { useState } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type SortingState,
} from '@tanstack/react-table'
import { columns } from './job-columns'
import type { JobWithCustomer, Customer } from '@/lib/types/database'
import { EditJobSheet } from './edit-job-sheet'

interface JobTableProps {
  jobs: JobWithCustomer[]
  customers: Customer[]
}

export function JobTable({ jobs, customers }: JobTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [selectedJob, setSelectedJob] = useState<JobWithCustomer | null>(null)
  const [showEditSheet, setShowEditSheet] = useState(false)

  const table = useReactTable({
    data: jobs,
    columns: columns({ onEdit: (job) => { setSelectedJob(job); setShowEditSheet(true) } }),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  })

  return (
    <>
      <div className="rounded-md border border-border">
        <table className="w-full">
          <thead className="bg-muted/50">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="h-10 px-4 text-left align-middle font-medium text-muted-foreground"
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
            {table.getRowModel().rows.map(row => (
              <tr
                key={row.id}
                className="border-t border-border transition-colors hover:bg-muted/50"
              >
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} className="p-4">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Job Sheet */}
      {selectedJob && (
        <EditJobSheet
          open={showEditSheet}
          onOpenChange={setShowEditSheet}
          job={selectedJob}
          customers={customers}
        />
      )}
    </>
  )
}
