'use client'

import { useEffect, useState, useTransition, useCallback } from 'react'
import { format } from 'date-fns'
import {
  User,
  EnvelopeSimple,
  Phone,
  Copy,
  CheckCircle,
  Clock,
  XCircle,
  PaperPlaneTilt,
  Megaphone,
  CircleNotch,
  Warning,
  CalendarBlank,
  ArrowsClockwise,
  SkipForward,
  Queue,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useDashboardPanel } from '@/components/dashboard/dashboard-shell'
import { fetchJobPanelDetail } from '@/lib/actions/dashboard'
import { markJobComplete } from '@/lib/actions/job'
import { resolveEnrollmentConflict } from '@/lib/actions/conflict-resolution'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import type { JobPanelDetail } from '@/lib/types/dashboard'

interface RightPanelJobDetailProps {
  jobId: string
  businessId: string
  /** Called when a one-off send is requested */
  onSendOneOff?: (customerId: string, jobId: string) => void
}

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard API not available
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="ml-1 inline-flex items-center justify-center h-5 w-5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
      aria-label={`Copy ${label}`}
    >
      {copied ? (
        <CheckCircle size={12} weight="fill" className="text-success" />
      ) : (
        <Copy size={12} />
      )}
    </button>
  )
}

function ServiceTypeBadge({ serviceType }: { serviceType: string }) {
  const label = serviceType.charAt(0).toUpperCase() + serviceType.slice(1)
  return (
    <span className="inline-flex items-center rounded-md border border-border bg-muted/50 px-2 py-0.5 text-xs font-medium">
      {label}
    </span>
  )
}

function CampaignSection({ job }: { job: JobPanelDetail }) {
  // Scheduled one-off jobs (will send one-off on complete)
  if (job.status === 'scheduled' && job.campaignOverride === 'one_off') {
    return (
      <div className="flex items-start gap-2 rounded-md bg-muted/30 p-3">
        <PaperPlaneTilt size={14} className="text-muted-foreground mt-0.5 shrink-0" />
        <div>
          <p className="text-xs font-medium">One-off (on complete)</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Will send a manual request when job is completed
          </p>
        </div>
      </div>
    )
  }

  // Completed one-off jobs
  if (job.campaignOverride === 'one_off') {
    return (
      <div className="flex items-start gap-2 rounded-md bg-muted/30 p-3">
        <PaperPlaneTilt size={14} className="text-muted-foreground mt-0.5 shrink-0" />
        <div>
          <p className="text-xs font-medium">One-off request</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manual send — not enrolled in a campaign
          </p>
        </div>
      </div>
    )
  }

  // Already enrolled
  if (job.enrollmentStatus === 'active' && job.enrollmentCampaignName) {
    return (
      <div className="flex items-start gap-2 rounded-md bg-success/10 border border-success/20 p-3">
        <CheckCircle size={14} weight="fill" className="text-success mt-0.5 shrink-0" />
        <div>
          <p className="text-xs font-medium">Enrolled in {job.enrollmentCampaignName}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Campaign sequence is running
          </p>
        </div>
      </div>
    )
  }

  // Has a matching campaign but not enrolled
  if (job.matchingCampaignName) {
    return (
      <div className="flex items-start gap-2 rounded-md bg-muted/30 p-3">
        <Megaphone size={14} className="text-primary mt-0.5 shrink-0" />
        <div>
          <p className="text-xs font-medium">Matching campaign: {job.matchingCampaignName}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Not yet enrolled — use the button below to enroll
          </p>
        </div>
      </div>
    )
  }

  // No matching campaign
  return (
    <div className="flex items-start gap-2 rounded-md bg-muted/30 p-3">
      <XCircle size={14} className="text-muted-foreground mt-0.5 shrink-0" />
      <div>
        <p className="text-xs font-medium text-muted-foreground">No matching campaign</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Create a campaign for {job.serviceType} to enroll this job
        </p>
      </div>
    </div>
  )
}

