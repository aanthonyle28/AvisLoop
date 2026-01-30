'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { CircleNotch } from '@phosphor-icons/react'
import { formatScheduleDate } from '@/lib/utils/schedule'

interface RescheduleDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedCount: number
  onConfirm: (newScheduledFor: string) => void
  isPending: boolean
}

// Schedule preset without "Send now"
interface SchedulePreset {
  id: string
  label: string
  getDate: () => Date | null
}

// Filter out "now" from the schedule presets
const RESCHEDULE_PRESETS: SchedulePreset[] = [
  {
    id: '1hour',
    label: 'In 1 hour',
    getDate: () => new Date(Date.now() + 60 * 60 * 1000),
  },
  {
    id: 'morning',
    label: 'Next morning',
    getDate: () => {
      const now = new Date()
      const morning = new Date(now)
      morning.setHours(9, 0, 0, 0)
      // If it's already past 9 AM, schedule for tomorrow morning
      if (morning.getTime() <= now.getTime()) {
        morning.setDate(morning.getDate() + 1)
      }
      return morning
    },
  },
  {
    id: '24hours',
    label: 'In 24 hours',
    getDate: () => new Date(Date.now() + 24 * 60 * 60 * 1000),
  },
  {
    id: 'custom',
    label: 'Custom',
    getDate: () => null,
  },
]

export function RescheduleDialog({
  open,
  onOpenChange,
  selectedCount,
  onConfirm,
  isPending,
}: RescheduleDialogProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>('1hour')
  const [customDate, setCustomDate] = useState('')
  const [scheduledFor, setScheduledFor] = useState<string | null>(null)

  // Initialize with default preset
  useEffect(() => {
    if (open) {
      const preset = RESCHEDULE_PRESETS.find(p => p.id === '1hour')
      if (preset) {
        const date = preset.getDate()
        if (date) {
          setScheduledFor(date.toISOString())
        }
      }
    } else {
      // Reset state when dialog closes
      setSelectedPreset('1hour')
      setCustomDate('')
      setScheduledFor(null)
    }
  }, [open])

  const handlePresetClick = (presetId: string) => {
    setSelectedPreset(presetId)

    if (presetId === 'custom') {
      if (customDate) {
        const date = new Date(customDate)
        if (date.getTime() > Date.now() + 60_000) {
          setScheduledFor(date.toISOString())
        } else {
          setScheduledFor(null)
        }
      } else {
        setScheduledFor(null)
      }
      return
    }

    const preset = RESCHEDULE_PRESETS.find(p => p.id === presetId)
    if (preset) {
      const date = preset.getDate()
      setScheduledFor(date ? date.toISOString() : null)
    }
  }

  const handleCustomDateChange = (value: string) => {
    setCustomDate(value)
    if (value) {
      const date = new Date(value)
      if (date.getTime() > Date.now() + 60_000) {
        setScheduledFor(date.toISOString())
      } else {
        setScheduledFor(null)
      }
    } else {
      setScheduledFor(null)
    }
  }

  const handleConfirm = () => {
    if (scheduledFor) {
      onConfirm(scheduledFor)
    }
  }

  // Minimum datetime for custom input (now + 2 min buffer)
  const minDateTime = new Date(Date.now() + 2 * 60_000)
    .toISOString()
    .slice(0, 16)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reschedule {selectedCount} send{selectedCount !== 1 ? 's' : ''}</DialogTitle>
          <DialogDescription>
            All selected sends will be rescheduled to the same new date and time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Schedule presets */}
          <div className="grid grid-cols-2 gap-2">
            {RESCHEDULE_PRESETS.map(preset => (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePresetClick(preset.id)}
                className={`rounded-md border px-3 py-2 text-sm font-medium transition-colors ${
                  selectedPreset === preset.id
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
                disabled={isPending}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Custom datetime picker */}
          {selectedPreset === 'custom' && (
            <input
              type="datetime-local"
              value={customDate}
              min={minDateTime}
              onChange={e => handleCustomDateChange(e.target.value)}
              className="w-full rounded-md border px-3 py-2 text-sm"
              disabled={isPending}
            />
          )}

          {/* Show formatted new time */}
          {scheduledFor && (
            <p className="text-sm text-muted-foreground">
              New scheduled time: <strong className="text-foreground">{formatScheduleDate(scheduledFor)}</strong>
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!scheduledFor || isPending}
          >
            {isPending && <CircleNotch className="h-4 w-4 animate-spin" />}
            Reschedule {selectedCount} Send{selectedCount !== 1 ? 's' : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
