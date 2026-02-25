'use client'

import { useState, useTransition } from 'react'
import { Check } from '@phosphor-icons/react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { TagBadge } from '@/components/ui/tag-badge'
import { saveBusinessBasics, saveServicesOffered } from '@/lib/actions/onboarding'
import {
  SERVICE_TYPES,
  SERVICE_TYPE_LABELS,
  type ServiceTypeValue,
} from '@/lib/validations/job'
import { cn } from '@/lib/utils'

interface BusinessSetupStepProps {
  onComplete: () => void
  defaultValues?: {
    name?: string
    phone?: string
    google_review_link?: string
  }
  defaultEnabled?: string[]
  defaultCustomServiceNames?: string[]
}

/**
 * Step 1: Business Setup (merged Business Basics + Services Offered)
 * Collects business name, phone, Google review link, and service types.
 * Selecting "Other" reveals a multi-tag input for custom service names.
 */
export function BusinessSetupStep({
  onComplete,
  defaultValues,
  defaultEnabled,
  defaultCustomServiceNames,
}: BusinessSetupStepProps) {
  const [name, setName] = useState(defaultValues?.name || '')
  const [phone, setPhone] = useState(defaultValues?.phone || '')
  const [googleReviewLink, setGoogleReviewLink] = useState(
    defaultValues?.google_review_link || ''
  )
  const [selected, setSelected] = useState<string[]>(defaultEnabled || [])
  const [customServiceNames, setCustomServiceNames] = useState<string[]>(
    defaultCustomServiceNames || []
  )
  const [customServiceInput, setCustomServiceInput] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleToggle = (serviceType: string) => {
    setSelected((prev) =>
      prev.includes(serviceType)
        ? prev.filter((s) => s !== serviceType)
        : [...prev, serviceType]
    )
    setError(null)
  }

  const addCustomService = () => {
    const trimmed = customServiceInput.trim()
    if (trimmed && !customServiceNames.includes(trimmed) && customServiceNames.length < 10) {
      setCustomServiceNames(prev => [...prev, trimmed])
      setCustomServiceInput('')
    }
  }

  const removeCustomService = (name: string) => {
    setCustomServiceNames(prev => prev.filter(n => n !== name))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Business name is required')
      return
    }

    if (selected.length === 0) {
      setError('Select at least one service type')
      return
    }

    startTransition(async () => {
      // Save business basics first
      const basicsResult = await saveBusinessBasics({
        name: name.trim(),
        phone: phone.trim(),
        googleReviewLink: googleReviewLink.trim(),
      })

      if (!basicsResult.success) {
        setError(basicsResult.error || 'Failed to save business basics')
        return
      }

      // Then save services
      const servicesResult = await saveServicesOffered({
        serviceTypes: selected as ServiceTypeValue[],
        customServiceNames: selected.includes('other') ? customServiceNames : [],
      })

      if (!servicesResult.success) {
        setError(servicesResult.error || 'Failed to save service types')
        return
      }

      onComplete()
    })
  }

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Let&apos;s get your business set up</h1>
        <p className="text-muted-foreground text-lg">
          This info appears in your review request messages.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Business info fields */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="business-name">Business name *</Label>
            <Input
              id="business-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sunrise HVAC"
              disabled={isPending}
              autoFocus
              className="text-lg h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone-number">Phone number</Label>
            <Input
              id="phone-number"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
              disabled={isPending}
              className="text-lg h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="google-review-link">Google review link</Label>
            <Input
              id="google-review-link"
              type="url"
              value={googleReviewLink}
              onChange={(e) => setGoogleReviewLink(e.target.value)}
              placeholder="https://g.page/r/..."
              disabled={isPending}
              className="text-lg h-12"
            />
          </div>
        </div>

        <Separator />

        {/* Service types */}
        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">What services do you offer?</h2>
            <p className="text-sm text-muted-foreground">
              We&apos;ll use this to set up smart follow-up timing.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {SERVICE_TYPES.map((serviceType) => {
              const isSelected = selected.includes(serviceType)
              const label = SERVICE_TYPE_LABELS[serviceType]
              return (
                <button
                  key={serviceType}
                  type="button"
                  onClick={() => handleToggle(serviceType)}
                  disabled={isPending}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-medium transition-colors',
                    isSelected
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border hover:border-primary/50 text-foreground'
                  )}
                >
                  {isSelected && <Check size={14} weight="bold" />}
                  {label}
                </button>
              )
            })}
          </div>

          {/* "Other" multi-tag custom service input */}
          {selected.includes('other') && (
            <div className="space-y-2">
              <Label htmlFor="custom-service">What type of service?</Label>
              <div className="flex gap-2">
                <Input
                  id="custom-service"
                  value={customServiceInput}
                  onChange={(e) => setCustomServiceInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addCustomService()
                    }
                  }}
                  placeholder="e.g. Pest Control, Pool Cleaning..."
                  disabled={isPending}
                  maxLength={50}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCustomService}
                  disabled={isPending || !customServiceInput.trim() || customServiceNames.length >= 10}
                  className="shrink-0"
                >
                  Add
                </Button>
              </div>
              {customServiceNames.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {customServiceNames.map((name) => (
                    <TagBadge
                      key={name}
                      tag={name}
                      onRemove={() => removeCustomService(name)}
                    />
                  ))}
                </div>
              )}
              {customServiceNames.length >= 10 && (
                <p className="text-xs text-muted-foreground">Maximum 10 custom services</p>
              )}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-error-text">{error}</p>}

        <Button
          type="submit"
          className="w-full h-12 text-base"
          disabled={isPending || selected.length === 0}
        >
          {isPending ? 'Saving...' : 'Continue'}
        </Button>
      </form>
    </div>
  )
}
