'use client'

import { Button } from '@/components/ui/button'
import { X, Clock, Trash } from '@phosphor-icons/react'

interface BulkActionBarProps {
  selectedCount: number
  onReschedule: () => void
  onCancel: () => void
  onClearSelection: () => void
}

export function BulkActionBar({
  selectedCount,
  onReschedule,
  onCancel,
  onClearSelection,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 duration-200">
      <div className="flex items-center gap-3 rounded-lg border bg-background px-4 py-3 shadow-lg">
        <span className="text-sm font-medium">
          {selectedCount} selected
        </span>

        <div className="h-6 w-px bg-border" />

        <Button
          size="sm"
          variant="outline"
          onClick={onReschedule}
        >
          <Clock className="h-4 w-4" />
          Reschedule
        </Button>

        <Button
          size="sm"
          variant="destructive"
          onClick={onCancel}
        >
          <Trash className="h-4 w-4" />
          Cancel
        </Button>

        <Button
          size="sm"
          variant="ghost"
          onClick={onClearSelection}
        >
          <X className="h-4 w-4" />
          Clear
        </Button>
      </div>
    </div>
  )
}
