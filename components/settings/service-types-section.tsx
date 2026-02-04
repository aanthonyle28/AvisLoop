'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Check, Clock } from '@phosphor-icons/react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { updateServiceTypeSettings } from '@/lib/actions/business'
import { SERVICE_TYPES, SERVICE_TYPE_LABELS, DEFAULT_TIMING_HOURS } from '@/lib/validations/job'

interface ServiceTypesSectionProps {
  initialEnabled: string[]
  initialTiming: Record<string, number>
}

export function ServiceTypesSection({
  initialEnabled,
  initialTiming,
}: ServiceTypesSectionProps) {
  const [enabled, setEnabled] = useState<Set<string>>(new Set(initialEnabled))
  const [timing, setTiming] = useState<Record<string, number>>(initialTiming)
  const [isPending, startTransition] = useTransition()
  const [hasChanges, setHasChanges] = useState(false)

  const toggleService = (type: string) => {
    const newEnabled = new Set(enabled)
    if (newEnabled.has(type)) {
      newEnabled.delete(type)
    } else {
      newEnabled.add(type)
    }
    setEnabled(newEnabled)
    setHasChanges(true)
  }

  const updateTiming = (type: string, hours: number) => {
    setTiming(prev => ({ ...prev, [type]: hours }))
    setHasChanges(true)
  }

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateServiceTypeSettings({
        serviceTypesEnabled: Array.from(enabled),
        serviceTypeTiming: timing,
      })

      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success('Service type settings saved')
        setHasChanges(false)
      }
    })
  }

  const handleReset = () => {
    setEnabled(new Set(initialEnabled))
    setTiming(initialTiming)
    setHasChanges(false)
  }

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-muted-foreground">
          Select the services your business offers. Timing controls when the first campaign message is sent after job completion.
        </p>
      </div>

      {/* Service type grid */}
      <div className="grid gap-3 sm:grid-cols-2">
        {SERVICE_TYPES.map(type => {
          const isEnabled = enabled.has(type)
          const hours = timing[type] || DEFAULT_TIMING_HOURS[type]

          return (
            <div
              key={type}
              className={`rounded-lg border p-4 transition-colors ${
                isEnabled
                  ? 'border-primary bg-primary/5'
                  : 'border-border bg-background'
              }`}
            >
              {/* Service toggle */}
              <button
                type="button"
                onClick={() => toggleService(type)}
                className="flex w-full items-center justify-between"
              >
                <span className="font-medium">{SERVICE_TYPE_LABELS[type]}</span>
                <div
                  className={`flex h-5 w-5 items-center justify-center rounded ${
                    isEnabled
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-input bg-background'
                  }`}
                >
                  {isEnabled && <Check className="h-3 w-3" weight="bold" />}
                </div>
              </button>

              {/* Timing input (shown when enabled) */}
              {isEnabled && (
                <div className="mt-3 flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <Label className="sr-only">Hours until first message</Label>
                  <Input
                    type="number"
                    min={1}
                    max={168}
                    value={hours}
                    onChange={(e) => updateTiming(type, parseInt(e.target.value) || 24)}
                    className="h-8 w-20"
                  />
                  <span className="text-sm text-muted-foreground">
                    hours after completion
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Actions */}
      {hasChanges && (
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="outline" onClick={handleReset} disabled={isPending}>
            Reset
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      )}

      {/* Help text */}
      <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">
        <p>
          <strong>Tip:</strong> Select at least one service type to enable job creation filtering.
          Timing defaults are applied when creating campaigns for specific service types.
        </p>
      </div>
    </div>
  )
}
