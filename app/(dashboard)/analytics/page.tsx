import { redirect } from 'next/navigation'
import { getBusiness } from '@/lib/data/business'
import { getServiceTypeAnalytics } from '@/lib/data/analytics'
import { ServiceTypeBreakdown } from '@/components/dashboard/analytics-service-breakdown'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Analytics',
}

export default async function AnalyticsPage() {
  const business = await getBusiness()

  if (!business) {
    redirect('/onboarding')
  }

  const analyticsData = await getServiceTypeAnalytics(business.id)

  return (
    <div className="container mx-auto py-6 px-4">
      <h1 className="text-2xl font-bold mb-6">Analytics</h1>
      <ServiceTypeBreakdown data={analyticsData} />
    </div>
  )
}
