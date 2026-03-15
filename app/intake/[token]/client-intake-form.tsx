'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Check, CheckCircle, SpinnerGap } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { TagBadge } from '@/components/ui/tag-badge'
import { cn } from '@/lib/utils'
import {
  SERVICE_TYPES,
  SERVICE_TYPE_LABELS,
} from '@/lib/validations/job'

// ─── Component ────────────────────────────────────────────────────────────────

interface ClientIntakeFormProps {
  agencyName: string
  token: string
}

export function ClientIntakeForm({ agencyName, token }: ClientIntakeFormProps) {
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form fields
  const [businessName, setBusinessName] = useState('')
  const [phone, setPhone] = useState('')
  const [googleReviewLink, setGoogleReviewLink] = useState('')
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [customServiceNames, setCustomServiceNames] = useState<string[]>([])
  const [customServiceInput, setCustomServiceInput] = useState('')
  const [smsConsent, setSmsConsent] = useState(false)

  const handleToggleService = (serviceType: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceType)
        ? prev.filter((s) => s !== serviceType)
        : [...prev, serviceType]
    )
    setError(null)
  }

  const addCustomService = () => {
    const trimmed = customServiceInput.trim()
    if (trimmed && !customServiceNames.includes(trimmed) && customServiceNames.length < 10) {
      setCustomServiceNames((prev) => [...prev, trimmed])
      setCustomServiceInput('')
    }
  }

  const removeCustomService = (serviceName: string) => {
    setCustomServiceNames((prev) => prev.filter((n) => n !== serviceName))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!businessName.trim()) {
      setError('Business name is required')
      return
    }
    if (selectedServices.length === 0) {
      setError('Select at least one service type')
      return
    }
    if (!smsConsent) {
      setError('You must acknowledge SMS consent requirements')
      return
    }

    setIsSubmitting(true)

    try {
      const res = await fetch('/api/intake', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: businessName.trim(),
          phone: phone.trim() || undefined,
          googleReviewLink: googleReviewLink.trim() || undefined,
          serviceTypes: selectedServices,
          customServiceNames: selectedServices.includes('other') ? customServiceNames : [],
          smsConsentAcknowledged: true,
          token,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Something went wrong')
      }

      setSubmitted(true)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      setError(message)
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ─── Success state ────────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div className="bg-card border rounded-xl shadow-sm p-8 text-center space-y-4">
        <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <CheckCircle size={40} weight="fill" className="text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-2xl font-bold">You&apos;re all set!</h2>
        <p className="text-muted-foreground">
          Your business has been added to {agencyName}&apos;s account. They&apos;ll take it from here.
        </p>
      </div>
    )
  }

  // ─── Form ─────────────────────────────────────────────────────────────────────

  return (
    <div className="bg-card border rounded-xl shadow-sm p-6 sm:p-8 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Welcome to {agencyName}</h1>
        <p className="text-muted-foreground">
          Fill in your business details to get started with automated review management.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Business info */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="intake-business-name">Business name *</Label>
            <Input
              id="intake-business-name"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Sunrise HVAC"
              disabled={isSubmitting}
              autoFocus
              className="text-lg h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="intake-phone">Phone number</Label>
            <Input
              id="intake-phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="(555) 123-4567"
              disabled={isSubmitting}
              className="text-lg h-12"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="intake-google-link">Google review link</Label>
            <Input
              id="intake-google-link"
              type="url"
              value={googleReviewLink}
              onChange={(e) => setGoogleReviewLink(e.target.value)}
              placeholder="https://g.page/r/..."
              disabled={isSubmitting}
              className="text-lg h-12"
            />
          </div>
        </div>

        {/* Service types */}
        <div className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold">What services do you offer? *</h2>
            <p className="text-sm text-muted-foreground">
              Select all that apply.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {SERVICE_TYPES.map((serviceType) => {
              const isSelected = selectedServices.includes(serviceType)
              const label = SERVICE_TYPE_LABELS[serviceType]
              return (
                <button
                  key={serviceType}
                  type="button"
                  onClick={() => handleToggleService(serviceType)}
                  disabled={isSubmitting}
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

          {/* Custom services when "Other" selected */}
          {selectedServices.includes('other') && (
            <div className="space-y-2">
              <Label htmlFor="intake-custom-service">What type of service?</Label>
              <div className="flex gap-2">
                <Input
                  id="intake-custom-service"
                  value={customServiceInput}
                  onChange={(e) => setCustomServiceInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addCustomService()
                    }
                  }}
                  placeholder="e.g. Pest Control, Pool Cleaning..."
                  disabled={isSubmitting}
                  maxLength={50}
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addCustomService}
                  disabled={isSubmitting || !customServiceInput.trim() || customServiceNames.length >= 10}
                  className="shrink-0"
                >
                  Add
                </Button>
              </div>
              {customServiceNames.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {customServiceNames.map((svcName) => (
                    <TagBadge
                      key={svcName}
                      tag={svcName}
                      onRemove={() => removeCustomService(svcName)}
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
        </div>

        {/* SMS Consent */}
        <div className="border border-info-border bg-info-bg rounded-lg p-4">
          <div className="flex items-start gap-3">
            <Checkbox
              id="intake-sms-consent"
              checked={smsConsent}
              onCheckedChange={(checked) => setSmsConsent(checked === true)}
              className="mt-0.5"
            />
            <Label
              htmlFor="intake-sms-consent"
              className="text-sm cursor-pointer leading-relaxed"
            >
              I understand that I must obtain written consent from customers before sending them SMS messages, and I will maintain records of consent as required by TCPA regulations. *
            </Label>
          </div>
        </div>

        {error && <p className="text-sm text-error-text">{error}</p>}

        <Button
          type="submit"
          className="w-full h-12 text-base"
          disabled={isSubmitting || selectedServices.length === 0 || !smsConsent}
        >
          {isSubmitting ? (
            <>
              <SpinnerGap size={20} className="animate-spin mr-2" />
              Submitting...
            </>
          ) : (
            'Submit'
          )}
        </Button>
      </form>
    </div>
  )
}
