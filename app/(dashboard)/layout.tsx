import { AppShell } from '@/components/layout/app-shell'
import { AddJobProvider } from '@/components/jobs/add-job-provider'
import { BusinessSettingsProvider } from '@/components/providers/business-settings-provider'
import { getSetupProgress } from '@/lib/data/onboarding'
import { getDashboardCounts } from '@/lib/data/dashboard'
import { getServiceTypeSettings } from '@/lib/data/business'
import type { ServiceType } from '@/lib/types/database'

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Fetch setup progress for all dashboard pages (V2 checklist data)
  const [setupProgress, serviceSettings] = await Promise.all([
    getSetupProgress(),
    getServiceTypeSettings(),
  ])

  const enabledServiceTypes = (serviceSettings?.serviceTypesEnabled || []) as ServiceType[]

  // Get badge count for nav (lightweight query)
  let dashboardBadge = 0
  try {
    const counts = await getDashboardCounts()
    dashboardBadge = counts.total
  } catch {
    // Non-critical, badge just shows 0
  }

  return (
    <BusinessSettingsProvider enabledServiceTypes={enabledServiceTypes}>
      <AddJobProvider>
        <AppShell
          setupProgress={setupProgress}
          dashboardBadge={dashboardBadge}
        >
          {children}
        </AppShell>
      </AddJobProvider>
    </BusinessSettingsProvider>
  )
}
