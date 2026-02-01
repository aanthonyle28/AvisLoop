'use client'

import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { StatusBadge } from './status-badge'
import { Button } from '@/components/ui/button'
import { ArrowClockwise, X } from '@phosphor-icons/react'
import type { SendLogWithContact } from '@/lib/types/database'
import type { SendStatus } from './status-badge'

interface CreateColumnsProps {
  onResend?: (request: SendLogWithContact) => void
  onCancel?: (request: SendLogWithContact) => void
}

export function createColumns({ onResend, onCancel }: CreateColumnsProps = {}): ColumnDef<SendLogWithContact>[] {
  return [
    {
      accessorKey: 'contacts',
      header: 'Recipient',
      cell: ({ row }) => {
        const contact = row.original.contacts
        return (
          <div className="flex flex-col">
            <span className="font-medium">{contact.name}</span>
            <span className="text-sm text-muted-foreground">{contact.email}</span>
          </div>
        )
      },
    },
    {
      accessorKey: 'subject',
      header: 'Subject',
      cell: ({ row }) => (
        <span className="max-w-[300px] truncate block" title={row.original.subject}>
          {row.original.subject}
        </span>
      ),
    },
    {
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => (
        <StatusBadge status={row.original.status as SendStatus} />
      ),
    },
    {
      accessorKey: 'created_at',
      header: 'Sent',
      cell: ({ row }) => (
        <span className="text-muted-foreground">
          {format(new Date(row.original.created_at), 'MMM d, yyyy h:mm a')}
        </span>
      ),
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const request = row.original
        const isPending = request.status === 'pending'
        const canResend = !isPending && onResend

        return (
          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {canResend && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onResend(request)
                }}
                className="h-8 w-8 p-0"
                title="Resend"
              >
                <ArrowClockwise className="h-4 w-4" />
              </Button>
            )}
            {isPending && onCancel && (
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onCancel(request)
                }}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                title="Cancel"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )
      },
    },
  ]
}
