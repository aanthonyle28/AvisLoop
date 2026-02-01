import { Suspense } from 'react'
import { getSendLogs } from '@/lib/data/send-logs'
import { HistoryClient } from '@/components/history/history-client'

export const metadata = {
  title: 'Message History',
  description: 'View and track all your sent review requests',
}

interface HistoryPageProps {
  searchParams: Promise<{
    query?: string
    status?: string
    from?: string
    to?: string
    page?: string
  }>
}

async function HistoryContent({ searchParams }: HistoryPageProps) {
  const params = await searchParams

  const query = params.query || ''
  const status = params.status || ''
  const dateFrom = params.from || ''
  const dateTo = params.to || ''
  const page = Number(params.page) || 1
  const limit = 50

  const { logs, total } = await getSendLogs({
    query: query || undefined,
    status: status && status !== 'all' ? status : undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    limit,
    offset: (page - 1) * limit,
  })

  return <HistoryClient initialLogs={logs} total={total} currentPage={page} pageSize={limit} />
}

export default async function HistoryPage(props: HistoryPageProps) {
  return (
    <div className="container py-6">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-16">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
              <p className="mt-4 text-muted-foreground">Loading message history...</p>
            </div>
          </div>
        }
      >
        <HistoryContent searchParams={props.searchParams} />
      </Suspense>
    </div>
  )
}
