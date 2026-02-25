import { Sidebar } from './sidebar'
import { BottomNav } from './bottom-nav'
import { MobileFAB } from './mobile-fab'
import { PageHeader } from './page-header'
import { SkipLink } from './skip-link'
import { NavigationProgressBar } from '@/components/ui/progress-bar'

interface AppShellProps {
  children: React.ReactNode
  pageTitle?: string
  dashboardBadge?: number
}

export function AppShell({ children, pageTitle, dashboardBadge }: AppShellProps) {
  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Skip link for keyboard navigation - must be first focusable element */}
      <SkipLink />

      {/* Navigation progress bar */}
      <NavigationProgressBar />

      {/* Desktop sidebar */}
      <Sidebar dashboardBadge={dashboardBadge} />

      {/* Main content area — flex column so children can fill height for independent scrolling */}
      <main id="main-content" className="flex-1 flex flex-col min-h-0">
        {/* Mobile page header */}
        <PageHeader title={pageTitle} />

        {/* Content wrapper — scrolls by default, but pages like Dashboard can fill it with h-full.
            Horizontal padding here so the dashboard right panel can sit flush to the edge. */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 lg:px-8 pb-[72px] md:pb-0">
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
