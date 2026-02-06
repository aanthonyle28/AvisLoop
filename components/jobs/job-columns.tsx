'use client'

import { type ColumnDef } from '@tanstack/react-table'
import { format, formatDistanceToNow } from 'date-fns'
import { PencilSimple, Trash } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { SERVICE_TYPE_LABELS } from '@/lib/validations/job'
import { deleteJob } from '@/lib/actions/job'
import { toast } from 'sonner'
import { MarkCompleteButton } from './mark-complete-button'
import type { JobWithCustomer } from '@/lib/types/database'

interface ColumnsOptions {
  onEdit: (job: JobWithCustomer) => void
}

export function columns({ onEdit }: ColumnsOptions): ColumnDef<JobWithCustomer>[] {
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
                className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400"
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
                className="w-fit bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400"
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
