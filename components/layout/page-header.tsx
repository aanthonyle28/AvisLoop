"use client"

import Link from 'next/link'
import { UserCircle, ArrowsClockwise } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { AccountMenu } from './account-menu'
import { NotificationBell } from './notification-bell'
import { SetupProgress } from '@/components/onboarding/setup-progress'
import type { ChecklistItemId } from '@/lib/constants/checklist'

interface PageHeaderProps {
  title?: string
  setupProgress?: {
    items: Record<ChecklistItemId, boolean>
    completedCount: number
    allComplete: boolean
    dismissed: boolean
    firstSeenAt: string | null
  } | null
  notificationCounts?: {
    readyToSend: number
    attentionAlerts: number
  }
}

export function PageHeader({ title, setupProgress, notificationCounts }: PageHeaderProps) {
  return (
    <header className="md:hidden bg-white dark:bg-card border-b border-[#E2E2E2] dark:border-border">
      <div className="h-16 px-4 flex items-center justify-between">
        {/* Left side: Page title or logo */}
        <div className="flex items-center gap-2">
          {title ? (
            <h1 className="font-semibold text-lg">{title}</h1>
          ) : (
            <Link href="/dashboard" className="flex items-center gap-2">
              <ArrowsClockwise size={24} weight="regular" className="text-primary" />
              <span className="font-bold text-lg">AvisLoop</span>
            </Link>
          )}
        </div>

        {/* Right side: Notifications + Account */}
        <div className="flex items-center gap-1">
          {notificationCounts && (
            <NotificationBell
              readyToSend={notificationCounts.readyToSend}
              attentionAlerts={notificationCounts.attentionAlerts}
            />
          )}
          <AccountMenu
            side="bottom"
            align="end"
            trigger={
              <Button variant="ghost" size="icon-sm" aria-label="Account menu">
                <UserCircle size={24} weight="regular" />
              </Button>
            }
          />
        </div>
      </div>

      {/* Setup progress pill - mobile only, below header */}
      {setupProgress && !setupProgress.allComplete && (
        <div className="px-4 pb-3 flex justify-center">
          <SetupProgress
            items={setupProgress.items}
            completedCount={setupProgress.completedCount}
            allComplete={setupProgress.allComplete}
            dismissed={setupProgress.dismissed}
            firstSeenAt={setupProgress.firstSeenAt}
          />
        </div>
      )}
    </header>
  )
}
