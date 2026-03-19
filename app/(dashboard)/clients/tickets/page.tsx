import { redirect } from 'next/navigation'
import { getActiveBusiness } from '@/lib/data/active-business'
import { getTicketsAcrossAllProjects } from '@/lib/data/tickets'
import { AllTicketsClient } from '@/components/tickets/all-tickets-client'
import { createClient } from '@/lib/supabase/server'

export const metadata = {
  title: 'Revision Tickets',
  description: 'Manage revision requests for the active business',
}

export default async function TicketsPage() {
  const activeBusiness = await getActiveBusiness()
  if (!activeBusiness) redirect('/onboarding')

  const supabase = await createClient()

  // Fetch tickets and portal token in parallel
  const [tickets, webProjectResult] = await Promise.all([
    getTicketsAcrossAllProjects([activeBusiness.id]),
    supabase
      .from('web_projects')
      .select('portal_token')
      .eq('business_id', activeBusiness.id)
      .maybeSingle(),
  ])

  const portalToken = webProjectResult.data?.portal_token ?? null

  return (
    <div className="container py-6 space-y-6">
      <AllTicketsClient
        tickets={tickets}
        businesses={[{ id: activeBusiness.id, name: activeBusiness.name }]}
        portalToken={portalToken}
      />
    </div>
  )
}
