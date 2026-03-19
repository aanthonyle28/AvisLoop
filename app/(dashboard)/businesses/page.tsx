import { randomBytes } from 'crypto'
import { getActiveBusiness } from '@/lib/data/active-business'
import { getUserBusinessesWithMetadata } from '@/lib/data/businesses'
import { BusinessesClient } from '@/components/businesses/businesses-client'
import { createClient } from '@/lib/supabase/server'
import type { WebProject } from '@/lib/types/database'

export const metadata = {
  title: 'Businesses',
  description: 'Manage your client businesses',
}

export default async function BusinessesPage() {
  // Don't redirect on null — this page shows ALL businesses and must remain
  // accessible even if the active-business cookie is stale or missing.
  const activeBusiness = await getActiveBusiness()

  const businesses = await getUserBusinessesWithMetadata()

  // If the user truly has no businesses, redirect to onboarding
  if (businesses.length === 0) {
    const { redirect } = await import('next/navigation')
    redirect('/onboarding')
  }

  // Fetch web projects for all businesses (for web_design/both client types)
  const supabase = await createClient()
  const businessIds = businesses.map((b) => b.id)
  const { data: webProjects } = await supabase
    .from('web_projects')
    .select('*')
    .in('business_id', businessIds)

  // Build a map of businessId -> WebProject
  const webProjectMap: Record<string, WebProject> = {}
  if (webProjects) {
    for (const wp of webProjects) {
      webProjectMap[wp.business_id] = wp as WebProject
    }
  }

  // Fetch open ticket counts per project for web design businesses
  const projectIds = webProjects?.map((wp) => wp.id) ?? []
  const ticketCountMap: Record<string, number> = {}
  if (projectIds.length > 0) {
    const { data: ticketCounts } = await supabase
      .from('project_tickets')
      .select('project_id')
      .in('project_id', projectIds)
      .in('status', ['open', 'submitted', 'in_progress'])
    if (ticketCounts) {
      for (const t of ticketCounts) {
        const bizId = webProjects?.find((wp) => wp.id === t.project_id)?.business_id
        if (bizId) ticketCountMap[bizId] = (ticketCountMap[bizId] || 0) + 1
      }
    }
  }

  // Use active business if available, otherwise use the first business
  const effectiveBusiness = activeBusiness ?? businesses[0]

  // Ensure the effective business has an intake_token (backfill for existing businesses)
  let intakeToken = effectiveBusiness.intake_token
  if (!intakeToken) {
    intakeToken = randomBytes(24).toString('base64url')
    await supabase
      .from('businesses')
      .update({ intake_token: intakeToken })
      .eq('id', effectiveBusiness.id)
  }

  return (
    <div className="container py-6 space-y-8">
      <BusinessesClient
        businesses={businesses}
        activeBusinessId={effectiveBusiness.id}
        intakeToken={intakeToken}
        webProjectMap={webProjectMap}
        ticketCountMap={ticketCountMap}
      />
    </div>
  )
}
