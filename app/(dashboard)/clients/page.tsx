import { redirect } from 'next/navigation'
import { getActiveBusiness } from '@/lib/data/active-business'
import { getWebDesignClients, getClientMrrSummary } from '@/lib/data/clients'
import { MrrSummaryBar } from '@/components/clients/mrr-summary-bar'
import { ClientsClient } from '@/components/clients/clients-client'

export const metadata = {
  title: 'Clients',
  description: 'Manage your web design clients',
}

export default async function ClientsPage() {
  const activeBusiness = await getActiveBusiness()
  if (!activeBusiness) redirect('/onboarding')

  const [clients, totalMrr] = await Promise.all([
    getWebDesignClients(),
    getClientMrrSummary(),
  ])

  const activeCount = clients.filter((c) => c.status === 'active').length

  return (
    <div className="container py-6 space-y-6">
      <MrrSummaryBar totalMrr={totalMrr} activeCount={activeCount} />
      <ClientsClient clients={clients} />
    </div>
  )
}
