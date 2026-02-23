'use client'

import { useState, useTransition, useMemo, useCallback } from 'react'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'
import {
  WarningCircle,
  Warning,
  DotsThree,
  CheckCircle,
  Plus,
  PaperPlaneTilt,
  Eye,
  X,
  CalendarBlank,
  CircleNotch,
  Clock,
  ArrowsClockwise,
  SkipForward,
  Queue,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from '@/components/ui/tooltip'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
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
import { JobDetailDrawer } from '@/components/jobs/job-detail-drawer'
import { QuickSendModal } from '@/components/send/quick-send-modal'
import { quickEnrollJob, getJobDetail, dismissJobFromQueue } from '@/lib/actions/dashboard'
import { markJobComplete, deleteJob } from '@/lib/actions/job'
import { resolveEnrollmentConflict, revertConflictResolution } from '@/lib/actions/conflict-resolution'
import { getSendOneOffData, type SendOneOffData } from '@/lib/actions/send-one-off-data'
import type { ReadyToSendJob } from '@/lib/types/dashboard'
import type { JobWithEnrollment } from '@/lib/types/database'

interface ReadyToSendQueueProps {
  jobs: ReadyToSendJob[]
  hasJobHistory: boolean
}

export function ReadyToSendQueue({ jobs, hasJobHistory }: ReadyToSendQueueProps) {
  const [isPending, startTransition] = useTransition()
  const [activeAction, setActiveAction] = useState<{ jobId: string; action: string } | null>(null)

  // Job detail drawer state
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [selectedJob, setSelectedJob] = useState<JobWithEnrollment | null>(null)

  // Send one-off modal state
  const [sendOneOffOpen, setSendOneOffOpen] = useState(false)
  const [sendOneOffData, setSendOneOffData] = useState<SendOneOffData | null>(null)
  const [sendOneOffCustomerId, setSendOneOffCustomerId] = useState<string | null>(null)
  const [, startSendTransition] = useTransition()

  // Replace confirmation state
  const [replaceConfirm, setReplaceConfirm] = useState<{ jobId: string; conflictDetail?: ReadyToSendJob['conflictDetail'] } | null>(null)

  const displayJobs = jobs.slice(0, 5)
  const hasMore = jobs.length > 5

  const isJobBusy = (jobId: string) => isPending && activeAction?.jobId === jobId

  // Find the prefilled customer from lazy-loaded data
  const prefilledCustomer = useMemo(() => {
    if (!sendOneOffCustomerId || !sendOneOffData) return null
    return sendOneOffData.customers.find(c => c.id === sendOneOffCustomerId) ?? null
  }, [sendOneOffCustomerId, sendOneOffData])

  // --- Send one-off: open modal with lazy-loaded data ---
  const handleSendOneOff = useCallback((customerId: string) => {
    setSendOneOffCustomerId(customerId)
    setSendOneOffOpen(true)
    startSendTransition(async () => {
      const data = await getSendOneOffData()
      setSendOneOffData(data)
    })
  }, [])

  // --- Primary action: Complete (for scheduled jobs) ---
  const handleComplete = (jobId: string) => {
    setActiveAction({ jobId, action: 'complete' })
    startTransition(async () => {
      try {
        const result = await markJobComplete(jobId, true)
        if (result.success) {
          toast.success('Job completed! Campaign enrollment started.')
        } else {
          toast.error(result.error || 'Failed to complete job')
        }
      } catch {
        toast.error('Failed to complete job')
      } finally {
        setActiveAction(null)
      }
    })
  }

  // --- Primary action: Enroll (for completed jobs with matching campaign) ---
  const handleEnroll = (jobId: string, serviceType: string) => {
    setActiveAction({ jobId, action: 'enroll' })
    startTransition(async () => {
      try {
        const result = await quickEnrollJob(jobId)
        if (result.success && result.enrolled) {
          toast.success(`Enrolled in ${result.campaignName}`)
        } else if (result.success && result.noMatchingCampaign) {
          const name = serviceType.charAt(0).toUpperCase() + serviceType.slice(1)
          toast.error(`No campaign for ${name}`, {
            description: 'Create a campaign for this service type',
            action: {
              label: 'Create Campaign',
              onClick: () => { window.location.href = `/campaigns/new?serviceType=${serviceType}` },
            },
          })
        } else if (result.error) {
          toast.error(result.error)
        }
      } catch {
        toast.error('Failed to enroll job')
      } finally {
        setActiveAction(null)
      }
    })
  }

  // --- 3-dot menu: View job (opens detail drawer) ---
  const handleViewJob = (jobId: string) => {
    setActiveAction({ jobId, action: 'view' })
    startTransition(async () => {
      try {
        const job = await getJobDetail(jobId)
        if (job) {
          setSelectedJob(job)
          setDrawerOpen(true)
        } else {
          toast.error('Could not load job details')
        }
      } catch {
        toast.error('Failed to load job details')
      } finally {
        setActiveAction(null)
      }
    })
  }

  // --- 3-dot menu: Remove from queue ---
  const handleDismiss = (jobId: string) => {
    setActiveAction({ jobId, action: 'dismiss' })
    startTransition(async () => {
      try {
        const result = await dismissJobFromQueue(jobId)
        if (result.success) {
          toast.success('Job removed from queue')
        } else {
          toast.error(result.error || 'Failed to remove job')
        }
      } catch {
        toast.error('Failed to remove job')
      } finally {
        setActiveAction(null)
      }
    })
  }

  // --- Drawer callback: Delete job ---
  const handleDeleteFromDrawer = (jobId: string) => {
    setDrawerOpen(false)
    startTransition(async () => {
      try {
        const result = await deleteJob(jobId)
        if (result.success) {
          toast.success('Job deleted')
          setSelectedJob(null)
        } else {
          toast.error(result.error || 'Failed to delete job')
        }
      } catch {
        toast.error('Failed to delete job')
      }
    })
  }

  // --- Drawer callback: Edit job (navigate to jobs page) ---
  const handleEditFromDrawer = () => {
    setDrawerOpen(false)
    window.location.href = '/jobs'
  }

  // --- Handle conflict resolution ---
  const handleResolveConflict = (jobId: string, action: 'replace' | 'skip' | 'queue_after') => {
    // Replace requires confirmation
    if (action === 'replace') {
      const job = jobs.find(j => j.id === jobId)
      setReplaceConfirm({ jobId, conflictDetail: job?.conflictDetail })
      return
    }

    setActiveAction({ jobId, action: `conflict-${action}` })
    startTransition(async () => {
      try {
        const result = await resolveEnrollmentConflict(jobId, action)
        if (result.success) {
          const label = action === 'skip' ? 'Job skipped — removed from queue' : 'Job queued — ready to enroll when active sequence ends'
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
      } catch {
        toast.error('Failed to resolve conflict')
      } finally {
        setActiveAction(null)
      }
    })
  }

  const handleReplaceConfirmed = () => {
    if (!replaceConfirm) return
    const jobId = replaceConfirm.jobId
    setReplaceConfirm(null)
    setActiveAction({ jobId, action: 'conflict-replace' })
    startTransition(async () => {
      try {
        const result = await resolveEnrollmentConflict(jobId, 'replace')
        if (result.success) {
          toast.success('Replaced active sequence with new enrollment')
        } else {
          toast.error(result.error || 'Failed to resolve conflict')
        }
      } catch {
        toast.error('Failed to resolve conflict')
      } finally {
        setActiveAction(null)
      }
    })
  }

  // --- Determine primary button for each job ---
  const renderPrimaryAction = (job: ReadyToSendJob) => {
    const busy = isJobBusy(job.id)

    // Conflict jobs: Replace, Skip, Queue After as inline buttons
    if (job.enrollment_resolution === 'conflict') {
      return (
        <div className="flex items-center gap-1.5">
          <Button
            size="sm"
            variant="default"
            onClick={() => handleResolveConflict(job.id, 'replace')}
            disabled={busy}
          >
            {busy && activeAction?.action === 'conflict-replace' ? (
              <CircleNotch className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <ArrowsClockwise className="h-4 w-4 mr-1" />
            )}
            Replace
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleResolveConflict(job.id, 'skip')}
            disabled={busy}
          >
            {busy && activeAction?.action === 'conflict-skip' ? (
              <CircleNotch className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <SkipForward className="h-4 w-4 mr-1" />
            )}
            Skip
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleResolveConflict(job.id, 'queue_after')}
            disabled={busy}
          >
            {busy && activeAction?.action === 'conflict-queue_after' ? (
              <CircleNotch className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Queue className="h-4 w-4 mr-1" />
            )}
            Queue
          </Button>
        </div>
      )
    }

    // Queue_after jobs: show "Queued" badge with cancel option
    if (job.enrollment_resolution === 'queue_after') {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" disabled={busy}>
              <Clock className="h-4 w-4 mr-1" />
              Queued
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleResolveConflict(job.id, 'skip')}>
              <X className="h-4 w-4 mr-2" />
              Cancel queue
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleResolveConflict(job.id, 'replace')}>
              <ArrowsClockwise className="h-4 w-4 mr-2" />
              Enroll now (replace)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    }

    if (job.status === 'scheduled') {
      return (
        <Button
          size="sm"
          onClick={() => handleComplete(job.id)}
          disabled={busy}
        >
          {busy && activeAction?.action === 'complete' ? (
            <CircleNotch className="h-4 w-4 mr-1 animate-spin" />
          ) : (
            <CheckCircle className="h-4 w-4 mr-1" weight="bold" />
          )}
          {busy && activeAction?.action === 'complete' ? 'Completing...' : 'Complete'}
        </Button>
      )
    }

    // One-off jobs always get "Send One-Off" regardless of campaign availability
    if (job.status === 'completed' && job.campaign_override !== 'one_off' && job.hasMatchingCampaign) {
      return (
        <Button
          size="sm"
          onClick={() => handleEnroll(job.id, job.service_type)}
          disabled={busy}
        >
          {busy && activeAction?.action === 'enroll' ? 'Enrolling...' : 'Enroll'}
        </Button>
      )
    }

    // Completed + one-off or no matching campaign → Send One-Off
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() => handleSendOneOff(job.customer.id)}
      >
        <PaperPlaneTilt className="h-4 w-4 mr-1" />
        Send One-Off
      </Button>
    )
  }

  // --- Status label for subtitle ---
  const renderSubtitle = (job: ReadyToSendJob) => {
    const serviceTypeName = job.service_type.charAt(0).toUpperCase() + job.service_type.slice(1)
    const timeAgo = formatDistanceToNow(new Date(job.completed_at), { addSuffix: true })

    if (job.enrollment_resolution === 'conflict' && job.conflictDetail) {
      return (
        <span className="text-warning-foreground">
          {serviceTypeName} • Active: {job.conflictDetail.existingCampaignName} (Touch {job.conflictDetail.currentTouch} of {job.conflictDetail.totalTouches})
        </span>
      )
    }

    if (job.enrollment_resolution === 'queue_after' && job.conflictDetail) {
      return (
        <span className="text-muted-foreground">
          {serviceTypeName} • Queued — waiting for {job.conflictDetail.existingCampaignName}
        </span>
      )
    }

    if (job.status === 'scheduled') {
      return `${serviceTypeName} • Scheduled ${timeAgo}`
    }
    return `${serviceTypeName} • Completed ${timeAgo}`
  }

  return (
    <TooltipProvider delayDuration={200}>
      <Card id="ready-to-send-queue">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
          <CardTitle className="text-lg font-semibold">Ready to Send</CardTitle>
          {jobs.length > 0 && (
            <Badge variant="secondary">{jobs.length}</Badge>
          )}
        </CardHeader>
        <CardContent>
          {/* Empty states */}
          {jobs.length === 0 && hasJobHistory && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle className="h-12 w-12 text-success mb-3" weight="fill" />
              <p className="text-sm text-muted-foreground">
                All caught up — no jobs waiting for enrollment
              </p>
            </div>
          )}

          {jobs.length === 0 && !hasJobHistory && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Plus className="h-12 w-12 text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground mb-3">
                No jobs yet — add a completed job to get started
              </p>
              <Button asChild size="sm">
                <Link href="/jobs">
                  <Plus className="h-4 w-4 mr-1" />
                  Add Job
                </Link>
              </Button>
            </div>
          )}

          {/* Job list */}
          {displayJobs.length > 0 && (
            <div className="space-y-0">
              {displayJobs.map((job, index) => {
                const busy = isJobBusy(job.id)

                return (
                  <div
                    key={job.id}
                    className={`flex items-center justify-between py-3 ${
                      index < displayJobs.length - 1 ? 'border-b' : ''
                    }`}
                  >
                    {/* Left side: status/urgency flag + customer info */}
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      {job.enrollment_resolution === 'conflict' && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex-shrink-0 mt-0.5 cursor-help">
                              <WarningCircle className="h-5 w-5 text-warning" weight="fill" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent
                            side="right"
                            className="max-w-[240px] bg-card text-card-foreground border shadow-md px-3 py-2.5 text-xs leading-relaxed"
                          >
                            <p className="font-semibold text-warning-foreground mb-1">Enrollment conflict</p>
                            <p className="text-muted-foreground">
                              This customer is currently enrolled in another campaign.
                              Choose to <strong>replace</strong> the active sequence, <strong>skip</strong> this job, or <strong>queue</strong> it until the current sequence finishes.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {job.enrollment_resolution === 'queue_after' && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex-shrink-0 mt-0.5 cursor-help">
                              <Clock className="h-5 w-5 text-primary" weight="fill" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent
                            side="right"
                            className="max-w-[220px] bg-card text-card-foreground border shadow-md px-3 py-2.5 text-xs leading-relaxed"
                          >
                            <p className="font-semibold mb-1">Queued</p>
                            <p className="text-muted-foreground">
                              Waiting for the active campaign sequence to finish. You can enroll this job once the sequence completes.
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {!job.enrollment_resolution && job.isStale && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="flex-shrink-0 mt-0.5 cursor-help">
                              <WarningCircle className="h-5 w-5 text-warning" weight="fill" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent
                            side="right"
                            className="max-w-[200px] bg-card text-card-foreground border shadow-md px-3 py-2.5 text-xs leading-relaxed"
                          >
                            <p className="text-muted-foreground">
                              {job.service_type.charAt(0).toUpperCase() + job.service_type.slice(1)} jobs typically send within {job.threshold}h
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      )}
                      {!job.enrollment_resolution && job.status === 'scheduled' && !job.isStale && (
                        <div className="flex-shrink-0 mt-0.5">
                          <CalendarBlank className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {job.customer.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {renderSubtitle(job)}
                        </p>
                      </div>
                    </div>

                    {/* Right side: context-aware actions */}
                    <div className="flex items-center gap-2 ml-4">
                      {renderPrimaryAction(job)}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon-sm" variant="ghost" disabled={busy}>
                            {busy && activeAction?.action === 'view' ? (
                              <CircleNotch className="h-4 w-4 animate-spin" />
                            ) : (
                              <DotsThree className="h-4 w-4" weight="bold" />
                            )}
                            <span className="sr-only">More options</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewJob(job.id)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View job
                          </DropdownMenuItem>
                          {job.status === 'completed' && (
                            <DropdownMenuItem
                              onClick={() => handleSendOneOff(job.customer.id)}
                            >
                              <PaperPlaneTilt className="h-4 w-4 mr-2" />
                              Send one-off
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleDismiss(job.id)}
                            className="text-muted-foreground"
                          >
                            <X className="h-4 w-4 mr-2" />
                            Remove from queue
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Show all link */}
          {hasMore && (
            <div className="mt-4 pt-3 border-t">
              <Link
                href="/jobs?status=completed&enrolled=false"
                className="text-sm text-accent hover:underline"
              >
                Show all ({jobs.length})
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Job detail drawer */}
      <JobDetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        job={selectedJob}
        onEdit={handleEditFromDrawer}
        onDelete={handleDeleteFromDrawer}
        onSendOneOff={handleSendOneOff}
      />

      {/* Send One-Off Modal (lazy-loaded) */}
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
    </TooltipProvider>
  )
}

export function ReadyToSendQueueSkeleton() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="h-5 w-32 bg-muted animate-pulse rounded" />
        <div className="h-5 w-8 bg-muted animate-pulse rounded-full" />
      </CardHeader>
      <CardContent>
        <div className="space-y-0">
          {[1, 2, 3].map((i, index) => (
            <div
              key={i}
              className={`flex items-center justify-between py-3 ${
                index < 2 ? 'border-b' : ''
              }`}
            >
              <div className="flex items-start gap-3 flex-1">
                <div className="h-5 w-5 bg-muted animate-pulse rounded-full mt-0.5" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-40 bg-muted animate-pulse rounded" />
                  <div className="h-3 w-56 bg-muted animate-pulse rounded" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-8 w-20 bg-muted animate-pulse rounded" />
                <div className="h-8 w-8 bg-muted animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
