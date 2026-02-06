'use client'

import { useRouter, usePathname } from 'next/navigation'
import { Plus } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

// Pages where FAB should be hidden (Jobs page has header button)
const HIDDEN_ON_PATHS = ['/jobs']

export function MobileFAB() {
  const router = useRouter()
  const pathname = usePathname()

  // Hide on certain pages or when path matches
  const shouldHide = HIDDEN_ON_PATHS.some(p => pathname.startsWith(p))

  if (shouldHide) return null

  const handleClick = () => {
    router.push('/jobs?action=add')
  }

  return (
    <button
      onClick={handleClick}
      aria-label="Add Job"
      className={cn(
        // Positioning: fixed bottom-right, above bottom nav (72px + 8px margin)
        "fixed bottom-20 right-4 z-50",
        // Size: 56x56px (iOS standard, exceeds 44px minimum)
        "h-14 w-14",
        // Styling
        "rounded-full bg-primary text-primary-foreground shadow-lg",
        // States
        "hover:bg-primary/90 active:scale-95",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        // Responsive: hide on desktop (sidebar has Add Job button)
        "md:hidden",
        // Transition
        "transition-all duration-200"
      )}
    >
      <div className="flex h-full w-full items-center justify-center">
        <Plus size={24} weight="bold" />
      </div>
    </button>
  )
}
