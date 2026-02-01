"use client"

import Link from 'next/link'
import { UserCircle, ArrowsClockwise } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { AccountMenu } from './account-menu'
import { SetupProgress } from '@/components/onboarding/setup-progress'

interface PageHeaderProps {
  title?: string
  setupProgress?: {
    hasContact: boolean
    hasReviewLink: boolean
    hasTemplate: boolean
    hasSent: boolean
    contactCount: number
    isAllComplete: boolean
  } | null
}

export function PageHeader({ title, setupProgress }: PageHeaderProps) {
  return (
    <header className="md:hidden bg-white dark:bg-card border-b border-[#E2E2E2] dark:border-border">
      <div className="h-16 px-4 flex items-center justify-between">
        {/* Left side: Page title or logo */}
        <div className="flex items-center gap-2">
          {title ? (
            <h1 className="font-semibold text-lg">{title}</h1>
          ) : (
            <Link href="/send" className="flex items-center gap-2">
              <ArrowsClockwise size={24} weight="regular" className="text-primary" />
              <span className="font-bold text-lg">AvisLoop</span>
            </Link>
          )}
        </div>

        {/* Right side: Account button */}
        <AccountMenu
          side="bottom"
          align="end"
          trigger={
            <Button variant="ghost" size="icon-sm">
              <UserCircle size={24} weight="regular" />
            </Button>
          }
        />
      </div>

      {/* Setup progress pill - mobile only, below header */}
      {setupProgress && !setupProgress.isAllComplete && (
        <div className="px-4 pb-3 flex justify-center">
          <SetupProgress
            contactCount={setupProgress.contactCount}
            hasReviewLink={setupProgress.hasReviewLink}
            hasTemplate={setupProgress.hasTemplate}
            hasContact={setupProgress.hasContact}
            hasSent={setupProgress.hasSent}
          />
        </div>
      )}
    </header>
  )
}
