'use client'

import { type ColumnDef } from '@tanstack/react-table'
import { format, formatDistanceToNow } from 'date-fns'
import { PencilSimple, Trash, Clock, CheckCircle, XCircle, Minus, PaperPlaneTilt, DotsThree, WarningCircle, Queue, ArrowsClockwise, SkipForward } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { SERVICE_TYPE_LABELS } from '@/lib/validations/job'
import { MarkCompleteButton } from './mark-complete-button'
import type { JobWithEnrollment } from '@/lib/types/database'

interface ColumnsOptions {
  onEdit: (job: JobWithEnrollment) => void
  onDelete: (jobId: string) => void
  onMarkComplete: (jobId: string) => void
  onSendOneOff: (customerId: string) => void
  onResolveConflict: (jobId: string, action: 'replace' | 'skip' | 'queue_after') => void
}

export function columns({ onEdit, onDelete, onMarkComplete, onSendOneOff, onResolveConflict }: ColumnsOptions): ColumnDef<JobWithEnrollment>[] {
  return [
    {
      accessorKey: 'customers.name',
      header: 'Customer',
      cell: ({ row }) => {
        const customer = row.original.customers
        return (
          <div>
            <div className="font-medium">{customer?.name || 'Unknown'}</div>
            <div className="text-sm text-muted-foreground">{customer?.email || ''}</div>
          </div>
        )
      },
    },
    {
      accessorKey: 'service_type',
      header: 'Service Type',
      cell: ({ row }) => {
        const serviceType = row.original.service_type
        return (
          <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium">
            {SERVICE_TYPE_LABELS[serviceType] || serviceType}
          </span>
        )
      },
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const status = row.original.status
        const completedAt = row.original.completed_at

        if (status === 'scheduled') {
          return (
            <Badge
              variant="secondary"
              className="bg-warning-bg text-warning-foreground"
            >
              Scheduled
            </Badge>
          )
        }

        if (status === 'completed') {
          return (
            <div className="flex flex-col gap-0.5">
              <Badge
                variant="default"
                className="w-fit bg-success-bg text-success-foreground"
              >
                Completed
              </Badge>
              {completedAt && (
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(completedAt), { addSuffix: true })}
                </span>
              )}
            </div>
          )
        }

        // do_not_send
        return (
          <Badge
            variant="secondary"
            className="bg-muted text-muted-foreground"
          >
            Do Not Send
          </Badge>
        )
      },
    },
    {
      id: 'campaign',
      header: 'Campaign',
      cell: ({ row }) => {
        const job = row.original
        const activeEnrollment = job.campaign_enrollments?.find(e => e.status === 'active')
        const anyEnrollment = job.campaign_enrollments?.[0]
        const matchingCampaign = job.matchingCampaign

        // do_not_send jobs are not enrolled
        if (job.status === 'do_not_send') {
          return (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <XCircle size={14} weight="fill" className="text-muted-foreground/70" />
              Not enrolled
            </span>
          )
        }

        // Already has active enrollment
        if (activeEnrollment) {
          return (
            <span className="text-xs text-success flex items-center gap-1">
              <CheckCircle size={14} weight="fill" />
              {activeEnrollment.campaigns?.name || 'Enrolled'}
            </span>
          )
        }

        // Completed enrollment (all touches sent)
        if (anyEnrollment && anyEnrollment.status === 'completed') {
          return (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <CheckCircle size={14} weight="fill" className="text-muted-foreground/70" />
              {anyEnrollment.campaigns?.name || 'Completed'}
            </span>
          )
        }

        // Completed job with one-off override — show current intent, not stale stopped enrollment
        if (job.status === 'completed' && job.campaign_override === 'one_off') {
          return (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); if (job.customers?.id) onSendOneOff(job.customers.id) }}
              className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 hover:underline cursor-pointer"
            >
              <PaperPlaneTilt size={14} weight="fill" />
              Send One-Off Request
            </button>
          )
        }

        // Enrollment resolution states (conflict / queue_after / suppressed / skipped)
        if (job.enrollment_resolution === 'conflict') {
          return (
            <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs text-warning-foreground flex items-center gap-1 cursor-help">
                  <WarningCircle size={14} weight="fill" className="text-warning" />
                  Conflict — awaiting resolution
                </span>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="max-w-[260px] bg-card text-card-foreground border shadow-md px-3 py-2.5 text-xs leading-relaxed"
              >
                <p className="font-semibold text-warning-foreground mb-1">Enrollment conflict</p>
                {job.conflictDetail ? (
                  <p className="text-muted-foreground">
                    Active: <strong>{job.conflictDetail.existingCampaignName}</strong> (Touch {job.conflictDetail.currentTouch} of {job.conflictDetail.totalTouches}). Choose to <strong>replace</strong>, <strong>skip</strong>, or <strong>queue</strong>.
                  </p>
                ) : (
                  <p className="text-muted-foreground">
                    This customer is currently enrolled in another campaign. Choose to <strong>replace</strong> the active sequence, <strong>skip</strong> this job, or <strong>queue</strong> it until the current sequence finishes.
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
            </TooltipProvider>
          )
        }

        if (job.enrollment_resolution === 'queue_after') {
          return (
            <TooltipProvider delayDuration={200}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="text-xs text-primary flex items-center gap-1 cursor-help">
                  <Queue size={14} weight="fill" />
                  Queued after active sequence
                </span>
              </TooltipTrigger>
              <TooltipContent
                side="bottom"
                className="max-w-[240px] bg-card text-card-foreground border shadow-md px-3 py-2.5 text-xs leading-relaxed"
              >
                <p className="font-semibold mb-1">Queued</p>
                {job.conflictDetail ? (
                  <p className="text-muted-foreground">
                    Waiting for <strong>{job.conflictDetail.existingCampaignName}</strong> (Touch {job.conflictDetail.currentTouch} of {job.conflictDetail.totalTouches}) to finish. You can enroll this job once the sequence completes.
                  </p>
                ) : (
                  <p className="text-muted-foreground">
                    Waiting for the active campaign sequence to finish. You can enroll this job once the sequence completes.
                  </p>
                )}
              </TooltipContent>
            </Tooltip>
            </TooltipProvider>
          )
        }

        if (job.enrollment_resolution === 'suppressed') {
          return (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <CheckCircle size={14} weight="fill" className="text-muted-foreground/70" />
              Review cooldown
            </span>
          )
        }

        if (job.enrollment_resolution === 'skipped') {
          return (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Minus size={14} weight="bold" className="text-muted-foreground/70" />
              Skipped
            </span>
          )
        }

        // Stopped enrollment (no override explains current state)
        if (anyEnrollment && anyEnrollment.status === 'stopped') {
          return (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Minus size={14} weight="bold" className="text-muted-foreground/70" />
              Stopped
            </span>
          )
        }

        // Scheduled job with campaign_override = 'one_off' — dimmed preview
        if (job.status === 'scheduled' && job.campaign_override === 'one_off') {
          return (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <PaperPlaneTilt size={14} className="text-muted-foreground/70" />
              One-off (on complete)
            </span>
          )
        }

        // Scheduled job with campaign_override = UUID — show chosen campaign name
        if (job.status === 'scheduled' && job.overrideCampaign) {
          const hours = job.overrideCampaign.firstTouchDelay
          const timeStr = hours < 24 ? `${hours}h` : `${Math.round(hours / 24)}d`
          return (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock size={14} weight="fill" className="text-primary/70" />
              {job.overrideCampaign.campaignName} in {timeStr}
            </span>
          )
        }

        // Scheduled job with matching campaign - show preview (auto-detect fallback)
        if (matchingCampaign && job.status === 'scheduled') {
          const hours = matchingCampaign.firstTouchDelay
          const timeStr = hours < 24 ? `${hours}h` : `${Math.round(hours / 24)}d`
          return (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock size={14} weight="fill" className="text-primary/70" />
              {matchingCampaign.campaignName} in {timeStr}
            </span>
          )
        }

        // Completed job with no enrollment — offer one-off send
        if (job.status === 'completed') {
          return (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); if (job.customers?.id) onSendOneOff(job.customers.id) }}
              className="text-xs text-primary hover:text-primary/80 flex items-center gap-1 hover:underline cursor-pointer"
            >
              <PaperPlaneTilt size={14} weight="fill" />
              Send One-Off Request
            </button>
          )
        }

        // Scheduled job with no matching campaign
        return (
          <span className="text-xs text-muted-foreground">
            No campaign
          </span>
        )
      },
    },
    {
      accessorKey: 'created_at',
      header: 'Created',
      cell: ({ row }) => format(new Date(row.original.created_at), 'MMM d, yyyy'),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const job = row.original

        return (
          <>
            {/* Desktop: inline icon buttons */}
            <div className="hidden sm:flex items-center gap-1" onClick={e => e.stopPropagation()}>
              <TooltipProvider delayDuration={300}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon-sm" onClick={() => onEdit(job)} aria-label="Edit job">
                      <PencilSimple className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Edit</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onDelete(job.id)}
                      aria-label="Delete job"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Delete</TooltipContent>
                </Tooltip>
                {job.enrollment_resolution === 'conflict' && (
                  <DropdownMenu>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="xs" className="text-warning-foreground border-warning/40 hover:bg-warning-bg" aria-label="Resolve conflict">
                            <WarningCircle size={14} weight="fill" className="mr-1 text-warning" />
                            Resolve
                          </Button>
                        </DropdownMenuTrigger>
                      </TooltipTrigger>
                      <TooltipContent>Resolve enrollment conflict</TooltipContent>
                    </Tooltip>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onResolveConflict(job.id, 'replace')}>
                        <ArrowsClockwise size={16} className="mr-2" />
                        Replace active sequence
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onResolveConflict(job.id, 'skip')}>
                        <SkipForward size={16} className="mr-2" />
                        Skip enrollment
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onResolveConflict(job.id, 'queue_after')}>
                        <Queue size={16} className="mr-2" />
                        Queue after active
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </TooltipProvider>
              {job.status === 'scheduled' && (
                <MarkCompleteButton jobId={job.id} size="xs" />
              )}
            </div>

            {/* Mobile: 3-dot dropdown menu */}
            <div className="sm:hidden" onClick={e => e.stopPropagation()}>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <DotsThree size={20} />
                    <span className="sr-only">Open menu</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {job.enrollment_resolution === 'conflict' && (
                    <>
                      <DropdownMenuItem onClick={() => onResolveConflict(job.id, 'replace')}>
                        <ArrowsClockwise size={16} className="mr-2" />
                        Replace active sequence
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onResolveConflict(job.id, 'skip')}>
                        <SkipForward size={16} className="mr-2" />
                        Skip enrollment
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onResolveConflict(job.id, 'queue_after')}>
                        <Queue size={16} className="mr-2" />
                        Queue after active
                      </DropdownMenuItem>
                    </>
                  )}
                  {job.status === 'scheduled' && (
                    <DropdownMenuItem onClick={() => onMarkComplete(job.id)}>
                      <CheckCircle size={16} className="mr-2" />
                      Mark Complete
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => onEdit(job)}>
                    <PencilSimple size={16} className="mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(job.id)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash size={16} className="mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </>
        )
      },
    },
  ]
}
