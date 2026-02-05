import { AppShell } from '@/components/layout/app-shell'
import { getSetupProgress } from '@/lib/data/onboarding'
import { getDashboardCounts } from '@/lib/data/dashboard'

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Fetch setup progress for all dashboard pages
  const setupProgress = await getSetupProgress()

  // Get badge count for nav (lightweight query)
  let dashboardBadge = 0
  try {
    const counts = await getDashboardCounts()
    dashboardBadge = counts.total
  } catch {
    // Non-critical, badge just shows 0
  }

  return (
    <AppShell setupProgress={setupProgress} dashboardBadge={dashboardBadge}>
      {children}
    </AppShell>
  )
}
