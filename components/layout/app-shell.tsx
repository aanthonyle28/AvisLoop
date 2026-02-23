import { Sidebar } from './sidebar'
import { BottomNav } from './bottom-nav'
import { MobileFAB } from './mobile-fab'
import { PageHeader } from './page-header'
import { SkipLink } from './skip-link'
import { NavigationProgressBar } from '@/components/ui/progress-bar'
import { SetupProgress } from '@/components/onboarding/setup-progress'
import type { ChecklistItemId } from '@/lib/constants/checklist'

interface AppShellProps {
  children: React.ReactNode
  pageTitle?: string
  setupProgress?: {
    items: Record<ChecklistItemId, boolean>
    completedCount: number
    allComplete: boolean
    dismissed: boolean
    firstSeenAt: string | null
  } | null
  dashboardBadge?: number
  notificationCounts?: {
    readyToSend: number
    attentionAlerts: number
  }
}

export function AppShell({ children, pageTitle, setupProgress, dashboardBadge, notificationCounts }: AppShellProps) {
  // Don't show setup progress if dismissed or all complete
  const showSetupProgress = setupProgress && !setupProgress.dismissed

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Skip link for keyboard navigation - must be first focusable element */}
      <SkipLink />

      {/* Navigation progress bar */}
      <NavigationProgressBar />

      {/* Desktop sidebar */}
      <Sidebar dashboardBadge={dashboardBadge} notificationCounts={notificationCounts} />

      {/* Main content area */}
      <main id="main-content" className="flex-1 overflow-auto px-4 sm:px-6 lg:px-8">
        {/* Mobile page header */}
        <PageHeader
          title={pageTitle}
          setupProgress={showSetupProgress ? setupProgress : null}
          notificationCounts={notificationCounts}
        />

        {/* Add bottom padding on mobile for bottom nav, remove on desktop */}
        <div className="pb-[72px] md:pb-0">
          {/* Setup progress pill - desktop only, top-right of content */}
          {showSetupProgress && (
            <div className="hidden md:block sticky top-4 z-10 pr-4 sm:pr-6 lg:pr-8">
              <div className="flex justify-end">
                <SetupProgress
                  items={setupProgress.items}
                  completedCount={setupProgress.completedCount}
                  allComplete={setupProgress.allComplete}
                  dismissed={setupProgress.dismissed}
                  firstSeenAt={setupProgress.firstSeenAt}
                />
              </div>
            </div>
          )}
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <BottomNav />

      {/* Mobile FAB for Add Job */}
      <MobileFAB />
    </div>
  )
}
