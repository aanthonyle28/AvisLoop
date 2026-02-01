'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import type { EmailTemplate } from '@/lib/types/database'
import { format } from 'date-fns'

type SchedulePreset = 'immediately' | '1hour' | 'morning' | 'custom'

interface SendSettingsBarProps {
  templates: EmailTemplate[]
  selectedTemplateId: string
  onTemplateChange: (templateId: string) => void
  schedulePreset: SchedulePreset
  onSchedulePresetChange: (preset: SchedulePreset) => void
  customDateTime: string
  onCustomDateTimeChange: (datetime: string) => void
}

export function SendSettingsBar({
  templates,
  selectedTemplateId,
  onTemplateChange,
  schedulePreset,
  onSchedulePresetChange,
  customDateTime,
  onCustomDateTimeChange,
}: SendSettingsBarProps) {
  const router = useRouter()
  const customInputRef = useRef<HTMLInputElement>(null)

  // Load from localStorage on mount
  useEffect(() => {
    const savedTemplate = localStorage.getItem('avisloop_lastTemplate')
    const savedSchedule = localStorage.getItem('avisloop_lastSchedule')

    if (savedTemplate && templates.find(t => t.id === savedTemplate)) {
      onTemplateChange(savedTemplate)
    }

    if (savedSchedule && ['immediately', '1hour', 'morning', 'custom'].includes(savedSchedule)) {
      onSchedulePresetChange(savedSchedule as SchedulePreset)
    }
  }, [templates, onTemplateChange, onSchedulePresetChange])

  const handleTemplateChange = (templateId: string) => {
    // Navigate to settings if "Create Template" is selected
    if (templateId === 'create-new') {
      router.push('/dashboard/settings#templates')
      return
    }

    // Normal template selection
    localStorage.setItem('avisloop_lastTemplate', templateId)
    onTemplateChange(templateId)
  }

  const handleScheduleChange = (preset: SchedulePreset) => {
    localStorage.setItem('avisloop_lastSchedule', preset)
    onSchedulePresetChange(preset)
    // When custom is selected, focus the hidden date input to open the picker
    if (preset === 'custom') {
      setTimeout(() => {
        customInputRef.current?.showPicker?.()
        customInputRef.current?.focus()
      }, 50)
    }
  }

  // Format custom date for display in the chip
  const customDateLabel = customDateTime
    ? `Custom: ${format(new Date(customDateTime), 'MMM d, h:mm a')}`
    : 'Custom Date'

  const presetButtonClass = (preset: SchedulePreset) =>
    `px-3 py-2 text-xs font-medium rounded-md border transition-colors whitespace-nowrap ${
      schedulePreset === preset
        ? 'bg-primary/10 border-primary text-primary'
        : 'bg-background border-border hover:bg-muted'
    }`

  return (
    <div className="flex flex-col sm:flex-row sm:items-end gap-4">
      {/* Template dropdown */}
      <div className="sm:w-48">
        <label htmlFor="template-select" className="block text-xs font-medium text-muted-foreground mb-1.5">
          Message Template
        </label>
        <select
          id="template-select"
          value={selectedTemplateId}
          onChange={(e) => handleTemplateChange(e.target.value)}
          className="w-full px-3 py-2 border rounded-md text-sm bg-background"
        >
          {templates.map(template => (
            <option key={template.id} value={template.id}>
              {template.name} {template.is_default ? '(Default)' : ''}
            </option>
          ))}
          <option disabled>──────────</option>
          <option value="create-new">+ Create Template</option>
        </select>
      </div>

      {/* Schedule presets */}
      <div className="flex-1">
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">
          When to Send
        </label>
        <div className="flex gap-2 flex-wrap">
          <button type="button" onClick={() => handleScheduleChange('immediately')} className={presetButtonClass('immediately')}>
            Immediately
          </button>
          <button type="button" onClick={() => handleScheduleChange('1hour')} className={presetButtonClass('1hour')}>
            In 1 hour
          </button>
          <button type="button" onClick={() => handleScheduleChange('morning')} className={presetButtonClass('morning')}>
            Morning (9AM)
          </button>

          {/* Custom date chip with inline date picker */}
          <label className={`relative cursor-pointer ${presetButtonClass('custom')}`}>
            {customDateLabel}
            <input
              ref={customInputRef}
              type="datetime-local"
              value={customDateTime}
              onChange={(e) => {
                onCustomDateTimeChange(e.target.value)
                handleScheduleChange('custom')
              }}
              onFocus={() => handleScheduleChange('custom')}
              className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            />
          </label>
        </div>
      </div>
    </div>
  )
}
