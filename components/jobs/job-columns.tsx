'use client'

import { type ColumnDef } from '@tanstack/react-table'
import { format, formatDistanceToNow } from 'date-fns'
import { PencilSimple, Trash, Clock, CheckCircle, XCircle, Minus } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SERVICE_TYPE_LABELS } from '@/lib/validations/job'
import { deleteJob } from '@/lib/actions/job'
import { toast } from 'sonner'
import { MarkCompleteButton } from './mark-complete-button'
import type { JobWithEnrollment } from '@/lib/types/database'

interface ColumnsOptions {
  onEdit: (job: JobWithEnrollment) => void
}

export function columns({ onEdit }: ColumnsOptions): ColumnDef<JobWithEnrollment>[] {
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

        // Three-state workflow: scheduled -> completed -> do_not_send
        if (status === 'scheduled') {
          return (
            <div className="flex items-center gap-2">
              <Badge
                variant="secondary"
                className="bg-warning-bg text-warning-foreground"
              >
                Scheduled
              </Badge>
              <MarkCompleteButton jobId={row.original.id} size="xs" />
            </div>
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

        // Stopped enrollment
        if (anyEnrollment && anyEnrollment.status === 'stopped') {
          return (
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Minus size={14} weight="bold" className="text-muted-foreground/70" />
              Stopped
            </span>
          )
        }

        // Scheduled job with matching campaign - show preview
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

        // Completed job should be enrolled but isn't (edge case)
        if (matchingCampaign && job.status === 'completed') {
          return (
            <span className="text-xs text-warning flex items-center gap-1">
              <Clock size={14} weight="fill" />
              Pending enrollment
            </span>
          )
        }

        // No matching campaign
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

        const handleDelete = async () => {
          if (!confirm('Are you sure you want to delete this job?')) return
          const result = await deleteJob(job.id)
          if (result.error) {
            toast.error(result.error)
          } else {
            toast.success('Job deleted')
          }
        }

        return (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(job)}
              className="h-8 w-8"
            >
              <PencilSimple className="h-4 w-4" />
              <span className="sr-only">Edit</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              className="h-8 w-8 text-destructive hover:text-destructive"
            >
              <Trash className="h-4 w-4" />
              <span className="sr-only">Delete</span>
            </Button>
          </div>
        )
      },
    },
  ]
}
