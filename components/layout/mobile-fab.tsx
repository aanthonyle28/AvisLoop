'use client'

import { Plus } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { useAddJob } from '@/components/jobs/add-job-provider'

export function MobileFAB() {
  const { openAddJob } = useAddJob()

  return (
    <button
      onClick={openAddJob}
      aria-label="Add Job"
      className={cn(
        // Positioning: fixed bottom-right, above bottom nav (72px + 8px margin)
        "fixed bottom-20 right-4 z-50",
        // Size: 56x56px (iOS standard, exceeds 44px minimum)
        "h-14 w-14",
        // Styling
        "rounded-full bg-accent text-accent-foreground shadow-lg",
        // States
        "hover:bg-accent/90 active:scale-95",
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
