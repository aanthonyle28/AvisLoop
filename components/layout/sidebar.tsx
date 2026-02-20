"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useLocalStorage } from '@/lib/hooks/use-local-storage'
import {
  AddressBook,
  ClockCounterClockwise,
  UserCircle,
  CaretLeft,
  CaretRight,
  ArrowsClockwise,
  Briefcase,
  Megaphone,
  ChatCircleText,
  ChartBar,
  House,
  Plus,
} from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { AccountMenu } from './account-menu'
import { NotificationBell } from './notification-bell'

interface NavItem {
  icon: React.ElementType
  label: string
  href: string
  badge?: number
}

const mainNav: NavItem[] = [
  { icon: House, label: 'Dashboard', href: '/dashboard' },
  { icon: Briefcase, label: 'Jobs', href: '/jobs' },
  { icon: Megaphone, label: 'Campaigns', href: '/campaigns' },
  { icon: ChartBar, label: 'Analytics', href: '/analytics' },
  { icon: AddressBook, label: 'Customers', href: '/customers' },
  { icon: ClockCounterClockwise, label: 'Activity', href: '/history' },
  { icon: ChatCircleText, label: 'Feedback', href: '/feedback' },
]

interface SidebarProps {
  dashboardBadge?: number
  notificationCounts?: {
    readyToSend: number
    attentionAlerts: number
  }
}

export function Sidebar({ notificationCounts }: SidebarProps = {}) {
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
            ? "bg-secondary dark:bg-muted text-foreground border-l-2 border-accent"
            : "text-foreground/70 dark:text-muted-foreground hover:bg-secondary/70 dark:hover:bg-muted/70 border-l-2 border-transparent",
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
            isActive ? "text-accent" : ""
          )}
        />
        {!collapsed && <span className="flex-1">{item.label}</span>}
        {!collapsed && item.badge && item.badge > 0 && (
          <span className="ml-auto bg-destructive text-destructive-foreground text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
            {item.badge > 99 ? '99+' : item.badge}
          </span>
        )}
        {collapsed && item.badge && item.badge > 0 && (
          <span className="absolute top-0 right-0 w-2 h-2 bg-destructive rounded-full" />
        )}
      </Link>
    )
  }

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-screen bg-card border-r border-border transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className={cn(
        "flex items-center h-16 px-4 border-b border-border",
        collapsed ? "justify-center" : "justify-between"
      )}>
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <ArrowsClockwise size={24} weight="regular" className="text-accent" />
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
              badge: undefined,
            }}
          />
        ))}
      </nav>

      {/* Add Job button - V2: Primary variant to emphasize core action */}
      <div className="p-3 border-t border-border">
        <Link href="/jobs?action=add">
          <Button
            variant="default"
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

      {/* Footer with notifications and account */}
      <div className="p-3 border-t border-border space-y-1">
        {notificationCounts && (
          <NotificationBell
            readyToSend={notificationCounts.readyToSend}
            attentionAlerts={notificationCounts.attentionAlerts}
            collapsed={collapsed}
          />
        )}
        <AccountMenu
          side="top"
          align={collapsed ? "center" : "start"}
          trigger={
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 text-foreground/70 dark:text-muted-foreground hover:text-foreground hover:bg-secondary/70 dark:hover:bg-muted/70",
                collapsed && "justify-center px-2"
              )}
            >
              <span className="shrink-0 w-5 h-5 flex items-center justify-center">
                <UserCircle size={22} weight="regular" />
              </span>
              {!collapsed && <span>Account</span>}
            </Button>
          }
        />
      </div>
    </aside>
  )
}
