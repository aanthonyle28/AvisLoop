'use client'

import { useSearchParams, usePathname, useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { HistoryTable } from './history-table'
import { HistoryFilters } from './history-filters'
import { EmptyState } from './empty-state'
import { RequestDetailDrawer } from './request-detail-drawer'
import { Button } from '@/components/ui/button'
import { CaretLeft, CaretRight, ArrowClockwise } from '@phosphor-icons/react'
import { sendReviewRequest } from '@/lib/actions/send'
import { bulkResendRequests } from '@/lib/actions/bulk-resend'
import type { RowSelectionState } from '@tanstack/react-table'
import type { SendLogWithContact, Business, MessageTemplate } from '@/lib/types/database'

interface HistoryClientProps {
  initialLogs: SendLogWithContact[]
  total: number
  currentPage: number
  pageSize: number
  business: Business
  templates: MessageTemplate[]
}

export function HistoryClient({ initialLogs, total, currentPage, pageSize, business, templates }: HistoryClientProps) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace, refresh } = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedRequest, setSelectedRequest] = useState<SendLogWithContact | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [isRetrying, setIsRetrying] = useState(false)

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

  // Handle row click to open drawer
  const handleRowClick = (request: SendLogWithContact) => {
    setSelectedRequest(request)
    setDrawerOpen(true)
  }

  // Handle resend from drawer
  const handleResend = async (contactId: string, templateId: string | null) => {
    const formData = new FormData()
    formData.append('contactId', contactId)
    if (templateId) {
      formData.append('templateId', templateId)
    }

    const result = await sendReviewRequest(null, formData)

    if (result.success) {
      toast.success('Message sent successfully!', {
        description: 'The recipient will receive your message shortly.',
        duration: 6000,
      })
      setDrawerOpen(false)
      refresh()
    } else {
      toast.error('Failed to send', {
        description: result.error || 'An error occurred while sending the request.',
        duration: 5000,
      })
    }
  }

  // Handle inline retry from table row — direct resend, no drawer
  const handleInlineRetry = async (request: SendLogWithContact) => {
    setIsRetrying(true)
    try {
      const result = await bulkResendRequests([request.id])
      if (result.success) {
        toast.success('Message resent', {
          description: 'The message has been queued for delivery.',
          duration: 5000,
        })
        setRowSelection({})
        refresh()
      } else {
        toast.error('Failed to resend', {
          description: result.error || 'An error occurred',
          duration: 5000,
        })
      }
    } finally {
      setIsRetrying(false)
    }
  }

  // Handle bulk resend of failed messages
  const selectedCount = Object.keys(rowSelection).length
  const handleBulkResend = async () => {
    const selectedIds = Object.keys(rowSelection)
      .map((index) => initialLogs[Number(index)]?.id)
      .filter(Boolean) as string[]

    if (!selectedIds.length) return

    setIsRetrying(true)
    try {
      const result = await bulkResendRequests(selectedIds)

      if (result.success) {
        toast.success(`Retried ${result.totalSuccess} message${result.totalSuccess !== 1 ? 's' : ''}`, {
          description: result.totalFailed > 0
            ? `${result.totalFailed} failed to resend`
            : 'Messages queued for delivery',
          duration: 6000,
        })
      } else {
        toast.error('Retry failed', {
          description: result.error || 'An error occurred',
          duration: 5000,
        })
      }

      setRowSelection({})
      refresh()
    } finally {
      setIsRetrying(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Send History</h1>
        <p className="text-muted-foreground">
          Track delivery status of your sent messages &middot; {total} total
        </p>
      </div>

      {/* Always show filters if there are logs OR if filters are active */}
      {(hasLogs || hasFilters) && (
        <HistoryFilters />
      )}

      {/* Content */}
      {hasLogs ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              Showing {((currentPage - 1) * pageSize) + 1}-{Math.min(currentPage * pageSize, total)} of {total} message{total !== 1 ? 's' : ''}
            </div>
            {selectedCount > 0 && (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium">
                  {selectedCount} message{selectedCount !== 1 ? 's' : ''} selected
                </span>
                <Button
                  size="sm"
                  onClick={handleBulkResend}
                  disabled={isRetrying}
                >
                  <ArrowClockwise className={`h-4 w-4 mr-1.5 ${isRetrying ? 'animate-spin' : ''}`} />
                  {isRetrying ? 'Retrying...' : 'Retry Selected'}
                </Button>
              </div>
            )}
          </div>
          <HistoryTable
            data={initialLogs}
            onRowClick={handleRowClick}
            onResend={handleInlineRetry}
            rowSelection={rowSelection}
            onRowSelectionChange={setRowSelection}
          />
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

      {/* Detail Drawer */}
      <RequestDetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        request={selectedRequest}
        business={business}
        templates={templates}
        onResend={handleResend}
        onCancel={async () => {
          // Cancel for pending sends is not yet implemented server-side
          setDrawerOpen(false)
        }}
      />
    </div>
  )
}
