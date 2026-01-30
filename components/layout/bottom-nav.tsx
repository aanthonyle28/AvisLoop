"use client"

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { SquaresFour, AddressBook, PaperPlaneTilt, CalendarBlank, ClockCounterClockwise } from '@phosphor-icons/react'

const NAV_HEIGHT = 72 // 4.5rem in pixels

const items = [
  { icon: SquaresFour, label: 'Dashboard', href: '/dashboard' },
  { icon: AddressBook, label: 'Contacts', href: '/contacts' },
  { icon: PaperPlaneTilt, label: 'Send', href: '/send' },
  { icon: CalendarBlank, label: 'Scheduled', href: '/scheduled' },
  { icon: ClockCounterClockwise, label: 'History', href: '/history' },
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
          const count = item.label === 'Scheduled' ? scheduledCount : 0

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
                <Icon size={20} weight="regular" />
                {count > 0 && (
                  <span className="absolute -top-1.5 -right-2.5 flex items-center justify-center min-w-[16px] h-4 px-1 text-[10px] font-bold text-primary-foreground bg-primary rounded-full">
                    {count > 9 ? '9+' : count}
                  </span>
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
