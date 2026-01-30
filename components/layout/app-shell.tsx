import { Sidebar } from './sidebar'
import { BottomNav } from './bottom-nav'

interface AppShellProps {
  children: React.ReactNode
  scheduledCount?: number
}

export function AppShell({ children, scheduledCount }: AppShellProps) {
  return (
    <div className="flex min-h-screen bg-[#F9F9F9] dark:bg-background">
      {/* Desktop sidebar */}
      <Sidebar scheduledCount={scheduledCount} />

      {/* Main content area */}
      <main className="flex-1 overflow-auto">
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
