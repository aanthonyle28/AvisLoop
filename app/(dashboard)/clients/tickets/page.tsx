import { redirect } from 'next/navigation'
import { getActiveBusiness } from '@/lib/data/active-business'
import { getTicketsAcrossAllProjects } from '@/lib/data/tickets'
import { AllTicketsClient } from '@/components/tickets/all-tickets-client'

export const metadata = {
  title: 'Revision Tickets',
  description: 'Manage revision requests for the active business',
}

export default async function TicketsPage() {
  const activeBusiness = await getActiveBusiness()
  if (!activeBusiness) redirect('/onboarding')

  // Only show tickets for the active business
  const tickets = await getTicketsAcrossAllProjects([activeBusiness.id])

  return (
    <div className="container py-6 space-y-6">
      <AllTicketsClient
        tickets={tickets}
        businesses={[{ id: activeBusiness.id, name: activeBusiness.name }]}
      />
    </div>
  )
}
