'use client'

import { useState } from 'react'
import { SetupProgressPill } from './setup-progress-pill'
import { SetupProgressDrawer } from './setup-progress-drawer'

interface SetupProgressProps {
  contactCount: number
  hasReviewLink: boolean
  hasTemplate: boolean
  hasContact: boolean
  hasSent: boolean
}

export function SetupProgress({
  contactCount,
  hasReviewLink,
  hasTemplate,
  hasContact,
  hasSent,
}: SetupProgressProps) {
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Calculate completion
  const steps = [hasContact, hasReviewLink, hasTemplate, hasSent]
  const completedCount = steps.filter(Boolean).length
  const totalCount = steps.length
  const isAllComplete = completedCount === totalCount

  return (
    <>
      <SetupProgressPill
        completedSteps={completedCount}
        totalSteps={totalCount}
        isAllComplete={isAllComplete}
        onOpenDrawer={() => setDrawerOpen(true)}
      />
      <SetupProgressDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        contactCount={contactCount}
        hasReviewLink={hasReviewLink}
        hasTemplate={hasTemplate}
        hasContact={hasContact}
        hasSent={hasSent}
      />
    </>
  )
}
