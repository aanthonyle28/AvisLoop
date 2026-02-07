'use client'

import { useState, useEffect, useTransition } from 'react'
import { SetupProgressPill } from './setup-progress-pill'
import { SetupProgressDrawer } from './setup-progress-drawer'
import { updateChecklistState } from '@/lib/actions/checklist'
import { CHECKLIST_ITEMS, type ChecklistItemId } from '@/lib/constants/checklist'

interface SetupProgressProps {
  items: Record<ChecklistItemId, boolean>
  completedCount: number
  allComplete: boolean
  dismissed: boolean
  firstSeenAt: string | null
}

export function SetupProgress({
  items,
  completedCount,
  allComplete,
  dismissed: initialDismissed,
  firstSeenAt,
}: SetupProgressProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [isDismissed, setIsDismissed] = useState(initialDismissed)
  const [isPending, startTransition] = useTransition()

  // Mark as seen on first render
  useEffect(() => {
    if (!firstSeenAt) {
      startTransition(async () => {
        await updateChecklistState('markSeen')
      })
    }
  }, [firstSeenAt])

  const handleDismiss = () => {
    startTransition(async () => {
      const result = await updateChecklistState('dismiss')
      if (result.success) {
        setIsDismissed(true)
      }
    })
  }

  // Don't render if dismissed
  if (isDismissed) {
    return null
  }

  return (
    <>
      <SetupProgressPill
        completedCount={completedCount}
        totalCount={CHECKLIST_ITEMS.length}
        isAllComplete={allComplete}
        onOpenDrawer={() => setDrawerOpen(true)}
        onDismiss={handleDismiss}
        isPending={isPending}
      />
      <SetupProgressDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        items={items}
        completedCount={completedCount}
        allComplete={allComplete}
      />
    </>
  )
}
