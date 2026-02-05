"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { PaperPlaneTilt, ClockCounterClockwise, House, Briefcase, Megaphone } from '@phosphor-icons/react'

const NAV_HEIGHT = 72 // 4.5rem in pixels

const items = [
  { icon: House, label: 'Dashboard', href: '/dashboard' },
  { icon: PaperPlaneTilt, label: 'Send', href: '/send' },
  { icon: Briefcase, label: 'Jobs', href: '/jobs' },
  { icon: Megaphone, label: 'Campaigns', href: '/campaigns' },
  { icon: ClockCounterClockwise, label: 'Activity', href: '/history' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-t"
      style={{ height: `${NAV_HEIGHT}px` }}
      aria-label="Mobile navigation"
    >
      <div className="grid grid-cols-5 h-full">
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon size={20} weight="regular" />
              <span>{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

// Export height constant for use in layouts
export const BOTTOM_NAV_HEIGHT = NAV_HEIGHT
