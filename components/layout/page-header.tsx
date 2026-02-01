"use client"

import Link from 'next/link'
import { UserCircle, ArrowsClockwise } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { AccountMenu } from './account-menu'

interface PageHeaderProps {
  title?: string
}

export function PageHeader({ title }: PageHeaderProps) {
  return (
    <header className="md:hidden h-16 px-4 flex items-center justify-between bg-white dark:bg-card border-b border-[#E2E2E2] dark:border-border">
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
    </header>
  )
}
