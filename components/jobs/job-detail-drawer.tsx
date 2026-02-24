'use client'

import { useState, useTransition } from 'react'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { StatusDot } from '@/components/ui/status-dot'
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
import {
  CheckCircle,
  PencilSimple,
  Trash,
  Copy,
  Envelope,
  Phone,
  Clock,
  XCircle,
  Minus,
  PaperPlaneTilt,
  CircleNotch,
  Wrench,
  CalendarBlank,
  WarningCircle,
  Queue,
  ArrowsClockwise,
  SkipForward,
  ArrowCounterClockwise,
} from '@phosphor-icons/react'
import { format, formatDistanceToNow } from 'date-fns'
import { markJobComplete } from '@/lib/actions/job'
import { resolveEnrollmentConflict, revertConflictResolution } from '@/lib/actions/conflict-resolution'
import { toast } from 'sonner'
import { SERVICE_TYPE_LABELS } from '@/lib/validations/job'
import type { JobWithEnrollment } from '@/lib/types/database'

interface JobDetailDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  job: JobWithEnrollment | null
  onEdit: (job: JobWithEnrollment) => void
  onDelete: (jobId: string) => void
  onSendOneOff: (customerId: string) => void
}

export function JobDetailDrawer({
  open,
  onOpenChange,
  job,
  onEdit,
  onDelete,
  onSendOneOff,
}: JobDetailDrawerProps) {
  const [isCompleting, startCompleteTransition] = useTransition()
  const [isResolving, startResolveTransition] = useTransition()
  const [showReplaceConfirm, setShowReplaceConfirm] = useState(false)

  if (!job) return null

  const customer = job.customers
  const conflictDetail = job.conflictDetail

  const handleMarkComplete = () => {
    startCompleteTransition(async () => {
      const result = await markJobComplete(job.id, true)
      if (result.success) {
        toast.success('Job marked complete! Campaign enrollment started.')
        onOpenChange(false)
      } else {
        toast.error(result.error || 'Failed to complete job')
      }
    })
  }

  const handleDelete = () => {
    onDelete(job.id)
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied`)
  }

  const handleResolveConflict = (action: 'replace' | 'skip' | 'queue_after') => {
    // Replace requires confirmation since it's destructive
    if (action === 'replace') {
      setShowReplaceConfirm(true)
      return
    }

    const jobId = job.id
    startResolveTransition(async () => {
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
        onOpenChange(false)
      } else {
        toast.error(result.error || 'Failed to resolve conflict')
      }
    })
  }

  const handleReplaceConfirmed = () => {
    setShowReplaceConfirm(false)
    const jobId = job.id
    startResolveTransition(async () => {
      const result = await resolveEnrollmentConflict(jobId, 'replace')
      if (result.success) {
        toast.success('Replaced active sequence')
        onOpenChange(false)
      } else {
        toast.error(result.error || 'Failed to resolve conflict')
      }
    })
  }

  const handleRevertResolution = () => {
    const jobId = job.id
    startResolveTransition(async () => {
      const result = await revertConflictResolution(jobId)
      if (result.success) {
        toast.success('Resolution reverted — conflict restored')
      } else {
        toast.error(result.error || 'Failed to revert')
      }
    })
  }

  // Format phone for display
  const formatPhoneDisplay = (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 11 && cleaned.startsWith('1')) {
      return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`
    }
    return phone
  }

  // Campaign status rendering
  const renderCampaignStatus = () => {
    const activeEnrollment = job.campaign_enrollments?.find(e => e.status === 'active')
    const anyEnrollment = job.campaign_enrollments?.[0]

    if (job.status === 'do_not_send') {
      return (
        <span className="text-sm text-muted-foreground flex items-center gap-1.5">
          <XCircle size={16} weight="fill" className="text-muted-foreground/70" />
          Not enrolled
        </span>
      )
    }

    if (activeEnrollment) {
      return (
        <span className="text-sm text-foreground flex items-center gap-1.5">
          <CheckCircle size={16} weight="fill" className="text-success" />
          {activeEnrollment.campaigns?.name || 'Enrolled'}
        </span>
      )
    }

    if (anyEnrollment && anyEnrollment.status === 'completed') {
      return (
        <span className="text-sm text-muted-foreground flex items-center gap-1.5">
          <CheckCircle size={16} weight="fill" className="text-muted-foreground/70" />
          {anyEnrollment.campaigns?.name || 'Completed'}
        </span>
      )
    }

    // Completed job with one-off override
    if (job.status === 'completed' && job.campaign_override === 'one_off') {
      return (
        <div className="space-y-3">
          <span className="text-sm text-foreground flex items-center gap-1.5">
            <PaperPlaneTilt size={16} />
            One-off
          </span>
          {customer?.id && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onSendOneOff(customer.id)}
            >
              <PaperPlaneTilt size={14} className="mr-1.5" />
              Send Request
            </Button>
          )}
        </div>
      )
    }

    // Enrollment resolution states
    if (job.enrollment_resolution === 'conflict') {
      return (
        <div className="space-y-3">
          <span className="text-sm text-warning-foreground flex items-center gap-1.5">
            <WarningCircle size={16} weight="fill" className="text-warning" />
            Conflict — awaiting resolution
          </span>
          {conflictDetail && (
            <p className="text-xs text-muted-foreground">
              <strong>{conflictDetail.existingCampaignName}</strong> is at Touch {conflictDetail.currentTouch} of {conflictDetail.totalTouches} for this customer.
            </p>
          )}
          {!conflictDetail && (
            <p className="text-xs text-muted-foreground">
              This customer has an active campaign sequence. Choose how to handle this new job.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              onClick={() => handleResolveConflict('replace')}
              disabled={isResolving}
            >
              <ArrowsClockwise size={14} className="mr-1.5" />
              Replace
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleResolveConflict('skip')}
              disabled={isResolving}
            >
              <SkipForward size={14} className="mr-1.5" />
              Skip
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleResolveConflict('queue_after')}
              disabled={isResolving}
            >
              <Queue size={14} className="mr-1.5" />
              Queue
            </Button>
          </div>
        </div>
      )
    }

    if (job.enrollment_resolution === 'queue_after') {
      return (
        <div className="space-y-3">
          <span className="text-sm text-primary flex items-center gap-1.5">
            <Queue size={16} weight="fill" />
            Queued after active sequence
          </span>
          {conflictDetail && (
            <p className="text-xs text-muted-foreground">
              Waiting for <strong>{conflictDetail.existingCampaignName}</strong> (Touch {conflictDetail.currentTouch} of {conflictDetail.totalTouches}) to finish.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleResolveConflict('replace')}
              disabled={isResolving}
            >
              <ArrowsClockwise size={14} className="mr-1.5" />
              Enroll now
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleRevertResolution}
              disabled={isResolving}
            >
              <ArrowCounterClockwise size={14} className="mr-1.5" />
              Re-evaluate
            </Button>
          </div>
        </div>
      )
    }

    if (job.enrollment_resolution === 'suppressed') {
      return (
        <span className="text-sm text-muted-foreground flex items-center gap-1.5">
          <CheckCircle size={16} weight="fill" className="text-muted-foreground/70" />
          Review cooldown
        </span>
      )
    }

    if (job.enrollment_resolution === 'skipped') {
      return (
        <div className="space-y-3">
          <span className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Minus size={16} weight="bold" className="text-muted-foreground/70" />
            Skipped
          </span>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleRevertResolution}
            disabled={isResolving}
          >
            <ArrowCounterClockwise size={14} className="mr-1.5" />
            Re-evaluate
          </Button>
        </div>
      )
    }

    if (anyEnrollment && anyEnrollment.status === 'stopped') {
      return (
        <span className="text-sm text-muted-foreground flex items-center gap-1.5">
          <Minus size={16} weight="bold" className="text-muted-foreground/70" />
          Stopped
        </span>
      )
    }

    if (job.status === 'scheduled' && job.campaign_override === 'one_off') {
      return (
        <span className="text-sm text-muted-foreground flex items-center gap-1.5">
          <PaperPlaneTilt size={16} className="text-muted-foreground/70" />
          One-off (on complete)
        </span>
      )
    }

    if (job.status === 'scheduled' && job.overrideCampaign) {
      const hours = job.overrideCampaign.firstTouchDelay
      const timeStr = hours < 24 ? `${hours}h` : `${Math.round(hours / 24)}d`
      return (
        <span className="text-sm text-muted-foreground flex items-center gap-1.5">
          <Clock size={16} weight="fill" className="text-primary/70" />
          {job.overrideCampaign.campaignName} in {timeStr}
        </span>
      )
    }

    if (job.matchingCampaign && job.status === 'scheduled') {
      const hours = job.matchingCampaign.firstTouchDelay
      const timeStr = hours < 24 ? `${hours}h` : `${Math.round(hours / 24)}d`
      return (
        <span className="text-sm text-muted-foreground flex items-center gap-1.5">
          <Clock size={16} weight="fill" className="text-primary/70" />
          {job.matchingCampaign.campaignName} in {timeStr}
        </span>
      )
    }

    if (job.status === 'completed') {
      return (
        <div className="space-y-3">
          <span className="text-sm text-muted-foreground flex items-center gap-1.5">
            <Minus size={16} weight="bold" className="text-muted-foreground/70" />
            Not enrolled
          </span>
          {customer?.id && job.enrollment_resolution !== 'suppressed' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onSendOneOff(customer.id)}
            >
              <PaperPlaneTilt size={14} className="mr-1.5" />
              Send Request
            </Button>
          )}
        </div>
      )
    }

    return (
      <span className="text-sm text-muted-foreground">
        No campaign
      </span>
    )
  }

  // Status badge
  const renderStatusBadge = () => {
    if (job.status === 'scheduled') {
      return <StatusDot dotColor="bg-info" label="Scheduled" />
    }
    if (job.status === 'completed') {
      return <StatusDot dotColor="bg-success" label="Completed" />
    }
    return <StatusDot dotColor="bg-muted-foreground" label="Do Not Send" />
  }

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="right" className="sm:max-w-lg overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Job Details</SheetTitle>
            <SheetDescription>
              View job information and take actions
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* Customer Section */}
            <div>
              <h4 className="text-sm font-medium mb-3">Customer</h4>
              <p className="text-lg font-semibold">{customer?.name || 'Unknown'}</p>

              {customer?.email && (
                <div className="flex items-center gap-2 mt-1">
                  <Envelope size={14} className="text-muted-foreground shrink-0" />
                  <span className="text-sm text-muted-foreground truncate">{customer.email}</span>
                  <button
                    onClick={() => copyToClipboard(customer.email, 'Email')}
                    className="p-1 hover:bg-muted rounded transition-colors shrink-0"
                    aria-label="Copy email"
                  >
                    <Copy size={14} className="text-muted-foreground" />
                  </button>
                </div>
              )}

              {customer?.phone && (
                <div className="flex items-center gap-2 mt-1">
                  <Phone size={14} className="text-muted-foreground shrink-0" />
                  <span className="text-sm font-mono text-muted-foreground">
                    {formatPhoneDisplay(customer.phone)}
                  </span>
                  <button
                    onClick={() => copyToClipboard(customer.phone!, 'Phone')}
                    className="p-1 hover:bg-muted rounded transition-colors shrink-0"
                    aria-label="Copy phone"
                  >
                    <Copy size={14} className="text-muted-foreground" />
                  </button>
                </div>
              )}
            </div>

            <Separator />

            {/* Job Info Grid */}
            <div>
              <h4 className="text-sm font-medium mb-3">Job Information</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Wrench size={14} />
                    Service Type
                  </span>
                  <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
                    {SERVICE_TYPE_LABELS[job.service_type] || job.service_type}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status</span>
                  {renderStatusBadge()}
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <CalendarBlank size={14} />
                    Created
                  </span>
                  <span className="text-sm">
                    {format(new Date(job.created_at), 'MMM d, yyyy')}
                  </span>
                </div>

                {job.completed_at && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground flex items-center gap-1.5">
                      <CheckCircle size={14} />
                      Completed
                    </span>
                    <span className="text-sm">
                      {format(new Date(job.completed_at), 'MMM d, yyyy')}{' '}
                      <span className="text-muted-foreground">
                        ({formatDistanceToNow(new Date(job.completed_at), { addSuffix: true })})
                      </span>
                    </span>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Campaign Section */}
            <div>
              <h4 className="text-sm font-medium mb-3">Campaign</h4>
              {renderCampaignStatus()}
            </div>

            <Separator />

            {/* Notes Section */}
            <div>
              <h4 className="text-sm font-medium mb-3">Notes</h4>
              {job.notes ? (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{job.notes}</p>
              ) : (
                <p className="text-sm text-muted-foreground italic">No notes</p>
              )}
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="space-y-2">
              {job.status === 'scheduled' && (
                <Button
                  onClick={handleMarkComplete}
                  disabled={isCompleting}
                  variant="outline"
                  className="w-full justify-start text-success-foreground border-success/40 hover:bg-success-bg"
                >
                  {isCompleting ? (
                    <CircleNotch size={14} className="mr-1 animate-spin" />
                  ) : (
                    <CheckCircle size={14} weight="fill" className="mr-1 text-success" />
                  )}
                  {isCompleting ? 'Completing...' : 'Complete'}
                </Button>
              )}
              <Button
                onClick={() => {
                  onOpenChange(false)
                  onEdit(job)
                }}
                variant="outline"
                className="w-full justify-start"
              >
                <PencilSimple size={16} className="mr-2" />
                Edit Job
              </Button>
              <Button
                onClick={handleDelete}
                variant="outline"
                className="w-full justify-start text-destructive hover:text-destructive"
              >
                <Trash size={16} className="mr-2" />
                Delete Job
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Replace confirmation dialog */}
      <AlertDialog open={showReplaceConfirm} onOpenChange={setShowReplaceConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <ArrowsClockwise size={20} className="text-warning" />
              Replace active sequence?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                {conflictDetail ? (
                  <p>
                    <strong>{conflictDetail.existingCampaignName}</strong> is at Touch {conflictDetail.currentTouch} of {conflictDetail.totalTouches} for this customer. Replacing will cancel the remaining touches and start a new sequence for this job.
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
