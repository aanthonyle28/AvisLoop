import { getActiveBusiness } from '@/lib/data/active-business'
import { getBusiness } from '@/lib/data/business'
import { getSendLogs } from '@/lib/data/send-logs'
import { HistoryClient } from '@/components/history/history-client'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Send History',
  description: 'Track delivery status of your sent messages',
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

export default async function HistoryPage(props: HistoryPageProps) {
  const params = await props.searchParams

  const query = params.query || ''
  const status = params.status || ''
  const dateFrom = params.from || ''
  const dateTo = params.to || ''
  const page = Number(params.page) || 1
  const limit = 50

  const activeBusiness = await getActiveBusiness()
  if (!activeBusiness) {
    redirect('/onboarding')
  }

  const businessId = activeBusiness.id

  // Fetch business (for templates in drawer) and send logs in parallel
  const [businessWithTemplates, { logs, total }] = await Promise.all([
    getBusiness(businessId),
    getSendLogs(businessId, {
      query: query || undefined,
      status: status && status !== 'all' ? status : undefined,
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      limit,
      offset: (page - 1) * limit,
    }),
  ])

  if (!businessWithTemplates) {
    redirect('/onboarding')
  }

  return (
    <div className="container py-6 space-y-8">
      <HistoryClient
        initialLogs={logs}
        total={total}
        currentPage={page}
        pageSize={limit}
        business={businessWithTemplates}
        templates={businessWithTemplates.message_templates || []}
      />
    </div>
  )
}
