"use client"

import Link from 'next/link'
import { UserCircle, ArrowsClockwise } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { AccountMenu } from './account-menu'
import { BusinessSwitcher } from './business-switcher'

interface PageHeaderProps {
  title?: string
}

export function PageHeader({ title }: PageHeaderProps) {
  return (
    <header className="md:hidden bg-card border-b border-border">
      <div className="h-16 px-4 flex items-center gap-3">
        {/* Left side: Page title or logo */}
        <div className="flex items-center gap-2 shrink-0">
          {title ? (
            <h1 className="font-semibold text-lg">{title}</h1>
          ) : (
            <Link href="/dashboard" className="flex items-center gap-2">
              <ArrowsClockwise size={24} weight="regular" className="text-accent" />
              <span className="font-bold text-lg">AvisLoop</span>
            </Link>
          )}
        </div>

        {/* Center: Business context — takes remaining space, truncates gracefully */}
        <div className="flex-1 min-w-0 flex justify-end">
          <BusinessSwitcher />
        </div>

        {/* Right side: Account */}
        <div className="flex items-center shrink-0">
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
    </header>
  )
}
