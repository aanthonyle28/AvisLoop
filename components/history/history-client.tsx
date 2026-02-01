'use client'

import { useSearchParams, usePathname, useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { HistoryTable } from './history-table'
import { HistoryFilters } from './history-filters'
import { EmptyState } from './empty-state'
import { Button } from '@/components/ui/button'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import type { SendLogWithContact } from '@/lib/types/database'

interface HistoryClientProps {
  initialLogs: SendLogWithContact[]
  total: number
  currentPage: number
  pageSize: number
}

export function HistoryClient({ initialLogs, total, currentPage, pageSize }: HistoryClientProps) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace } = useRouter()
  const [isPending, startTransition] = useTransition()

  // Pagination logic
  const totalPages = Math.ceil(total / pageSize)
  const hasPreviousPage = currentPage > 1
  const hasNextPage = currentPage < totalPages

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString())
    if (page <= 1) {
      params.delete('page')
    } else {
      params.set('page', String(page))
    }
    startTransition(() => {
      replace(`${pathname}?${params.toString()}`)
    })
  }

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
            Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, total)} of {total} message{total !== 1 ? 's' : ''}
          </div>
          <HistoryTable data={initialLogs} />
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={!hasPreviousPage || isPending}
                >
                  <CaretLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={!hasNextPage || isPending}
                >
                  Next
                  <CaretRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <EmptyState hasFilters={hasFilters} />
      )}
    </div>
  )
}
