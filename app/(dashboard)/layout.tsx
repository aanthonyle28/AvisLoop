import { AppShell } from '@/components/layout/app-shell'
import { AddJobProvider } from '@/components/jobs/add-job-provider'
import { BusinessSettingsProvider } from '@/components/providers/business-settings-provider'
import { getDashboardCounts } from '@/lib/data/dashboard'
import { getServiceTypeSettings } from '@/lib/data/business'
import { getActiveBusiness, getUserBusinesses } from '@/lib/data/active-business'
import { createClient } from '@/lib/supabase/server'
import type { ServiceType } from '@/lib/types/database'

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [business, businesses] = await Promise.all([
    getActiveBusiness(),
    getUserBusinesses(),
  ])

  const businessId = business?.id ?? ''
  const businessName = business?.name ?? ''

  // Fetch service settings and badge count in parallel (only if business exists)
  let enabledServiceTypes: ServiceType[] = []
  let customServiceNames: string[] = []
  let dashboardBadge = 0
  let ticketBadge = 0

  if (business) {
    const supabase = await createClient()
    const [serviceSettings, counts, ticketCountResult] = await Promise.all([
      getServiceTypeSettings(business.id),
      getDashboardCounts(business.id).catch(() => ({ total: 0 })),
      supabase
        .from('project_tickets')
        .select('id', { count: 'exact', head: true })
        .eq('business_id', business.id)
        .in('status', ['open', 'submitted', 'in_progress'])
        .then(({ count }) => count ?? 0),
    ])
    enabledServiceTypes = (serviceSettings?.serviceTypesEnabled || []) as ServiceType[]
    customServiceNames = serviceSettings?.customServiceNames || []
    dashboardBadge = counts.total
    ticketBadge = ticketCountResult
  }

  return (
    <BusinessSettingsProvider
      enabledServiceTypes={enabledServiceTypes}
      customServiceNames={customServiceNames}
      businessId={businessId}
      businessName={businessName}
      businesses={businesses}
    >
      <AddJobProvider>
        <AppShell dashboardBadge={dashboardBadge} ticketBadge={ticketBadge}>
          {children}
        </AppShell>
      </AddJobProvider>
    </BusinessSettingsProvider>
  )
}
