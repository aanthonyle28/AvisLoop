'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'
import { StatusDot } from '@/components/ui/status-dot'
import { Button } from '@/components/ui/button'
import {
  DotsThree,
  Archive,
  ArrowCounterClockwise,
  Trash,
  PencilSimple,
  Copy,
  Envelope
} from '@phosphor-icons/react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { format } from 'date-fns'
import type { Customer } from '@/lib/types/database'
import { formatPhoneDisplay } from '@/lib/utils/phone'
import { TagList } from '@/components/ui/tag-badge'
import { toast } from 'sonner'

interface ColumnHandlers {
  onEdit: (customer: Customer) => void
  onArchive: (id: string) => void
  onRestore: (id: string) => void
  onDelete: (id: string) => void
}

export const createColumns = (handlers: ColumnHandlers): ColumnDef<Customer>[] => [
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
        aria-label='Select all'
      />
    ),
    cell: ({ row }) => (
      <div onClick={(e) => e.stopPropagation()}>
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label='Select row'
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },

  // Name column
  {
    accessorKey: 'name',
    header: 'Name',
    cell: ({ row }) => <div className='font-medium'>{row.getValue('name')}</div>,
  },

  // Email column
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => <div className='text-muted-foreground'>{row.getValue('email')}</div>,
  },

  // Phone column
  {
    accessorKey: 'phone',
    header: 'Phone',
    cell: ({ row }) => {
      const phone = row.original.phone
      const phoneStatus = row.original.phone_status

      if (!phone || phoneStatus === 'missing') {
        return (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Envelope size={12} />
            Email-only
          </span>
        )
      }

      const formatted = formatPhoneDisplay(phone)

      const handleCopy = async () => {
        await navigator.clipboard.writeText(phone)
        toast.success('Phone copied to clipboard')
      }

      return (
        <div className="flex items-center gap-1">
          <span className="font-mono text-sm">{formatted}</span>
          <button
            onClick={handleCopy}
            className="p-1 hover:bg-muted rounded opacity-0 group-hover:opacity-100 transition-opacity"
            title="Copy phone number"
          >
            <Copy size={12} className="text-muted-foreground" />
          </button>
        </div>
      )
    },
  },

  // Tags column
  {
    accessorKey: 'tags',
    header: 'Tags',
    cell: ({ row }) => {
      const tags = row.original.tags || []
      return <TagList tags={tags} className="max-w-[200px]" />
    },
    filterFn: (row, _id, filterValue: string[]) => {
      if (!filterValue || filterValue.length === 0) return true
      const tags = row.original.tags || []
      // OR filter: show if customer has ANY selected tag
      return filterValue.some(tag => tags.includes(tag))
    },
  },

  // Status column with badge
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as 'active' | 'archived'
      return (
        <StatusDot
          dotColor={status === 'active' ? 'bg-success' : 'bg-muted-foreground'}
          label={status === 'active' ? 'Active' : 'Archived'}
        />
      )
    },
  },

  // Created at column
  {
    accessorKey: 'created_at',
    header: 'Added',
    cell: ({ row }) => {
      const date = row.getValue('created_at') as string
      return <div className='text-sm'>{format(new Date(date), 'MMM d, yyyy')}</div>
    },
  },

  // Last sent at column
  {
    accessorKey: 'last_sent_at',
    header: 'Last Sent',
    cell: ({ row }) => {
      const date = row.getValue('last_sent_at') as string | null
      return (
        <div className='text-sm text-muted-foreground'>
          {date ? format(new Date(date), 'MMM d, yyyy') : 'Never'}
        </div>
      )
    },
  },

  // Actions column
  {
    id: 'actions',
    cell: ({ row }) => {
      const customer = row.original
      const isArchived = customer.status === 'archived'

      return (
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='icon'>
                <DotsThree size={20} />
                <span className='sr-only'>Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handlers.onEdit(customer); }}>
                <PencilSimple size={16} className='mr-2' />
                Edit
              </DropdownMenuItem>
              {isArchived ? (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handlers.onRestore(customer.id); }}>
                  <ArrowCounterClockwise size={16} className='mr-2' />
                  Restore
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handlers.onArchive(customer.id); }}>
                  <Archive size={16} className='mr-2' />
                  Archive
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); handlers.onDelete(customer.id); }}
                className='text-destructive'
              >
                <Trash size={16} className='mr-2' />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  },
]
