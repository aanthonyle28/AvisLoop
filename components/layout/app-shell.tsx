import { Sidebar } from './sidebar'
import { BottomNav } from './bottom-nav'
import { PageHeader } from './page-header'
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
}

export function AppShell({ children, pageTitle, setupProgress }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-[#F9F9F9] dark:bg-background">
      {/* Navigation progress bar */}
      <NavigationProgressBar />

      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content area */}
      <main className="flex-1 overflow-auto">
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
    </div>
  )
}
