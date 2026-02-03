'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MoreHorizontal, Archive, RotateCcw, Trash2, Pencil } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { format } from 'date-fns'
import type { Customer } from '@/lib/types/database'

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

  // Status column with badge
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as 'active' | 'archived'
      return (
        <Badge variant={status === 'active' ? 'default' : 'secondary'}>
          {status === 'active' ? 'Active' : 'Archived'}
        </Badge>
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
                <MoreHorizontal />
                <span className='sr-only'>Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handlers.onEdit(customer); }}>
                <Pencil className='mr-2 h-4 w-4' />
                Edit
              </DropdownMenuItem>
              {isArchived ? (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handlers.onRestore(customer.id); }}>
                  <RotateCcw className='mr-2 h-4 w-4' />
                  Restore
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handlers.onArchive(customer.id); }}>
                  <Archive className='mr-2 h-4 w-4' />
                  Archive
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={(e) => { e.stopPropagation(); handlers.onDelete(customer.id); }}
                className='text-destructive'
              >
                <Trash2 className='mr-2 h-4 w-4' />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )
    },
  },
]
