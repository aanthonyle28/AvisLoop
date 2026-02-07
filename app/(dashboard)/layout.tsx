import { AppShell } from '@/components/layout/app-shell'
import { getSetupProgress } from '@/lib/data/onboarding'
import { getDashboardCounts } from '@/lib/data/dashboard'

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Fetch setup progress for all dashboard pages (V2 checklist data)
  const setupProgress = await getSetupProgress()

  // Get badge count for nav and notification bell (lightweight query)
  let dashboardBadge = 0
  let notificationCounts = { readyToSend: 0, attentionAlerts: 0 }
  try {
    const counts = await getDashboardCounts()
    dashboardBadge = counts.total
    notificationCounts = {
      readyToSend: counts.readyToSend,
      attentionAlerts: counts.attentionAlerts,
    }
  } catch {
    // Non-critical, badge just shows 0
  }

  return (
    <AppShell
      setupProgress={setupProgress}
      dashboardBadge={dashboardBadge}
      notificationCounts={notificationCounts}
    >
      {children}
    </AppShell>
  )
}
