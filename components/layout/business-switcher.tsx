"use client"

import { useTransition } from 'react'
import { CaretUpDown, Check } from '@phosphor-icons/react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useBusinessSettings } from '@/components/providers/business-settings-provider'
import { switchBusiness } from '@/lib/actions/active-business'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export function BusinessSwitcher() {
  const { businesses, businessId, businessName } = useBusinessSettings()
  const [isPending, startTransition] = useTransition()

  // Single-business: plain text only, no interactive affordance
  if (businesses.length <= 1) {
    return (
      <span className="text-sm font-medium text-foreground truncate block">
        {businessName}
      </span>
    )
  }

  function handleSelect(id: string) {
    if (id === businessId || isPending) return
    startTransition(async () => {
      const result = await switchBusiness(id)
      if (result?.error) {
        toast.error('Failed to switch business')
      }
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-1.5 w-full text-left rounded-md px-1 py-1 text-sm font-medium",
            "hover:bg-secondary/70 dark:hover:bg-muted/70 transition-colors",
            isPending && "opacity-60 pointer-events-none"
          )}
          aria-label={`Current business: ${businessName}. Click to switch.`}
        >
          <span className="flex-1 truncate">{businessName}</span>
          <CaretUpDown size={14} className="text-muted-foreground shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-56">
        {businesses.map((biz) => (
          <DropdownMenuItem
            key={biz.id}
            onSelect={() => handleSelect(biz.id)}
            className="flex items-center justify-between gap-2 cursor-pointer"
          >
            <span className="truncate">{biz.name}</span>
            {biz.id === businessId && (
              <Check size={14} className="text-accent shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
