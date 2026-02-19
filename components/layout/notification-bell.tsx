"use client"

import Link from 'next/link'
import { Bell, Briefcase, WarningCircle, CheckCircle } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

interface NotificationBellProps {
  readyToSend: number
  attentionAlerts: number
  className?: string
  /** When true, renders as icon-only centered button (for collapsed sidebar) */
  collapsed?: boolean
}

export function NotificationBell({
  readyToSend,
  attentionAlerts,
  className,
  collapsed = false,
}: NotificationBellProps) {
  const total = readyToSend + attentionAlerts
  const hasNotifications = total > 0

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "w-full justify-start gap-3 text-foreground/70 dark:text-muted-foreground hover:text-foreground hover:bg-secondary/70 dark:hover:bg-muted/70",
            collapsed && "justify-center px-2",
            className
          )}
          aria-label={
            hasNotifications
              ? `${total} notification${total !== 1 ? 's' : ''}`
              : "No notifications"
          }
        >
          <div className="relative shrink-0 w-5 h-5 flex items-center justify-center">
            <Bell size={20} weight="regular" />
            {hasNotifications && (
              <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
                {total > 9 ? '9+' : total}
              </span>
            )}
          </div>
          {!collapsed && <span>Notifications</span>}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel className="font-semibold">
          Notifications
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        {!hasNotifications ? (
          <div className="py-6 text-center">
            <CheckCircle
              size={32}
              weight="regular"
              className="mx-auto mb-2 text-green-500"
            />
            <p className="text-sm font-medium text-foreground">All caught up</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Your automation is running smoothly
            </p>
          </div>
        ) : (
          <>
            {readyToSend > 0 && (
              <DropdownMenuItem asChild>
                <Link
                  href="/dashboard#ready-to-send-queue"
                  className="flex items-start gap-3 py-3 cursor-pointer"
                >
                  <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-1.5 mt-0.5">
                    <Briefcase
                      size={14}
                      weight="fill"
                      className="text-blue-600 dark:text-blue-400"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {readyToSend} job{readyToSend !== 1 ? 's' : ''} ready to enroll
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Completed jobs awaiting campaign enrollment
                    </p>
                  </div>
                </Link>
              </DropdownMenuItem>
            )}

            {attentionAlerts > 0 && (
              <DropdownMenuItem asChild>
                <Link
                  href="/dashboard#attention-alerts"
                  className="flex items-start gap-3 py-3 cursor-pointer"
                >
                  <div className="rounded-full bg-amber-100 dark:bg-amber-900/30 p-1.5 mt-0.5">
                    <WarningCircle
                      size={14}
                      weight="fill"
                      className="text-amber-600 dark:text-amber-400"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">
                      {attentionAlerts} alert{attentionAlerts !== 1 ? 's' : ''} need attention
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Failed sends or unresolved feedback
                    </p>
                  </div>
                </Link>
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link
                href="/dashboard"
                className="justify-center text-xs text-muted-foreground hover:text-foreground cursor-pointer"
              >
                View dashboard
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
