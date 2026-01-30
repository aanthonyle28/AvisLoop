import { AppShell } from '@/components/layout/app-shell'
import { getPendingScheduledCount } from '@/lib/data/scheduled'

export default async function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const scheduledCount = await getPendingScheduledCount()

  return <AppShell scheduledCount={scheduledCount}>{children}</AppShell>
}
