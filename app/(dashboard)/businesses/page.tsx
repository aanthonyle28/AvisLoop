import { getActiveBusiness } from '@/lib/data/active-business'
import { getUserBusinessesWithMetadata } from '@/lib/data/businesses'
import { BusinessesClient } from '@/components/businesses/businesses-client'
import { redirect } from 'next/navigation'

export const metadata = {
  title: 'Businesses',
  description: 'Manage your client businesses',
}

export default async function BusinessesPage() {
  const activeBusiness = await getActiveBusiness()
  if (!activeBusiness) redirect('/onboarding')

  const businesses = await getUserBusinessesWithMetadata()

  return (
    <div className="container py-6 space-y-8">
      <BusinessesClient
        businesses={businesses}
        activeBusinessId={activeBusiness.id}
      />
    </div>
  )
}
