import { randomBytes } from 'crypto'
import { getActiveBusiness } from '@/lib/data/active-business'
import { getUserBusinessesWithMetadata } from '@/lib/data/businesses'
import { BusinessesClient } from '@/components/businesses/businesses-client'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Businesses',
  description: 'Manage your client businesses',
}

export default async function BusinessesPage() {
  const activeBusiness = await getActiveBusiness()
  if (!activeBusiness) redirect('/onboarding')

  const businesses = await getUserBusinessesWithMetadata()

  // Ensure the active business has an intake_token (backfill for existing businesses)
  let intakeToken = activeBusiness.intake_token
  if (!intakeToken) {
    intakeToken = randomBytes(24).toString('base64url')
    const supabase = await createClient()
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
      />
    </div>
  )
}
