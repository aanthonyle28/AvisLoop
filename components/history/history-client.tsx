'use client'

import { useSearchParams } from 'next/navigation'
import { HistoryTable } from './history-table'
import { HistoryFilters } from './history-filters'
import { EmptyState } from './empty-state'
import type { SendLogWithContact } from '@/lib/types/database'

interface HistoryClientProps {
  initialLogs: SendLogWithContact[]
  total: number
}

export function HistoryClient({ initialLogs, total }: HistoryClientProps) {
  const searchParams = useSearchParams()

  // Determine if any filters are active
  const hasFilters =
    searchParams.has('query') ||
    (searchParams.has('status') && searchParams.get('status') !== 'all') ||
    searchParams.has('from') ||
    searchParams.has('to')

  const hasLogs = initialLogs.length > 0

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Message History</h1>
        <p className="text-muted-foreground mt-1">
          View and track all your sent review requests
        </p>
      </div>

      {/* Always show filters if there are logs OR if filters are active */}
      {(hasLogs || hasFilters) && (
        <HistoryFilters />
      )}

      {/* Content */}
      {hasLogs ? (
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Showing {initialLogs.length} of {total} message{total !== 1 ? 's' : ''}
          </div>
          <HistoryTable data={initialLogs} />
        </div>
      ) : (
        <EmptyState hasFilters={hasFilters} />
      )}
    </div>
  )
}