function ConflictActions({
  jobId,
  onClose,
}: {
  jobId: string
  onClose: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [activeAction, setActiveAction] = useState<string | null>(null)

  const handleResolve = (action: 'replace' | 'skip' | 'queue_after') => {
    setActiveAction(action)
    startTransition(async () => {
      try {
        const result = await resolveEnrollmentConflict(jobId, action)
        if (result.success) {
          const label =
            action === 'skip'
              ? 'Job skipped'
              : action === 'queue_after'
                ? 'Job queued for later enrollment'
                : 'Replaced active sequence with new enrollment'
          toast.success(label)
          onClose()
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

  return (
    <div className="space-y-2">
      <p className="text-xs text-warning-foreground font-medium">
        Enrollment conflict — customer is in an active campaign
      </p>
      <div className="flex flex-col gap-1.5">
        <Button
          size="sm"
          onClick={() => handleResolve('replace')}
          disabled={isPending}
          className="justify-start"
        >
          {isPending && activeAction === 'replace' ? (
            <CircleNotch size={14} className="mr-1.5 animate-spin" />
          ) : (
            <ArrowsClockwise size={14} className="mr-1.5" />
          )}
          Replace active sequence
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleResolve('queue_after')}
          disabled={isPending}
          className="justify-start"
        >
          {isPending && activeAction === 'queue_after' ? (
            <CircleNotch size={14} className="mr-1.5 animate-spin" />
          ) : (
            <Queue size={14} className="mr-1.5" />
          )}
          Queue until sequence ends
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => handleResolve('skip')}
          disabled={isPending}
          className="justify-start text-muted-foreground"
        >
          {isPending && activeAction === 'skip' ? (
            <CircleNotch size={14} className="mr-1.5 animate-spin" />
          ) : (
            <SkipForward size={14} className="mr-1.5" />
          )}
          Skip this job
        </Button>
      </div>
    </div>
  )
}

function RightPanelJobDetailSkeleton() {
  return (
    <div className="p-4 space-y-5">
      {/* Customer section */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-5 w-48" />
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-4 w-32" />
      </div>
      {/* Job info */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-24" />
        </div>
        <Skeleton className="h-4 w-52" />
      </div>
      {/* Campaign */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-14 w-full rounded-md" />
      </div>
      {/* Notes */}
      <div className="space-y-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
      {/* CTA */}
      <Skeleton className="h-9 w-full rounded-md" />
    </div>
  )
}

export function RightPanelJobDetail({
  jobId,
  businessId,
  onSendOneOff,
}: RightPanelJobDetailProps) {
  const { closePanel } = useDashboardPanel()
  const [job, setJob] = useState<JobPanelDetail | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCompleting, startCompleteTransition] = useTransition()

  const loadJob = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const data = await fetchJobPanelDetail(jobId, businessId)
      if (data) {
        setJob(data)
      } else {
        setError('Job not found')
      }
    } catch {
      setError('Failed to load job details')
    } finally {
      setIsLoading(false)
    }
  }, [jobId, businessId])

  useEffect(() => {
    loadJob()
  }, [loadJob])

  const handleComplete = () => {
    if (!job) return
    startCompleteTransition(async () => {
      try {
        const result = await markJobComplete(job.id, true)
        if (result.success) {
          toast.success('Job completed! Campaign enrollment started.')
          closePanel()
        } else {
          toast.error(result.error || 'Failed to complete job')
        }
      } catch {
        toast.error('Failed to complete job')
      }
    })
  }

  if (isLoading) {
    return <RightPanelJobDetailSkeleton />
  }

  if (error || !job) {
    return (
      <div className="p-4 flex flex-col items-center justify-center gap-3 py-12">
        <XCircle size={32} className="text-muted-foreground" />
        <p className="text-sm text-muted-foreground text-center">
          {error || 'Job not found'}
        </p>
      </div>
    )
  }

  // Determine which CTAs to show
  const isCompleted = job.status === 'completed'
  const isScheduled = job.status === 'scheduled'
  const isOneOff = job.campaignOverride === 'one_off'
  const isConflict = job.enrollmentResolution === 'conflict'
  const isQueueAfter = job.enrollmentResolution === 'queue_after'
  const isReplaceOnComplete = job.enrollmentResolution === 'replace_on_complete'

  const showSendOneOffCTA = isCompleted && isOneOff

  const hasPotentialConflict = isScheduled && !!job.potentialConflict && !job.enrollmentResolution
  const showCompleteCTA = isScheduled && !isConflict && !isQueueAfter && !isReplaceOnComplete && !hasPotentialConflict

  return (
    <div className="p-4 space-y-5">
      {/* Customer Section */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <User size={13} className="text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Customer
          </span>
        </div>
        <p className="text-base font-semibold leading-tight mb-2">{job.customer.name}</p>
        <div className="space-y-1">
          <div className="flex items-center gap-1.5">
            <EnvelopeSimple size={13} className="text-muted-foreground shrink-0" />
            <span className="text-sm text-foreground/80 truncate">{job.customer.email}</span>
            <CopyButton value={job.customer.email} label="email" />
          </div>
          {job.customer.phone && (
            <div className="flex items-center gap-1.5">
              <Phone size={13} className="text-muted-foreground shrink-0" />
              <span className="text-sm text-foreground/80">{job.customer.phone}</span>
              <CopyButton value={job.customer.phone} label="phone" />
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Job Info */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <CalendarBlank size={13} className="text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Job
          </span>
        </div>
        <div className="flex items-center gap-2 mb-2">
          <ServiceTypeBadge serviceType={job.serviceType} />
          <span className={cn(
            'inline-flex items-center gap-1.5 text-xs font-medium',
          )}>
            <span className={cn(
              'h-2 w-2 rounded-full shrink-0',
              job.status === 'completed' ? 'bg-success' :
              job.status === 'scheduled' ? 'bg-primary' :
              'bg-muted-foreground'
            )} />
            {job.status === 'completed' ? 'Completed' :
             job.status === 'scheduled' ? 'Scheduled' :
             'Do not send'}
          </span>
        </div>
        <div className="space-y-1 text-xs text-muted-foreground">
          {job.completedAt ? (
            <div className="flex items-center gap-1.5">
              <Clock size={12} className="shrink-0" />
              <span>
                Completed {format(new Date(job.completedAt), 'MMM d, yyyy')}
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              <Clock size={12} className="shrink-0" />
              <span>
                Created {format(new Date(job.createdAt), 'MMM d, yyyy')}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-border" />

      {/* Campaign Status */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Megaphone size={13} className="text-muted-foreground" />
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Campaign
          </span>
        </div>
        <CampaignSection job={job} />
      </div>

      {/* Notes */}
      {job.notes !== null && (
        <>
          <div className="border-t border-border" />
          <div>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide block mb-1.5">
              Notes
            </span>
            {job.notes ? (
              <p className="text-sm text-foreground/80 leading-relaxed">{job.notes}</p>
            ) : (
              <p className="text-sm text-muted-foreground italic">No notes</p>
            )}
          </div>
        </>
      )}

      {/* Conflict Actions */}
      {isConflict && (
        <>
          <div className="border-t border-border" />
          <div className="rounded-md bg-warning/10 border border-warning/20 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Warning size={14} weight="fill" className="text-warning shrink-0" />
              <span className="text-xs font-semibold text-warning-foreground">Conflict</span>
            </div>
            <ConflictActions jobId={job.id} onClose={closePanel} />
          </div>
        </>
      )}

      {/* Queue After info */}
      {isQueueAfter && (
        <>
          <div className="border-t border-border" />
          <div className="rounded-md bg-muted/40 border border-border p-3 flex items-center gap-2">
            <Clock size={14} className="text-primary shrink-0" />
            <p className="text-xs text-muted-foreground">
              Queued — will auto-enroll when active sequence completes
            </p>
          </div>
        </>
      )}

      {/* Pre-flight conflict for scheduled jobs */}
      {hasPotentialConflict && (
        <>
          <div className="border-t border-border" />
          <div className="rounded-md bg-warning/10 border border-warning/20 p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Warning size={14} weight="fill" className="text-warning shrink-0" />
              <span className="text-xs font-semibold text-warning-foreground">Pre-flight conflict</span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">
              {job.potentialConflict!.existingCampaignName} (Touch {job.potentialConflict!.currentTouch} of {job.potentialConflict!.totalTouches}) — resolve before completing
            </p>
            <ConflictActions jobId={job.id} onClose={closePanel} />
          </div>
        </>
      )}

      {/* Replace on Complete info */}
      {isReplaceOnComplete && (
        <>
          <div className="border-t border-border" />
          <div className="rounded-md bg-primary/10 border border-primary/20 p-3 flex items-center gap-2">
            <ArrowsClockwise size={14} className="text-primary shrink-0" />
            <p className="text-xs text-muted-foreground">
              Will replace active sequence when completed
            </p>
          </div>
        </>
      )}

      {/* CTA Buttons */}
      {(showSendOneOffCTA || showCompleteCTA) && (
        <>
          <div className="border-t border-border" />
          <div className="space-y-2">
            {showCompleteCTA && (
              <Button
                className="w-full"
                onClick={handleComplete}
                disabled={isCompleting}
              >
                {isCompleting ? (
                  <>
                    <CircleNotch size={14} className="mr-1.5 animate-spin" />
                    Completing...
                  </>
                ) : (
                  <>
                    <CheckCircle size={14} weight="bold" className="mr-1.5" />
                    Complete Job
                  </>
                )}
              </Button>
            )}

            {showSendOneOffCTA && (
              <Button
                className="w-full"
                variant="outline"
                onClick={() => onSendOneOff?.(job.customer.id, job.id)}
              >
                <PaperPlaneTilt size={14} className="mr-1.5" />
                Send One-Off
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
