'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { BulkSendConfirmDialog } from './bulk-send-confirm-dialog'
import type { Customer, MessageTemplate } from '@/lib/types/database'

type SchedulePreset = 'immediately' | '1hour' | 'morning' | 'custom'

interface BulkSendActionBarProps {
  selectedCount: number
  filteredCount: number
  selectedCustomers: Customer[]
  allFilteredCustomers: Customer[]
  template: MessageTemplate
  schedulePreset: SchedulePreset
  customDateTime: string
  resendReadyIds: Set<string>
  hasReviewLink: boolean
  onClearSelection: () => void
}

export function BulkSendActionBar({
  selectedCount,
  filteredCount,
  selectedCustomers,
  allFilteredCustomers,
  template,
  schedulePreset,
  customDateTime,
  resendReadyIds,
  hasReviewLink,
  onClearSelection,
}: BulkSendActionBarProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'selected' | 'all'>('selected')

  const handleSendSelected = () => {
    setDialogMode('selected')
    setDialogOpen(true)
  }

  const handleSendAllFiltered = () => {
    setDialogMode('all')
    setDialogOpen(true)
  }

  const customersToSend = dialogMode === 'selected' ? selectedCustomers : allFilteredCustomers
  const showSendAllButton = filteredCount > selectedCount

  return (
    <>
      {/* Sticky bottom bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border shadow-lg transition-transform duration-200 md:left-64">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left: selection count */}
            <div className="text-sm font-medium">
              {selectedCount} selected
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onClearSelection}
              >
                Clear
              </Button>

              {showSendAllButton && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSendAllFiltered}
                  disabled={!hasReviewLink}
                  title={!hasReviewLink ? 'Add Google Review Link first' : undefined}
                >
                  Send to all filtered ({filteredCount})
                </Button>
              )}

              <Button
                size="sm"
                onClick={handleSendSelected}
                disabled={!hasReviewLink}
                title={!hasReviewLink ? 'Add Google Review Link first' : undefined}
              >
                Send request
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation dialog */}
      <BulkSendConfirmDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        customers={customersToSend}
        template={template}
        schedulePreset={schedulePreset}
        customDateTime={customDateTime}
        resendReadyIds={resendReadyIds}
        onSuccess={() => {
          setDialogOpen(false)
          onClearSelection()
        }}
      />
    </>
  )
}
