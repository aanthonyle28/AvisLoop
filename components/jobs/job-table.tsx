'use client'

import { useState, useMemo, useTransition, useCallback, useEffect } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type SortingState,
} from '@tanstack/react-table'
import { Warning } from '@phosphor-icons/react'
import { columns } from './job-columns'
import type { JobWithEnrollment, Customer } from '@/lib/types/database'
import { EditJobSheet } from './edit-job-sheet'
import { JobDetailDrawer } from './job-detail-drawer'
import { QuickSendModal } from '@/components/send/quick-send-modal'
import { TableSkeleton } from '@/components/ui/table-skeleton'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from '@/components/ui/alert-dialog'
import { getSendOneOffData, type SendOneOffData } from '@/lib/actions/send-one-off-data'
import { deleteJob, markJobComplete } from '@/lib/actions/job'
import { resolveEnrollmentConflict, revertConflictResolution } from '@/lib/actions/conflict-resolution'
import { toast } from 'sonner'
import type { ConflictDetail } from '@/lib/types/database'

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

  // Delete confirmation state
  const [jobToDelete, setJobToDelete] = useState<string | null>(null)

  // Send one-off modal state
  const [sendOneOffOpen, setSendOneOffOpen] = useState(false)
  const [sendOneOffData, setSendOneOffData] = useState<SendOneOffData | null>(null)
  const [sendOneOffCustomerId, setSendOneOffCustomerId] = useState<string | null>(null)
  const [, startSendTransition] = useTransition()

  // Replace confirmation state
  const [replaceConfirm, setReplaceConfirm] = useState<{ jobId: string; conflictDetail?: ConflictDetail } | null>(null)

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

  const handleDeleteRequest = useCallback((jobId: string) => {
    setJobToDelete(jobId)
  }, [])

  const handleDeleteConfirm = useCallback(async () => {
    if (!jobToDelete) return
    const result = await deleteJob(jobToDelete)
    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Job deleted')
      setShowDetailDrawer(false)
    }
    setJobToDelete(null)
  }, [jobToDelete])

  const handleMarkComplete = useCallback(async (jobId: string) => {
    const result = await markJobComplete(jobId, true)
    if (result.success) {
      toast.success('Job marked complete! Campaign enrollment started.')
    } else {
      toast.error(result.error || 'Failed to complete job')
    }
  }, [])

  const handleResolveConflict = useCallback(async (jobId: string, action: 'replace' | 'skip' | 'queue_after') => {
    // Replace requires confirmation
    if (action === 'replace') {
      const job = jobs.find(j => j.id === jobId)
      setReplaceConfirm({ jobId, conflictDetail: job?.conflictDetail })
      return
    }

    const result = await resolveEnrollmentConflict(jobId, action)
    if (result.success) {
      const label = action === 'skip' ? 'Enrollment skipped' : 'Queued after active sequence'
      toast.success(label, {
        action: {
          label: 'Undo',
          onClick: async () => {
            const revertResult = await revertConflictResolution(jobId)
            if (revertResult.success) {
              toast.success('Resolution reverted')
            } else {
              toast.error(revertResult.error || 'Failed to undo')
            }
          },
        },
      })
    } else {
      toast.error(result.error || 'Failed to resolve conflict')
    }
  }, [jobs])

  const handleReplaceConfirmed = useCallback(async () => {
    if (!replaceConfirm) return
    const jobId = replaceConfirm.jobId
    setReplaceConfirm(null)
    const result = await resolveEnrollmentConflict(jobId, 'replace')
    if (result.success) {
      toast.success('Replaced active sequence')
    } else {
      toast.error(result.error || 'Failed to replace sequence')
    }
  }, [replaceConfirm])

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
      onDelete: handleDeleteRequest,
      onMarkComplete: handleMarkComplete,
      onSendOneOff: handleSendOneOff,
      onResolveConflict: handleResolveConflict,
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
        <table className="w-full table-fixed">
          <thead className="bg-muted/50">
            {table.getHeaderGroups().map(headerGroup => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map(header => (
                  <th
                    key={header.id}
                    className="h-10 px-4 text-left align-middle font-medium text-muted-foreground"
                    style={{ width: (header.column.columnDef.meta as Record<string, string>)?.width }}
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
                  <td key={cell.id} className="p-4 overflow-hidden">
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
        onDelete={handleDeleteRequest}
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!jobToDelete} onOpenChange={(open) => { if (!open) setJobToDelete(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Warning size={20} className="text-destructive" weight="fill" />
              Delete this job?
            </AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The job record will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Job
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Replace Confirmation Dialog */}
      <AlertDialog open={!!replaceConfirm} onOpenChange={(open) => { if (!open) setReplaceConfirm(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Warning size={20} className="text-warning" weight="fill" />
              Replace active sequence?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                {replaceConfirm?.conflictDetail ? (
                  <p>
                    <strong>{replaceConfirm.conflictDetail.existingCampaignName}</strong> is at Touch {replaceConfirm.conflictDetail.currentTouch} of {replaceConfirm.conflictDetail.totalTouches} for this customer. Replacing will cancel the remaining touches and start a new sequence for this job.
                  </p>
                ) : (
                  <p>
                    This customer has an active campaign sequence. Replacing will cancel the remaining touches and start a new sequence for this job.
                  </p>
                )}
                <p className="text-xs">This cannot be undone.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReplaceConfirmed}>
              Replace
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
