import { redirect } from 'next/navigation'
import { getActiveBusiness } from '@/lib/data/active-business'
import { getUserBusinessesWithMetadata } from '@/lib/data/businesses'
import { getTicketsAcrossAllProjects } from '@/lib/data/tickets'
import { AllTicketsClient } from '@/components/tickets/all-tickets-client'
import type { Business } from '@/lib/types/database'

export const metadata = {
  title: 'All Revision Tickets',
  description: 'View revision tickets across all web design clients',
}

export default async function AllTicketsPage() {
  const activeBusiness = await getActiveBusiness()
  if (!activeBusiness) redirect('/onboarding')

  // Get all businesses for this user
  const allBusinesses = await getUserBusinessesWithMetadata()

  // Filter to web design businesses (client_type 'web_design' or 'both')
  const webDesignBusinesses = allBusinesses.filter(
    (b: Business) =>
      b.client_type === 'web_design' || b.client_type === 'both'
  )

  const businessIds = webDesignBusinesses.map((b) => b.id)

  // Fetch all tickets across web design businesses
  const tickets = await getTicketsAcrossAllProjects(businessIds)

  // Build minimal business list for client filter dropdown
  const businesses = webDesignBusinesses.map((b) => ({
    id: b.id,
    name: b.name,
  }))

  return (
    <div className="container py-6 space-y-6">
      <AllTicketsClient tickets={tickets} businesses={businesses} />
    </div>
  )
}
