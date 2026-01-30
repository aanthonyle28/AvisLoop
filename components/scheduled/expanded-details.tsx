'use client'

import type { ScheduledSendWithDetails } from '@/lib/types/database'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, Warning, XCircle } from '@phosphor-icons/react'

interface ExpandedDetailsProps {
  scheduledSend: ScheduledSendWithDetails
}

export function ExpandedDetails({ scheduledSend }: ExpandedDetailsProps) {
  const isCompleted = scheduledSend.status === 'completed'
  const isPending = scheduledSend.status === 'pending'

  // Calculate counts for completed sends
  const sentCount = scheduledSend.sendLogs.filter(log => log.status === 'sent' || log.status === 'delivered').length
  const failedCount = scheduledSend.sendLogs.filter(log => log.status === 'failed' || log.status === 'bounced').length
  const skippedCount = scheduledSend.contact_ids.length - scheduledSend.sendLogs.length

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return 'text-green-600 bg-green-50'
      case 'failed':
      case 'bounced':
        return 'text-red-600 bg-red-50'
      default:
        return 'text-muted-foreground bg-muted'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
        return <CheckCircle className="h-3 w-3" />
      case 'failed':
      case 'bounced':
        return <XCircle className="h-3 w-3" />
      default:
        return <Warning className="h-3 w-3" />
    }
  }

  return (
    <div className="bg-muted/50 rounded-md p-4 space-y-4">
      {/* Subject preview */}
      {scheduledSend.custom_subject && (
        <div>
          <p className="text-xs text-muted-foreground mb-1">Email Subject</p>
          <p className="text-sm font-medium">{scheduledSend.custom_subject}</p>
        </div>
      )}

      {/* Results summary for completed sends */}
      {isCompleted && (
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-green-600 font-medium">{sentCount} sent</span>
          </div>
          {skippedCount > 0 && (
            <div className="flex items-center gap-2">
              <Warning className="h-4 w-4 text-orange-600" />
              <span className="text-orange-600 font-medium">{skippedCount} skipped</span>
            </div>
          )}
          {failedCount > 0 && (
            <div className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-red-600" />
              <span className="text-red-600 font-medium">{failedCount} failed</span>
            </div>
          )}
        </div>
      )}

      {/* Pending send info */}
      {isPending && (
        <div>
          <p className="text-sm text-muted-foreground">
            Scheduled for {new Date(scheduledSend.scheduled_for).toLocaleString()} · {scheduledSend.contact_ids.length} contact{scheduledSend.contact_ids.length !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Per-contact breakdown for completed sends */}
      {isCompleted && scheduledSend.sendLogs.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">Per-contact results</p>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            <div className="grid grid-cols-[1fr,2fr,120px] gap-3 text-xs font-medium text-muted-foreground pb-1 border-b">
              <div>Name</div>
              <div>Email</div>
              <div>Status</div>
            </div>
            {scheduledSend.sendLogs.map(log => (
              <div key={log.id} className="space-y-1">
                <div className="grid grid-cols-[1fr,2fr,120px] gap-3 text-sm items-center">
                  <div className="truncate">{log.contacts.name}</div>
                  <div className="truncate text-muted-foreground">{log.contacts.email}</div>
                  <div>
                    <Badge variant="outline" className={`gap-1 ${getStatusColor(log.status)}`}>
                      {getStatusIcon(log.status)}
                      {log.status}
                    </Badge>
                  </div>
                </div>
                {log.error_message && (
                  <div className="text-xs text-red-600 pl-1">
                    Error: {log.error_message}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Show skipped contacts message if any */}
      {isCompleted && skippedCount > 0 && (
        <p className="text-xs text-orange-600">
          {skippedCount} contact{skippedCount !== 1 ? 's were' : ' was'} skipped due to cooldown, opt-out, or archived status.
        </p>
      )}
    </div>
  )
}
