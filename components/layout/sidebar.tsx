"use client"

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { useLocalStorage } from '@/lib/hooks/use-local-storage'
import { useIsDesktop } from '@/lib/hooks/use-media-query'
import {
  LayoutDashboard,
  Users,
  Send,
  History,
  Settings,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  LogOut,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { signOut } from '@/lib/actions/auth'

interface NavItem {
  icon: React.ElementType
  label: string
  href: string
}

const mainNav: NavItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
  { icon: Users, label: 'Contacts', href: '/contacts' },
  { icon: Send, label: 'Send', href: '/send' },
  { icon: History, label: 'History', href: '/history' },
]

const secondaryNav: NavItem[] = [
  { icon: CreditCard, label: 'Billing', href: '/billing' },
  { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
]

export function Sidebar() {
  const pathname = usePathname()
  const isDesktop = useIsDesktop()
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
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
          "hover:bg-accent hover:text-accent-foreground",
          isActive
            ? "bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground"
            : "text-muted-foreground",
          collapsed && "justify-center px-2"
        )}
        title={collapsed ? item.label : undefined}
      >
        <Icon className="h-5 w-5 shrink-0" />
        {!collapsed && <span>{item.label}</span>}
      </Link>
    )
  }

  return (
    <aside
      className={cn(
        "hidden md:flex flex-col h-screen bg-card border-r transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Header */}
      <div className={cn(
        "flex items-center h-16 px-4 border-b",
        collapsed ? "justify-center" : "justify-between"
      )}>
        {!collapsed && (
          <Link href="/dashboard" className="flex items-center gap-2">
            <span className="font-bold text-lg text-primary">AvisLoop</span>
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
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Main navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {!collapsed && (
          <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Main
          </p>
        )}
        {mainNav.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}

        <Separator className="my-4" />

        {!collapsed && (
          <p className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Account
          </p>
        )}
        {secondaryNav.map((item) => (
          <NavLink key={item.href} item={item} />
        ))}
      </nav>

      {/* Footer with logout - using inline form instead of LogoutButton for styling flexibility */}
      <div className="p-3 border-t">
        <form action={signOut}>
          <Button
            type="submit"
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 text-muted-foreground hover:text-foreground",
              collapsed && "justify-center px-2"
            )}
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Sign out</span>}
          </Button>
        </form>
      </div>
    </aside>
  )
}
