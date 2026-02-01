"use client"

import Link from 'next/link'
import {
  AppWindow,
  GearSix,
  CreditCard,
  Headset,
  SignOut,
} from '@phosphor-icons/react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { signOut } from '@/lib/actions/auth'

interface AccountMenuProps {
  trigger: React.ReactNode
  side?: 'top' | 'bottom' | 'left' | 'right'
  align?: 'start' | 'center' | 'end'
}

export function AccountMenu({ trigger, side = 'top', align = 'start' }: AccountMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {trigger}
      </DropdownMenuTrigger>
      <DropdownMenuContent side={side} align={align} className="w-56">
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings" className="flex items-center gap-2 cursor-pointer">
            <AppWindow size={16} weight="regular" />
            <span>Apps / Integrations</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/dashboard/settings" className="flex items-center gap-2 cursor-pointer">
            <GearSix size={16} weight="regular" />
            <span>Settings</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href="/billing" className="flex items-center gap-2 cursor-pointer">
            <CreditCard size={16} weight="regular" />
            <span>Billing</span>
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem disabled className="flex items-center gap-2">
          <Headset size={16} weight="regular" />
          <span>Help & Support</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <form action={signOut} className="w-full">
            <button type="submit" className="flex items-center gap-2 w-full cursor-pointer">
              <SignOut size={16} weight="regular" />
              <span>Logout</span>
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
