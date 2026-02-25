'use client'

import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { Checkbox } from '@/components/ui/checkbox'
import { StatusBadge } from './status-badge'
import { Button } from '@/components/ui/button'
import { ArrowClockwise } from '@phosphor-icons/react'
import type { SendLogWithCustomer } from '@/lib/types/database'
import type { SendStatus } from './status-badge'

export const RESENDABLE_STATUSES = ['failed', 'bounced']

interface CreateColumnsProps {
  onResend?: (request: SendLogWithCustomer) => void
  enableSelection?: boolean
}

export function createColumns({ onResend, enableSelection }: CreateColumnsProps = {}): ColumnDef<SendLogWithCustomer>[] {
  const columns: ColumnDef<SendLogWithCustomer>[] = []

  if (enableSelection) {
    columns.push({
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getFilteredSelectedRowModel().rows.length > 0 &&
            table.getFilteredSelectedRowModel().rows.length ===
              table.getFilteredRowModel().rows.filter((r) =>
                RESENDABLE_STATUSES.includes(r.original.status)
              ).length
          }
          onCheckedChange={(value) => {
            const newSelection: Record<string, boolean> = {}
            if (value) {
              table.getFilteredRowModel().rows.forEach((row) => {
                if (RESENDABLE_STATUSES.includes(row.original.status)) {
                  newSelection[row.id] = true
                }
              })
            }
            table.setRowSelection(newSelection)
          }}
          aria-label="Select all failed"
          onClick={(e) => e.stopPropagation()}
        />
      ),
      cell: ({ row }) => {
        if (!RESENDABLE_STATUSES.includes(row.original.status)) {
          return <div className="w-4" />
        }
        return (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
            onClick={(e) => e.stopPropagation()}
          />
        )
      },
      enableSorting: false,
      enableHiding: false,
    })
  }

  columns.push(
    {
      accessorKey: 'customers',
      header: 'Recipient',
      cell: ({ row }) => {
        const customer = row.original.customers
        return (
          <div className="flex flex-col">
            <span className="font-medium">{customer.name}</span>
            <span className="text-sm text-muted-foreground">{customer.email}</span>
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
        const isResendable = RESENDABLE_STATUSES.includes(request.status)

        if (!isResendable || !onResend) return null

        return (
          <div className="flex items-center justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                onResend(request)
              }}
              className="h-8 px-2 gap-1.5"
            >
              <ArrowClockwise className="h-4 w-4" />
              Retry
            </Button>
          </div>
        )
      },
    },
  )

  return columns
}
