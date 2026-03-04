'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Check } from '@phosphor-icons/react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Separator } from '@/components/ui/separator'
import { TagBadge } from '@/components/ui/tag-badge'
import { OnboardingProgress } from '@/components/onboarding/onboarding-progress'
import {
  createAdditionalBusiness,
  saveNewBusinessServices,
  createNewBusinessCampaign,
  saveNewBusinessBrandVoice,
  completeNewBusinessOnboarding,
} from '@/lib/actions/create-additional-business'
import { switchBusiness } from '@/lib/actions/active-business'
import { CAMPAIGN_PRESETS } from '@/lib/constants/campaigns'
import {
  SERVICE_TYPES,
  SERVICE_TYPE_LABELS,
  type ServiceTypeValue,
} from '@/lib/validations/job'
import { BRAND_VOICE_PRESETS, type BrandVoicePresetKey } from '@/lib/validations/onboarding'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import type { CampaignWithTouches } from '@/lib/types/database'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CreateBusinessWizardProps {
  campaignPresets: CampaignWithTouches[]
}

// ─── Step 1: Business Setup ───────────────────────────────────────────────────

interface Step1Props {
  onComplete: (businessId: string) => void
}

function BusinessSetupStep({ onComplete }: Step1Props) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [googleReviewLink, setGoogleReviewLink] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [customServiceNames, setCustomServiceNames] = useState<string[]>([])
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
      setCustomServiceNames((prev) => [...prev, trimmed])
      setCustomServiceInput('')
    }
  }

  const removeCustomService = (serviceName: string) => {
    setCustomServiceNames((prev) => prev.filter((n) => n !== serviceName))
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
      // Step 1a: INSERT the new business (pure insert — never upsert)
      const basicsResult = await createAdditionalBusiness({
        name: name.trim(),
        phone: phone.trim(),
        googleReviewLink: googleReviewLink.trim(),
      })

      if (!basicsResult.success) {
        setError(basicsResult.error || 'Failed to create business')
        return
      }

      const newBusinessId = basicsResult.businessId

      // Step 1b: Save service types scoped to the new business
      const servicesResult = await saveNewBusinessServices(newBusinessId, {
        serviceTypes: selected as ServiceTypeValue[],
        customServiceNames: selected.includes('other') ? customServiceNames : [],
      })

      if (!servicesResult.success) {
        setError(servicesResult.error || 'Failed to save service types')
        return
      }

      onComplete(newBusinessId)
    })
  }

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Set up your new business</h1>
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
              const isServiceSelected = selected.includes(serviceType)
              const label = SERVICE_TYPE_LABELS[serviceType]
              return (
                <button
                  key={serviceType}
                  type="button"
                  onClick={() => handleToggle(serviceType)}
                  disabled={isPending}
                  className={cn(
                    'inline-flex items-center gap-1.5 px-4 py-2 rounded-full border text-sm font-medium transition-colors',
                    isServiceSelected
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background border-border hover:border-primary/50 text-foreground'
                  )}
                >
                  {isServiceSelected && <Check size={14} weight="bold" />}
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

// ─── Step 2: Campaign Preset ──────────────────────────────────────────────────

interface Step2Props {
  newBusinessId: string
  campaignPresets: CampaignWithTouches[]
  onComplete: () => void
  onGoBack: () => void
}

function CampaignPresetStep({ newBusinessId, campaignPresets, onComplete, onGoBack }: Step2Props) {
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  // Match database presets with constant definitions for descriptions
  const presetsWithMeta = campaignPresets.map((preset) => {
    const meta = CAMPAIGN_PRESETS.find((p) => preset.name.toLowerCase().includes(p.id))
    return { ...preset, meta }
  })

  // Sort to match CAMPAIGN_PRESETS order: conservative → standard → aggressive
  const sortedPresets = [...presetsWithMeta].sort((a, b) => {
    const aIdx = CAMPAIGN_PRESETS.findIndex((p) => p.id === a.meta?.id)
    const bIdx = CAMPAIGN_PRESETS.findIndex((p) => p.id === b.meta?.id)
    return (aIdx === -1 ? 99 : aIdx) - (bIdx === -1 ? 99 : bIdx)
  })

  const handleContinue = () => {
    if (!selectedPresetId) return

    startTransition(async () => {
      const result = await createNewBusinessCampaign(newBusinessId, selectedPresetId)
      if (!result.success) {
        toast.error(result.error || 'Failed to create campaign')
      } else {
        onComplete()
      }
    })
  }

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Choose your follow-up approach</h1>
        <p className="text-muted-foreground text-lg">
          Select a campaign style. You can change this later in Campaigns.
        </p>
      </div>

      {/* Preset cards — vertical stack */}
      <div
        className="flex flex-col gap-3 max-w-lg mx-auto"
        role="radiogroup"
        aria-label="Campaign preset options"
      >
        {sortedPresets.map((preset) => {
          const isSelected = selectedPresetId === preset.id
          return (
            <div
              key={preset.id}
              role="radio"
              tabIndex={0}
              aria-checked={isSelected}
              className={cn(
                'relative border rounded-lg p-4 cursor-pointer transition-all',
                isSelected
                  ? 'border-primary ring-2 ring-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              )}
              onClick={() => setSelectedPresetId(preset.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  setSelectedPresetId(preset.id)
                }
              }}
            >
              {/* Title + description */}
              <h3 className="font-semibold text-lg">{preset.meta?.name || preset.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {preset.meta?.description || `${preset.campaign_touches.length} touches`}
              </p>
            </div>
          )
        })}
      </div>

      {/* Button row */}
      <div className="flex gap-3 max-w-lg mx-auto">
        <Button
          type="button"
          variant="outline"
          onClick={onGoBack}
          disabled={isPending}
          className="flex-1 h-12 text-base"
        >
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={isPending || !selectedPresetId}
          className="flex-1 h-12 text-base"
        >
          {isPending ? 'Creating...' : 'Continue'}
        </Button>
      </div>
    </div>
  )
}

// ─── Step 3: Brand Voice ─────────────────────────────────────────────────────

interface Step3Props {
  newBusinessId: string
  onComplete: () => void
  onGoBack: () => void
}

function BrandVoiceCreateStep({ newBusinessId, onComplete, onGoBack }: Step3Props) {
  const [selected, setSelected] = useState<BrandVoicePresetKey | null>(null)
  const [customText, setCustomText] = useState('')
  const [isPending, startTransition] = useTransition()

  const handleContinue = () => {
    if (!selected) return

    startTransition(async () => {
      const result = await saveNewBusinessBrandVoice(newBusinessId, {
        preset: selected,
        customText: customText.trim() || '',
      })
      if (!result.success) {
        toast.error(result.error || 'Failed to save brand voice')
      } else {
        onComplete()
      }
    })
  }

  const handleSkip = () => {
    onComplete()
  }

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">How should your messages sound?</h1>
        <p className="text-muted-foreground text-lg">
          Pick a tone that matches your brand. You can customize this later.
        </p>
      </div>

      {/* Preset chips grid */}
      <div
        className="grid grid-cols-2 sm:grid-cols-3 gap-3"
        role="radiogroup"
        aria-label="Brand voice options"
      >
        {BRAND_VOICE_PRESETS.map((preset) => {
          const isSelected = selected === preset.value
          return (
            <button
              key={preset.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => setSelected(preset.value)}
              disabled={isPending}
              className={cn(
                'flex items-center justify-center px-4 py-3 border rounded-lg transition-all text-center',
                isSelected
                  ? 'border-primary ring-2 ring-primary bg-primary/5'
                  : 'border-border hover:border-primary/50',
                isPending && 'opacity-50 cursor-not-allowed'
              )}
            >
              <span className="text-sm font-medium">{preset.label}</span>
            </button>
          )
        })}
      </div>

      {/* Optional custom textarea */}
      {selected && (
        <div className="space-y-2">
          <label htmlFor="create-biz-brand-voice-custom" className="text-sm font-medium text-muted-foreground">
            Add extra context (optional)
          </label>
          <Textarea
            id="create-biz-brand-voice-custom"
            placeholder="e.g. We're a family-owned shop in Texas, keep it southern and friendly"
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            disabled={isPending}
            maxLength={300}
            rows={3}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground text-right">{customText.length}/300</p>
        </div>
      )}

      {/* Button row */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onGoBack}
          disabled={isPending}
          className="flex-1 h-12 text-base"
        >
          Back
        </Button>
        <Button
          type="button"
          onClick={handleContinue}
          disabled={isPending || !selected}
          className="flex-1 h-12 text-base"
        >
          {isPending ? 'Saving...' : 'Continue'}
        </Button>
      </div>

      {/* Skip link */}
      <div className="text-center">
        <button
          type="button"
          onClick={handleSkip}
          disabled={isPending}
          className="text-sm text-muted-foreground hover:text-foreground underline"
        >
          Skip without saving
        </button>
      </div>
    </div>
  )
}

// ─── Wizard Shell ─────────────────────────────────────────────────────────────

/**
 * CreateBusinessWizard — 3-step wizard for adding a second/nth business.
 *
 * Step 1: Business Setup (name, phone, services)
 * Step 2: Campaign Preset
 * Step 3: Brand Voice (skippable)
 *
 * Calls ONLY the scoped server actions from create-additional-business.ts.
 * NEVER calls saveBusinessBasics, saveServicesOffered, createCampaignFromPreset,
 * acknowledgeSMSConsent, or markOnboardingComplete.
 *
 * No localStorage draft persistence (intentional — wizard is only 3 steps).
 */
export function CreateBusinessWizard({ campaignPresets }: CreateBusinessWizardProps) {
  const router = useRouter()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [newBusinessId, setNewBusinessId] = useState<string | null>(null)

  const handleStep1Complete = (businessId: string) => {
    setNewBusinessId(businessId)
    setStep(2)
  }

  const handleStep2Complete = () => {
    setStep(3)
  }

  const handleStep3Complete = () => {
    if (!newBusinessId) return
    handleAutoComplete(newBusinessId)
  }

  const handleAutoComplete = async (businessId: string) => {
    const result = await completeNewBusinessOnboarding(businessId)
    if (!result.success) {
      toast.error(result.error || 'Failed to complete setup')
      return
    }
    const switchResult = await switchBusiness(businessId)
    if (switchResult.error) {
      toast.error(switchResult.error || 'Failed to switch business')
      return
    }
    router.push('/dashboard')
  }

  const handleGoBackToStep1 = () => {
    setStep(1)
  }

  const handleGoBackToStep2 = () => {
    setStep(2)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 pb-20">
      <div className="w-full max-w-lg space-y-8">
        {step === 1 && <BusinessSetupStep onComplete={handleStep1Complete} />}

        {step === 2 && newBusinessId && (
          <CampaignPresetStep
            newBusinessId={newBusinessId}
            campaignPresets={campaignPresets}
            onComplete={handleStep2Complete}
            onGoBack={handleGoBackToStep1}
          />
        )}

        {step === 3 && newBusinessId && (
          <BrandVoiceCreateStep
            newBusinessId={newBusinessId}
            onComplete={handleStep3Complete}
            onGoBack={handleGoBackToStep2}
          />
        )}
      </div>

      {/* Progress bar fixed at bottom */}
      <OnboardingProgress currentStep={step} totalSteps={3} />
    </div>
  )
}
