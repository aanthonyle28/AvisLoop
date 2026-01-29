'use client'

import { useState } from 'react'
import { CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronUp } from 'lucide-react'

interface BatchResultsProps {
  results: {
    sent: number
    skipped: number
    failed: number
    details?: Array<{
      contactId: string
      contactName: string
      status: 'sent' | 'skipped' | 'failed'
      reason?: string
    }>
  }
  onSendMore?: () => void
}

const REASON_LABELS: Record<string, string> = {
  not_found: 'Contact not found',
  archived: 'Contact archived',
  opted_out: 'Opted out',
  cooldown: 'On cooldown',
  log_creation_failed: 'Failed to create log',
  unknown_error: 'Unknown error',
}

export function BatchResults({ results, onSendMore }: BatchResultsProps) {
  const [showDetails, setShowDetails] = useState(false)

  const { sent, skipped, failed, details = [] } = results

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* Sent */}
        <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/20 p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-green-600 dark:text-green-400 flex-shrink-0" />
            <div>
              <div className="text-2xl font-bold text-green-800 dark:text-green-200">{sent}</div>
              <div className="text-sm text-green-700 dark:text-green-300">
                Sent successfully
              </div>
            </div>
          </div>
        </div>

        {/* Skipped */}
        {skipped > 0 && (
          <div className="rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-900 dark:bg-yellow-950/20 p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-8 h-8 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
              <div>
                <div className="text-2xl font-bold text-yellow-800 dark:text-yellow-200">{skipped}</div>
                <div className="text-sm text-yellow-700 dark:text-yellow-300">
                  Skipped
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Failed */}
        {failed > 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/20 p-4">
            <div className="flex items-center gap-3">
              <XCircle className="w-8 h-8 text-red-600 dark:text-red-400 flex-shrink-0" />
              <div>
                <div className="text-2xl font-bold text-red-800 dark:text-red-200">{failed}</div>
                <div className="text-sm text-red-700 dark:text-red-300">
                  Failed
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Details toggle */}
      {details.length > 0 && (
        <div className="rounded-lg border">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
          >
            <span className="text-sm font-medium">
              View Details ({details.length} contact{details.length !== 1 ? 's' : ''})
            </span>
            {showDetails ? (
              <ChevronUp className="w-4 h-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            )}
          </button>

          {showDetails && (
            <div className="border-t divide-y max-h-96 overflow-y-auto">
              {details.map((detail, idx) => (
                <div key={`${detail.contactId}-${idx}`} className="px-4 py-3 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-sm">{detail.contactName}</div>
                    {detail.reason && (
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {REASON_LABELS[detail.reason] || detail.reason}
                      </div>
                    )}
                  </div>
                  <div>
                    {detail.status === 'sent' && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-100 dark:text-green-300 dark:bg-green-900/30 px-2 py-1 rounded">
                        <CheckCircle2 className="w-3 h-3" />
                        Sent
                      </span>
                    )}
                    {detail.status === 'skipped' && (
                      <span className="inline-flex items-center gap-1 text-xs text-yellow-700 bg-yellow-100 dark:text-yellow-300 dark:bg-yellow-900/30 px-2 py-1 rounded">
                        <AlertTriangle className="w-3 h-3" />
                        Skipped
                      </span>
                    )}
                    {detail.status === 'failed' && (
                      <span className="inline-flex items-center gap-1 text-xs text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/30 px-2 py-1 rounded">
                        <XCircle className="w-3 h-3" />
                        Failed
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Send More button */}
      {onSendMore && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={onSendMore}
            className="inline-flex items-center px-6 py-3 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
          >
            Send More
          </button>
        </div>
      )}
    </div>
  )
}
