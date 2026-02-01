'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'
import { formatDistanceToNow } from 'date-fns'
import type { Contact } from '@/lib/types/database'

interface ColumnHandlers {
  resendReadyIds: Set<string>
}

export const createBulkSendColumns = (handlers: ColumnHandlers): ColumnDef<Contact>[] => [
  // Selection column
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => {
      const contact = row.original
      const isOptedOut = contact.opted_out

      return (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
          disabled={isOptedOut}
        />
      )
    },
    enableSorting: false,
    enableHiding: false,
  },

  // Name column
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => {
      const contact = row.original
      const isOptedOut = contact.opted_out

      return (
        <div className={`font-medium ${isOptedOut ? 'text-muted-foreground' : ''}`}>
          {row.getValue('name')}
        </div>
      )
    },
  },

  // Email column
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => {
      const contact = row.original
      const isOptedOut = contact.opted_out

      return (
        <div className={`text-sm ${isOptedOut ? 'text-muted-foreground' : 'text-muted-foreground'}`}>
          {row.getValue('email')}
        </div>
      )
    },
  },

  // Last sent column with relative time
  {
    accessorKey: 'last_sent_at',
    header: 'Last Sent',
    cell: ({ row }) => {
      const date = row.getValue('last_sent_at') as string | null

      return (
        <div className="text-sm text-muted-foreground">
          {date ? formatDistanceToNow(new Date(date), { addSuffix: true }) : 'Never'}
        </div>
      )
    },
  },

  // Status indicator column
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const contact = row.original
      const isOptedOut = contact.opted_out
      const isReady = handlers.resendReadyIds.has(contact.id)

      if (isOptedOut) {
        return (
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-destructive" />
            <span className="text-xs text-muted-foreground">Opted out</span>
          </div>
        )
      }

      if (!contact.last_sent_at) {
        return (
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-xs text-muted-foreground">Ready</span>
          </div>
        )
      }

      if (isReady) {
        return (
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-green-500" />
            <span className="text-xs text-muted-foreground">Ready</span>
          </div>
        )
      }

      // On cooldown
      return (
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-yellow-500" />
          <span className="text-xs text-muted-foreground">Cooldown</span>
        </div>
      )
    },
  },
]
