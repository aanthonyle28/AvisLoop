import { Suspense } from 'react'
import { AppShell } from '@/components/layout/app-shell'
import { getPendingScheduledCount } from '@/lib/data/scheduled'

async function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
  const scheduledCount = await getPendingScheduledCount()
  return <AppShell scheduledCount={scheduledCount}>{children}</AppShell>
}

export default function DashboardGroupLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Suspense fallback={<AppShell scheduledCount={0}>{children}</AppShell>}>
      <DashboardLayoutInner>{children}</DashboardLayoutInner>
    </Suspense>
  )
}
