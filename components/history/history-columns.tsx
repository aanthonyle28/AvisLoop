'use client'

import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { StatusBadge } from './status-badge'
import type { SendLogWithContact } from '@/lib/types/database'
import type { SendStatus } from './status-badge'

export function createColumns(): ColumnDef<SendLogWithContact>[] {
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
  ]
}
