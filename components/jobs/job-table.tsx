'use client'

import { useState, useMemo, useTransition, useCallback, useEffect } from 'react'
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
import { JobDetailDrawer } from './job-detail-drawer'
import { QuickSendModal } from '@/components/send/quick-send-modal'
import { TableSkeleton } from '@/components/ui/table-skeleton'
import { getSendOneOffData, type SendOneOffData } from '@/lib/actions/send-one-off-data'
import { deleteJob, markJobComplete } from '@/lib/actions/job'
import { toast } from 'sonner'

interface JobTableProps {
  jobs: JobWithEnrollment[]
  customers: Customer[]
  /** Map of service type to matching campaign info for enrollment preview */
  campaignMap?: Map<string, { campaignName: string; firstTouchDelay: number }>
  /** Map of campaign UUID to name/delay for campaign_override display */
  campaignNames?: Map<string, { campaignName: string; firstTouchDelay: number }>
  /** Show skeleton loading state */
  loading?: boolean
}

export function JobTable({ jobs, customers, campaignMap, campaignNames, loading }: JobTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [selectedJob, setSelectedJob] = useState<JobWithEnrollment | null>(null)
  const [showEditSheet, setShowEditSheet] = useState(false)

  // Detail drawer state
  const [detailJob, setDetailJob] = useState<JobWithEnrollment | null>(null)
  const [showDetailDrawer, setShowDetailDrawer] = useState(false)

  // Send one-off modal state
  const [sendOneOffOpen, setSendOneOffOpen] = useState(false)
  const [sendOneOffData, setSendOneOffData] = useState<SendOneOffData | null>(null)
  const [sendOneOffCustomerId, setSendOneOffCustomerId] = useState<string | null>(null)
  const [, startSendTransition] = useTransition()

  const handleSendOneOff = useCallback((customerId: string) => {
    setSendOneOffCustomerId(customerId)
    setSendOneOffOpen(true)
    startSendTransition(async () => {
      const data = await getSendOneOffData()
      setSendOneOffData(data)
    })
  }, [])

  const handleRowClick = useCallback((job: JobWithEnrollment) => {
    setDetailJob(job)
    setShowDetailDrawer(true)
  }, [])

  const handleDelete = useCallback(async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return
    const result = await deleteJob(jobId)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Job deleted')
      setShowDetailDrawer(false)
    }
  }, [])

  const handleMarkComplete = useCallback(async (jobId: string) => {
    const result = await markJobComplete(jobId, true)
    if (result.success) {
      toast.success('Job marked complete! Campaign enrollment started.')
    } else {
      toast.error(result.error || 'Failed to complete job')
    }
  }, [])

  // Find the prefilled customer from lazy-loaded data
  const prefilledCustomer = useMemo(() => {
    if (!sendOneOffCustomerId || !sendOneOffData) return null
    return sendOneOffData.customers.find(c => c.id === sendOneOffCustomerId) ?? null
  }, [sendOneOffCustomerId, sendOneOffData])

  // Enhance jobs with matching campaign info for scheduled jobs
  const enhancedJobs = useMemo(() => {
    return jobs.map(job => ({
      ...job,
      matchingCampaign: campaignMap?.get(job.service_type) || null,
      overrideCampaign: (job.campaign_override && job.campaign_override !== 'one_off' && campaignNames)
        ? campaignNames.get(job.campaign_override) || null
        : null,
    }))
  }, [jobs, campaignMap, campaignNames])

  // Refresh stale selectedJob / detailJob when jobs prop changes (after revalidation)
  // Compare by updated_at to avoid unnecessary state updates that reset EditJobSheet form
  useEffect(() => {
    if (selectedJob) {
      const fresh = enhancedJobs.find(j => j.id === selectedJob.id)
      if (fresh && fresh.updated_at !== selectedJob.updated_at) setSelectedJob(fresh)
      else if (!fresh && showEditSheet) { setShowEditSheet(false); setSelectedJob(null) }
    }
    if (detailJob) {
      const fresh = enhancedJobs.find(j => j.id === detailJob.id)
      if (fresh && fresh.updated_at !== detailJob.updated_at) setDetailJob(fresh)
      else if (!fresh && showDetailDrawer) { setShowDetailDrawer(false); setDetailJob(null) }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enhancedJobs])

  const table = useReactTable({
    data: enhancedJobs,
    columns: columns({
      onEdit: (job) => { setSelectedJob(job); setShowEditSheet(true) },
      onDelete: handleDelete,
      onMarkComplete: handleMarkComplete,
      onSendOneOff: handleSendOneOff,
    }),
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
                onClick={() => handleRowClick(row.original)}
                className="border-t border-border transition-colors hover:bg-muted/50 cursor-pointer"
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

      {/* Job Detail Drawer */}
      <JobDetailDrawer
        open={showDetailDrawer}
        onOpenChange={setShowDetailDrawer}
        job={detailJob}
        onEdit={(job) => { setShowDetailDrawer(false); setSelectedJob(job); setShowEditSheet(true) }}
        onDelete={handleDelete}
        onSendOneOff={handleSendOneOff}
      />

      {/* Edit Job Sheet */}
      {selectedJob && (
        <EditJobSheet
          open={showEditSheet}
          onOpenChange={setShowEditSheet}
          job={selectedJob}
          customers={customers}
        />
      )}

      {/* Send One-Off Modal */}
      {sendOneOffData && (
        <QuickSendModal
          open={sendOneOffOpen}
          onOpenChange={(open) => {
            setSendOneOffOpen(open)
            if (!open) {
              setSendOneOffData(null)
              setSendOneOffCustomerId(null)
            }
          }}
          customers={sendOneOffData.customers}
          business={sendOneOffData.business}
          templates={sendOneOffData.templates}
          monthlyUsage={sendOneOffData.monthlyUsage}
          hasReviewLink={sendOneOffData.hasReviewLink}
          prefilledCustomer={prefilledCustomer}
        />
      )}
    </>
  )
}
