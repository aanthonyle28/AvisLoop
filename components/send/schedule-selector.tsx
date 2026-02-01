'use client'

import { useState } from 'react'
import { Clock, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SCHEDULE_PRESETS, formatForDateTimeInput, isValidScheduleDate } from '@/lib/utils/schedule'

interface ScheduleSelectorProps {
  onScheduleChange: (scheduledFor: string | null) => void
}

export function ScheduleSelector({ onScheduleChange }: ScheduleSelectorProps) {
  const [selectedPreset, setSelectedPreset] = useState('now')
  const [customDate, setCustomDate] = useState('')

  const handlePresetClick = (presetId: string) => {
    setSelectedPreset(presetId)

    if (presetId === 'now') {
      onScheduleChange(null)
      return
    }

    if (presetId === 'custom') {
      // Don't emit until user picks a date
      if (customDate) {
        const date = new Date(customDate)
        if (isValidScheduleDate(date)) {
          onScheduleChange(date.toISOString())
        }
      } else {
        onScheduleChange(null)
      }
      return
    }

    const preset = SCHEDULE_PRESETS.find(p => p.id === presetId)
    if (preset) {
      const date = preset.getDate()
      onScheduleChange(date ? date.toISOString() : null)
    }
  }

  const handleCustomDateChange = (value: string) => {
    setCustomDate(value)
    if (value) {
      const date = new Date(value)
      if (isValidScheduleDate(date)) {
        onScheduleChange(date.toISOString())
      } else {
        onScheduleChange(null)
      }
    } else {
      onScheduleChange(null)
    }
  }

  // Minimum datetime for custom input (now + 2 min buffer)
  const minDateTime = formatForDateTimeInput(new Date(Date.now() + 2 * 60_000))

  return (
    <div className="space-y-3">
      <label className="flex items-center gap-2 text-sm font-medium">
        <Clock className="h-4 w-4" />
        When to send
      </label>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {SCHEDULE_PRESETS.map(preset => (
          <button
            key={preset.id}
            type="button"
            onClick={() => handlePresetClick(preset.id)}
            className={cn(
              'rounded-md border px-3 py-2 text-sm font-medium transition-colors',
              selectedPreset === preset.id
                ? 'border-primary bg-primary/10 text-primary'
                : 'border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>

      {selectedPreset === 'custom' && (
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <input
            type="datetime-local"
            value={customDate}
            min={minDateTime}
            onChange={e => handleCustomDateChange(e.target.value)}
            className="flex-1 rounded-md border px-3 py-2 text-sm"
          />
        </div>
      )}

      {selectedPreset !== 'now' && selectedPreset !== 'custom' && (
        <p className="text-xs text-muted-foreground">
          Will send {SCHEDULE_PRESETS.find(p => p.id === selectedPreset)?.label.toLowerCase()}
        </p>
      )}
    </div>
  )
}
