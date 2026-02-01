'use client'

import { useSearchParams, usePathname, useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { HistoryTable } from './history-table'
import { HistoryFilters } from './history-filters'
import { EmptyState } from './empty-state'
import { RequestDetailDrawer } from './request-detail-drawer'
import { Button } from '@/components/ui/button'
import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import { sendReviewRequest } from '@/lib/actions/send'
import type { SendLogWithContact, Business, EmailTemplate } from '@/lib/types/database'

interface HistoryClientProps {
  initialLogs: SendLogWithContact[]
  total: number
  currentPage: number
  pageSize: number
  business: Business
  templates: EmailTemplate[]
}

export function HistoryClient({ initialLogs, total, currentPage, pageSize, business, templates }: HistoryClientProps) {
  const searchParams = useSearchParams()
  const pathname = usePathname()
  const { replace, refresh } = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedRequest, setSelectedRequest] = useState<SendLogWithContact | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

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

  // Handle resend from drawer or inline
  const handleResend = async (contactId: string, templateId: string | null) => {
    const formData = new FormData()
    formData.append('contactId', contactId)
    if (templateId) {
      formData.append('templateId', templateId)
    }

    const result = await sendReviewRequest(null, formData)

    if (result.success) {
      toast.success('Review request sent successfully!', {
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

  // Handle quick resend from table row
  const handleQuickResend = (request: SendLogWithContact) => {
    setSelectedRequest(request)
    setDrawerOpen(true)
  }

  // Handle cancel (for pending/scheduled requests)
  const handleCancel = async () => {
    // For now, we'll show a toast - full cancel logic would need a server action
    toast.info('Cancel pending', {
      description: 'Cancellation for pending requests is not yet implemented.',
      duration: 5000,
    })
  }

  // Handle quick cancel from table row
  const handleQuickCancel = (request: SendLogWithContact) => {
    handleCancel(request.id)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Requests</h1>
        <p className="text-muted-foreground mt-1">
          View and manage all your review requests
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
          <HistoryTable
            data={initialLogs}
            onRowClick={handleRowClick}
            onResend={handleQuickResend}
            onCancel={handleQuickCancel}
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
        onCancel={handleCancel}
      />
    </div>
  )
}
