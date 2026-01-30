'use client'

import type { ScheduledSend } from '@/lib/types/database'
import { formatScheduleDate } from '@/lib/utils/schedule'
import { CancelButton } from './cancel-button'
import { Clock, Users, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

interface ScheduledTableProps {
  sends: ScheduledSend[]
}

export function ScheduledTable({ sends }: ScheduledTableProps) {
  // Separate pending and past sends
  const pending = sends
    .filter(s => s.status === 'pending')
    .sort((a, b) => new Date(a.scheduled_for).getTime() - new Date(b.scheduled_for).getTime())

  const past = sends
    .filter(s => s.status !== 'pending')
    .sort((a, b) => new Date(b.scheduled_for).getTime() - new Date(a.scheduled_for).getTime())

  const getStatusBadge = (status: ScheduledSend['status']) => {
    switch (status) {
      case 'pending':
        return (
          <Badge variant="default" className="gap-1">
            <Clock className="h-3 w-3" />
            Pending
          </Badge>
        )
      case 'completed':
        return (
          <Badge variant="secondary" className="gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Completed
          </Badge>
        )
      case 'failed':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertTriangle className="h-3 w-3" />
            Failed
          </Badge>
        )
      case 'cancelled':
        return (
          <Badge variant="outline" className="gap-1">
            <XCircle className="h-3 w-3" />
            Cancelled
          </Badge>
        )
    }
  }

  return (
    <div className="space-y-8">
      {/* Pending sends */}
      {pending.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Pending</h2>

          {/* Desktop table */}
          <div className="hidden md:block rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-left text-sm font-medium">Contacts</th>
                  <th className="p-3 text-left text-sm font-medium">Scheduled For</th>
                  <th className="p-3 text-left text-sm font-medium">Status</th>
                  <th className="p-3 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((send) => (
                  <tr key={send.id} className="border-b last:border-0">
                    <td className="p-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {send.contact_ids.length} contact{send.contact_ids.length !== 1 ? 's' : ''}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {formatScheduleDate(send.scheduled_for)}
                      </div>
                    </td>
                    <td className="p-3">
                      {getStatusBadge(send.status)}
                    </td>
                    <td className="p-3">
                      <CancelButton scheduledSendId={send.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-4">
            {pending.map((send) => (
              <div key={send.id} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {send.contact_ids.length} contact{send.contact_ids.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {getStatusBadge(send.status)}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {formatScheduleDate(send.scheduled_for)}
                </div>
                <div className="pt-2 border-t">
                  <CancelButton scheduledSendId={send.id} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past sends */}
      {past.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">
            {pending.length === 0 ? 'No pending scheduled sends' : 'Past Scheduled Sends'}
          </h2>

          {/* Desktop table */}
          <div className="hidden md:block rounded-md border">
            <table className="w-full">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="p-3 text-left text-sm font-medium">Contacts</th>
                  <th className="p-3 text-left text-sm font-medium">Scheduled For</th>
                  <th className="p-3 text-left text-sm font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {past.map((send) => (
                  <tr key={send.id} className="border-b last:border-0">
                    <td className="p-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {send.contact_ids.length} contact{send.contact_ids.length !== 1 ? 's' : ''}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {formatScheduleDate(send.scheduled_for)}
                      </div>
                    </td>
                    <td className="p-3">
                      {getStatusBadge(send.status)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-4">
            {past.map((send) => (
              <div key={send.id} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {send.contact_ids.length} contact{send.contact_ids.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {getStatusBadge(send.status)}
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  {formatScheduleDate(send.scheduled_for)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {pending.length === 0 && past.length === 0 && (
        <p className="text-center text-muted-foreground py-8">No scheduled sends found.</p>
      )}
    </div>
  )
}
