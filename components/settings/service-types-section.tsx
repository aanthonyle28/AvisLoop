'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Check, Clock, CircleNotch } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { TagBadge } from '@/components/ui/tag-badge'
import { updateServiceTypeSettings, updateReviewCooldown } from '@/lib/actions/business'
import { SERVICE_TYPES, SERVICE_TYPE_LABELS, DEFAULT_TIMING_HOURS } from '@/lib/validations/job'
import { MIN_ENROLLMENT_COOLDOWN_DAYS, MAX_ENROLLMENT_COOLDOWN_DAYS } from '@/lib/constants/campaigns'

interface ServiceTypesSectionProps {
  initialEnabled: string[]
  initialTiming: Record<string, number>
  initialCooldownDays?: number
  initialCustomServiceNames?: string[]
}

export function ServiceTypesSection({
  initialEnabled,
  initialTiming,
  initialCooldownDays = 30,
  initialCustomServiceNames = [],
}: ServiceTypesSectionProps) {
  const [enabled, setEnabled] = useState<Set<string>>(new Set(initialEnabled))
  const [timing, setTiming] = useState<Record<string, number>>(initialTiming)
  const [isPending, startTransition] = useTransition()
  const [hasChanges, setHasChanges] = useState(false)
  const [cooldownDays, setCooldownDays] = useState(initialCooldownDays)
  const [cooldownPending, startCooldownTransition] = useTransition()
  const [cooldownChanged, setCooldownChanged] = useState(false)
  const [customServiceNames, setCustomServiceNames] = useState<string[]>(initialCustomServiceNames)
  const [customServiceInput, setCustomServiceInput] = useState('')

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

  const addCustomService = () => {
    const trimmed = customServiceInput.trim()
    if (trimmed && !customServiceNames.includes(trimmed) && customServiceNames.length < 10) {
      setCustomServiceNames(prev => [...prev, trimmed])
      setCustomServiceInput('')
      setHasChanges(true)
    }
  }

  const removeCustomService = (name: string) => {
    setCustomServiceNames(prev => prev.filter(n => n !== name))
    setHasChanges(true)
  }

  const handleSave = () => {
    startTransition(async () => {
      const result = await updateServiceTypeSettings({
        serviceTypesEnabled: Array.from(enabled),
        serviceTypeTiming: timing,
        customServiceNames: enabled.has('other') ? customServiceNames : [],
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
    setCustomServiceNames(initialCustomServiceNames)
    setCustomServiceInput('')
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
                  {isEnabled && <Check size={12} weight="bold" />}
                </div>
              </button>

              {/* Timing input (shown when enabled) */}
              {isEnabled && (
                <div className="mt-3 flex items-center gap-2">
                  <Clock size={16} className="text-muted-foreground" />
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

      {/* Custom service names (shown when "Other" is enabled) */}
      {enabled.has('other') && (
        <div className="rounded-lg border p-4 space-y-3">
          <div>
            <h4 className="font-medium">Custom service names</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Add names for your other services (up to 10).
            </p>
          </div>
          <div className="flex gap-2">
            <Input
              value={customServiceInput}
              onChange={(e) => setCustomServiceInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addCustomService()
                }
              }}
              placeholder="e.g. Pest Control, Pool Cleaning..."
              maxLength={50}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addCustomService}
              disabled={!customServiceInput.trim() || customServiceNames.length >= 10}
              className="shrink-0"
            >
              Add
            </Button>
          </div>
          {customServiceNames.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {customServiceNames.map((name) => (
                <TagBadge
                  key={name}
                  tag={name}
                  onRemove={() => removeCustomService(name)}
                  className="text-sm px-2.5 py-1"
                />
              ))}
            </div>
          )}
          {customServiceNames.length >= 10 && (
            <p className="text-xs text-muted-foreground">Maximum 10 custom services</p>
          )}
        </div>
      )}

      {/* Actions */}
      {hasChanges && (
        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="outline" onClick={handleReset} disabled={isPending}>
            Reset
          </Button>
          <Button onClick={handleSave} disabled={isPending}>
            {isPending && <CircleNotch size={16} className="mr-2 animate-spin" />}
            Save Changes
          </Button>
        </div>
      )}

      {/* Review cooldown setting */}
      <div className="rounded-lg border p-4 space-y-3">
        <div>
          <h4 className="font-medium">Review cooldown</h4>
          <p className="text-sm text-muted-foreground mt-1">
            After a customer leaves a review, wait this many days before enrolling them in a new campaign.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            min={MIN_ENROLLMENT_COOLDOWN_DAYS}
            max={MAX_ENROLLMENT_COOLDOWN_DAYS}
            value={cooldownDays}
            onChange={(e) => {
              const val = parseInt(e.target.value) || 30
              setCooldownDays(val)
              setCooldownChanged(val !== initialCooldownDays)
            }}
            className="h-8 w-20"
          />
          <span className="text-sm text-muted-foreground">days</span>
          {cooldownChanged && (
            <Button
              size="sm"
              onClick={() => {
                startCooldownTransition(async () => {
                  const result = await updateReviewCooldown(cooldownDays)
                  if (result.error) {
                    toast.error(result.error)
                  } else {
                    toast.success('Review cooldown updated')
                    setCooldownChanged(false)
                  }
                })
              }}
              disabled={cooldownPending}
            >
              {cooldownPending && <CircleNotch size={16} className="mr-2 animate-spin" />}
              Save
            </Button>
          )}
        </div>
      </div>

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
