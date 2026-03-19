import { randomBytes } from 'crypto'
import { getActiveBusiness } from '@/lib/data/active-business'
import { getUserBusinessesWithMetadata } from '@/lib/data/businesses'
import { BusinessesClient } from '@/components/businesses/businesses-client'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { WebProject } from '@/lib/types/database'

export const metadata = {
  title: 'Businesses',
  description: 'Manage your client businesses',
}

export default async function BusinessesPage() {
  const activeBusiness = await getActiveBusiness()
  if (!activeBusiness) redirect('/onboarding')

  const businesses = await getUserBusinessesWithMetadata()

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

  // Ensure the active business has an intake_token (backfill for existing businesses)
  let intakeToken = activeBusiness.intake_token
  if (!intakeToken) {
    intakeToken = randomBytes(24).toString('base64url')
    await supabase
      .from('businesses')
      .update({ intake_token: intakeToken })
      .eq('id', activeBusiness.id)
  }

  return (
    <div className="container py-6 space-y-8">
      <BusinessesClient
        businesses={businesses}
        activeBusinessId={activeBusiness.id}
        intakeToken={intakeToken}
        webProjectMap={webProjectMap}
      />
    </div>
  )
}
