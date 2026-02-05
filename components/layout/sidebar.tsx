"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useLocalStorage } from '@/lib/hooks/use-local-storage'
import {
  AddressBook,
  PaperPlaneTilt,
  ClockCounterClockwise,
  UserCircle,
  CaretLeft,
  CaretRight,
  ArrowsClockwise,
  Briefcase,
  Megaphone,
  ChatCircleText,
  House,
  Plus,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { AccountMenu } from './account-menu'

interface NavItem {
  icon: React.ElementType
  label: string
  href: string
  badge?: number
}

const mainNav: NavItem[] = [
  { icon: House, label: 'Dashboard', href: '/dashboard' },
  { icon: PaperPlaneTilt, label: 'Send', href: '/send' },
  { icon: AddressBook, label: 'Customers', href: '/customers' },
  { icon: Briefcase, label: 'Jobs', href: '/jobs' },
  { icon: Megaphone, label: 'Campaigns', href: '/campaigns' },
  { icon: ClockCounterClockwise, label: 'Activity', href: '/history' },
  { icon: ChatCircleText, label: 'Feedback', href: '/feedback' },
]

export function Sidebar({ dashboardBadge }: { dashboardBadge?: number } = {}) {
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

  const NavLink = ({ item }: { item: NavItem }) => {
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
          collapsed && "justify-center px-2",
          item.badge && "relative"
        )}
        title={collapsed ? item.label : undefined}
      >
        <Icon
          size={20}
          weight="regular"
          className={cn(
            "shrink-0",
            isActive ? "text-primary" : ""
          )}
        />
        {!collapsed && <span className="flex-1">{item.label}</span>}
        {!collapsed && item.badge && item.badge > 0 && (
          <span className="ml-auto bg-red-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
            {item.badge > 99 ? '99+' : item.badge}
          </span>
        )}
        {collapsed && item.badge && item.badge > 0 && (
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
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
          <Link href="/send" className="flex items-center gap-2">
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
            item={{
              ...item,
              badge: item.label === 'Dashboard' ? dashboardBadge : undefined,
            }}
          />
        ))}
      </nav>

      {/* Add Job button */}
      <div className="p-3 border-t border-[#E2E2E2] dark:border-border">
        <Link href="/jobs?action=add">
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start gap-2 text-sm",
              collapsed && "justify-center px-2"
            )}
          >
            <Plus size={16} weight="bold" />
            {!collapsed && "Add Job"}
          </Button>
        </Link>
      </div>

      {/* Footer with account dropdown */}
      <div className="p-3 border-t border-[#E2E2E2] dark:border-border">
        <AccountMenu
          side="top"
          align="start"
          trigger={
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 text-foreground/70 dark:text-muted-foreground hover:text-foreground hover:bg-[#F2F2F2]/70 dark:hover:bg-muted/70",
                collapsed && "justify-center px-2"
              )}
            >
              <UserCircle size={20} weight="regular" className="shrink-0" />
              {!collapsed && <span>Account</span>}
            </Button>
          }
        />
      </div>
    </aside>
  )
}
