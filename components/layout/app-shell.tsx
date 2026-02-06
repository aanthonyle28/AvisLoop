import { Sidebar } from './sidebar'
import { BottomNav } from './bottom-nav'
import { MobileFAB } from './mobile-fab'
import { PageHeader } from './page-header'
import { SkipLink } from './skip-link'
import { NavigationProgressBar } from '@/components/ui/progress-bar'
import { SetupProgress } from '@/components/onboarding/setup-progress'

interface AppShellProps {
  children: React.ReactNode
  pageTitle?: string
  setupProgress?: {
    hasContact: boolean
    hasReviewLink: boolean
    hasTemplate: boolean
    hasSent: boolean
    contactCount: number
    isAllComplete: boolean
  } | null
  dashboardBadge?: number
}

export function AppShell({ children, pageTitle, setupProgress, dashboardBadge }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-[#F9F9F9] dark:bg-background">
      {/* Skip link for keyboard navigation - must be first focusable element */}
      <SkipLink />

      {/* Navigation progress bar */}
      <NavigationProgressBar />

      {/* Desktop sidebar */}
      <Sidebar dashboardBadge={dashboardBadge} />

      {/* Main content area */}
      <main id="main-content" className="flex-1 overflow-auto">
        {/* Mobile page header */}
        <PageHeader title={pageTitle} setupProgress={setupProgress} />

        {/* Add bottom padding on mobile for bottom nav, remove on desktop */}
        <div className="pb-[72px] md:pb-0">
          {/* Setup progress pill - desktop only, top-right of content */}
          {setupProgress && !setupProgress.isAllComplete && (
            <div className="hidden md:block sticky top-4 z-10 pr-4 sm:pr-6 lg:pr-8">
              <div className="flex justify-end">
                <SetupProgress
                  contactCount={setupProgress.contactCount}
                  hasReviewLink={setupProgress.hasReviewLink}
                  hasTemplate={setupProgress.hasTemplate}
                  hasContact={setupProgress.hasContact}
                  hasSent={setupProgress.hasSent}
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
