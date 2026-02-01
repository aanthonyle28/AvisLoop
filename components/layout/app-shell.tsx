import { Sidebar } from './sidebar'
import { BottomNav } from './bottom-nav'
import { PageHeader } from './page-header'

interface AppShellProps {
  children: React.ReactNode
  pageTitle?: string
}

export function AppShell({ children, pageTitle }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-[#F9F9F9] dark:bg-background">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content area */}
      <main className="flex-1 overflow-auto">
        {/* Mobile page header */}
        <PageHeader title={pageTitle} />

        {/* Add bottom padding on mobile for bottom nav, remove on desktop */}
        <div className="pb-[72px] md:pb-0">
          {children}
        </div>
      </main>

      {/* Mobile bottom nav */}
      <BottomNav />
    </div>
  )
}
