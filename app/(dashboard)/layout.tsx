import { AppShell } from '@/components/layout/app-shell'
import { getSetupProgress } from '@/lib/data/onboarding'

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Fetch setup progress for all dashboard pages
  const setupProgress = await getSetupProgress()

  return <AppShell setupProgress={setupProgress}>{children}</AppShell>
}
