"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useLocalStorage } from '@/lib/hooks/use-local-storage'
import {
  SquaresFour,
  AddressBook,
  PaperPlaneTilt,
  CalendarBlank,
  ClockCounterClockwise,
  AppWindow,
  CreditCard,
  Headset,
  UserCircle,
  CaretLeft,
  CaretRight,
  SignOut,
  ArrowsClockwise,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { signOut } from '@/lib/actions/auth'

interface NavItem {
  icon: React.ElementType
  label: string
  href: string
}

const mainNav: NavItem[] = [
  { icon: SquaresFour, label: 'Dashboard', href: '/dashboard' },
  { icon: AddressBook, label: 'Contacts', href: '/contacts' },
  { icon: PaperPlaneTilt, label: 'Send', href: '/send' },
  { icon: CalendarBlank, label: 'Scheduled', href: '/scheduled' },
  { icon: ClockCounterClockwise, label: 'History', href: '/history' },
]

const secondaryNav: NavItem[] = [
  { icon: AppWindow, label: 'Apps', href: '/dashboard/settings' },
  { icon: CreditCard, label: 'Billing', href: '/billing' },
  { icon: Headset, label: 'Help & Support', href: '#' },
  { icon: UserCircle, label: 'Account', href: '/dashboard/settings' },
]

interface SidebarProps {
  scheduledCount?: number
}

export function Sidebar({ scheduledCount = 0 }: SidebarProps) {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useLocalStorage('sidebarCollapsed', false)

  // Auto-collapse on medium screens (tablet), expand on large
  const [autoCollapsed, setAutoCollapsed] = useState(false)

  useEffect(() => {
    // On medium screens (768-1024), auto-collapse. On large (1024+), respect user preference
    if (typeof window !== 'undefined') {
      const handleResize = () => {
        const width = window.innerWidth
        if (width >= 768 && width < 1024) {
          setAutoCollapsed(true)
        } else if (width >= 1024) {
          setAutoCollapsed(false)
        }
      }
      handleResize()
      window.addEventListener('resize', handleResize)
      return () => window.removeEventListener('resize', handleResize)
    }
  }, [])

  const collapsed = autoCollapsed || isCollapsed

  const NavLink = ({ item, count }: { item: NavItem; count?: number }) => {
    const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
    const Icon = item.icon

    return (
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
          isActive
            ? "bg-[#F2F2F2] dark:bg-muted text-foreground"
            : "text-foreground/70 dark:text-muted-foreground hover:bg-[#F2F2F2]/70 dark:hover:bg-muted/70",
          collapsed && "justify-center px-2"
        )}
        title={collapsed ? item.label : undefined}
      >
        <div className="relative">
          <Icon
            size={20}
            weight="regular"
            className={cn(
              "shrink-0",
              isActive ? "text-primary" : ""
            )}
          />
          {/* Collapsed badge indicator - small dot */}
          {collapsed && count !== undefined && count > 0 && (
            <div className="absolute -top-1 -right-1 h-2 w-2 bg-primary rounded-full" />
          )}
        </div>
        {!collapsed && (
          <>
            <span className="flex-1">{item.label}</span>
            {/* Expanded badge with count */}
            {count !== undefined && count > 0 && (
              <Badge variant="secondary" className="ml-auto text-xs px-1.5 py-0">
                {count > 99 ? '99+' : count}
              </Badge>
            )}
          </>
        )}
      </Link>
    )
  }

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-screen bg-white dark:bg-card border-r border-[#E2E2E2] dark:border-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className={cn(
        "flex items-center h-16 px-4 border-b border-[#E2E2E2] dark:border-border",
        collapsed ? "justify-center" : "justify-between"
      )}>
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <ArrowsClockwise size={24} weight="regular" className="text-primary" />
            <span className="font-bold text-lg">AvisLoop</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="shrink-0"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <CaretRight size={16} weight="regular" />
          ) : (
            <CaretLeft size={16} weight="regular" />
          )}
        </Button>
      </div>

      {/* Main navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {mainNav.map((item) => (
          <NavLink
            key={item.href}
            item={item}
            count={item.label === 'Scheduled' ? scheduledCount : undefined}
          />
        ))}

        <div className="my-6" />

        {secondaryNav.map((item) => (
          <NavLink key={item.label} item={item} />
        ))}
      </nav>

      {/* Footer with logout */}
      <div className="p-3 border-t border-[#E2E2E2] dark:border-border">
        <form action={signOut}>
          <Button
            type="submit"
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 text-foreground/70 dark:text-muted-foreground hover:text-foreground hover:bg-[#F2F2F2]/70 dark:hover:bg-muted/70",
              collapsed && "justify-center px-2"
            )}
          >
            <SignOut size={20} weight="regular" className="shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </Button>
        </form>
      </div>
    </aside>
  )
}
