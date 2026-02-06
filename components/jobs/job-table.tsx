'use client'

import { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type SortingState,
} from '@tanstack/react-table'
import { columns } from './job-columns'
import type { JobWithEnrollment, Customer } from '@/lib/types/database'
import { EditJobSheet } from './edit-job-sheet'
import { TableSkeleton } from '@/components/ui/table-skeleton'

interface JobTableProps {
  jobs: JobWithEnrollment[]
  customers: Customer[]
  /** Map of service type to matching campaign info for enrollment preview */
  campaignMap?: Map<string, { campaignName: string; firstTouchDelay: number }>
  /** Show skeleton loading state */
  loading?: boolean
}

export function JobTable({ jobs, customers, campaignMap, loading }: JobTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [selectedJob, setSelectedJob] = useState<JobWithEnrollment | null>(null)
  const [showEditSheet, setShowEditSheet] = useState(false)

  // Enhance jobs with matching campaign info for scheduled jobs
  const enhancedJobs = useMemo(() => {
    if (!campaignMap) return jobs
    return jobs.map(job => ({
      ...job,
      matchingCampaign: campaignMap.get(job.service_type) || null,
    }))
  }, [jobs, campaignMap])

  const table = useReactTable({
    data: enhancedJobs,
    columns: columns({ onEdit: (job) => { setSelectedJob(job); setShowEditSheet(true) } }),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
  })

  // Show skeleton when loading (6 columns: Customer, Service, Status, Campaign, Created, Actions)
  if (loading) {
    return <TableSkeleton columns={6} rows={5} />
  }

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
