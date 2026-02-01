'use client'

import { useEffect } from 'react'
import type { EmailTemplate } from '@/lib/types/database'

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

  // Save to localStorage on change
  const handleTemplateChange = (templateId: string) => {
    localStorage.setItem('avisloop_lastTemplate', templateId)
    onTemplateChange(templateId)
  }

  const handleScheduleChange = (preset: SchedulePreset) => {
    localStorage.setItem('avisloop_lastSchedule', preset)
    onSchedulePresetChange(preset)
  }

  return (
    <div className="flex flex-col sm:flex-row gap-4 p-4 bg-muted/30 rounded-lg border">
      {/* Template dropdown */}
      <div className="flex-1">
        <label htmlFor="template-select" className="block text-xs font-medium text-muted-foreground mb-1.5">
          Template
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
        </select>
      </div>

      {/* Schedule presets */}
      <div className="flex-1">
        <label className="block text-xs font-medium text-muted-foreground mb-1.5">
          Schedule
        </label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handleScheduleChange('immediately')}
            className={`flex-1 px-3 py-2 text-xs font-medium rounded-md border transition-colors ${
              schedulePreset === 'immediately'
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-background border-border hover:bg-muted'
            }`}
          >
            Now
          </button>
          <button
            type="button"
            onClick={() => handleScheduleChange('1hour')}
            className={`flex-1 px-3 py-2 text-xs font-medium rounded-md border transition-colors ${
              schedulePreset === '1hour'
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-background border-border hover:bg-muted'
            }`}
          >
            1hr
          </button>
          <button
            type="button"
            onClick={() => handleScheduleChange('morning')}
            className={`flex-1 px-3 py-2 text-xs font-medium rounded-md border transition-colors ${
              schedulePreset === 'morning'
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-background border-border hover:bg-muted'
            }`}
          >
            9AM
          </button>
          <button
            type="button"
            onClick={() => handleScheduleChange('custom')}
            className={`flex-1 px-3 py-2 text-xs font-medium rounded-md border transition-colors ${
              schedulePreset === 'custom'
                ? 'bg-primary/10 border-primary text-primary'
                : 'bg-background border-border hover:bg-muted'
            }`}
          >
            Custom
          </button>
        </div>

        {/* Custom datetime input */}
        {schedulePreset === 'custom' && (
          <input
            type="datetime-local"
            value={customDateTime}
            onChange={(e) => onCustomDateTimeChange(e.target.value)}
            className="w-full mt-2 px-3 py-2 text-sm border rounded-md bg-background"
          />
        )}
      </div>
    </div>
  )
}
