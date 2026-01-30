"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { LayoutDashboard, Users, Send, Calendar, History } from 'lucide-react'

const NAV_HEIGHT = 72 // 4.5rem in pixels

const items = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Users, label: 'Contacts', href: '/contacts' },
  { icon: Send, label: 'Send', href: '/send' },
  { icon: Calendar, label: 'Scheduled', href: '/scheduled' },
  { icon: History, label: 'History', href: '/history' },
]

interface BottomNavProps {
  scheduledCount?: number
}

export function BottomNav({ scheduledCount = 0 }: BottomNavProps) {
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
          const showBadge = item.label === 'Scheduled' && scheduledCount > 0

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
              <div className="relative">
                <Icon className="h-5 w-5" />
                {/* Badge indicator for scheduled items */}
                {showBadge && (
                  <div className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-primary text-primary-foreground text-[10px] font-bold rounded-full flex items-center justify-center">
                    {scheduledCount > 9 ? '9+' : scheduledCount}
                  </div>
                )}
              </div>
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
