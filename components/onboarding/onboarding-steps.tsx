'use client'

import { useState, useTransition } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { updateBusiness } from '@/lib/actions/business'
import type { OnboardingBusiness } from '@/lib/types/onboarding'

interface OnboardingStepsProps {
  currentStep: number
  business: OnboardingBusiness
  onGoToNext: () => void
  onGoBack: () => void
  onComplete: () => Promise<void>
  isSubmitting: boolean
}

/**
 * Client component that renders the appropriate step component based on currentStep.
 * Step 1: Business Name (required)
 * Step 2: Google Review Link (optional/skippable)
 */
export function OnboardingSteps({
  currentStep,
  business,
  onGoToNext,
  onGoBack,
  onComplete,
  isSubmitting,
}: OnboardingStepsProps) {
  switch (currentStep) {
    case 1:
      return <BusinessNameStep onComplete={onGoToNext} defaultName={business?.name || ''} />

    case 2:
      return (
        <GoogleReviewLinkStep
          onComplete={onComplete}
          onGoBack={onGoBack}
          defaultLink={business?.google_review_link || ''}
          isSubmitting={isSubmitting}
        />
      )

    default:
      return null
  }
}

/**
 * Step 1: Business Name
 * Required field - cannot proceed without entering a name
 */
function BusinessNameStep({
  onComplete,
  defaultName,
}: {
  onComplete: () => void
  defaultName: string
}) {
  const [name, setName] = useState(defaultName)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!name.trim()) {
      setError('Business name is required')
      return
    }

    if (name.length > 100) {
      setError('Business name must be 100 characters or less')
      return
    }

    const formData = new FormData()
    formData.append('name', name.trim())
    formData.append('googleReviewLink', '')
    formData.append('defaultSenderName', '')
    formData.append('defaultTemplateId', '')

    startTransition(async () => {
      const result = await updateBusiness(null, formData)
      if (result.success) {
        onComplete()
        return
      }
      if (result.fieldErrors?.name) {
        setError(result.fieldErrors.name[0])
      }
      if (result.error) {
        setError(result.error)
      }
    })
  }

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">What&apos;s your business called?</h1>
        <p className="text-muted-foreground text-lg">
          This will appear in your review request emails.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="business-name">Business name</Label>
          <Input
            id="business-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Sunrise Dental"
            disabled={isPending}
            autoFocus
            className="text-lg h-12"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <Button type="submit" className="w-full h-12 text-base" disabled={isPending}>
          {isPending ? 'Saving...' : 'Continue'}
        </Button>
      </form>
    </div>
  )
}

/**
 * Step 2: Google Review Link
 * Optional/skippable - user can skip and add later
 */
function GoogleReviewLinkStep({
  onComplete,
  onGoBack,
  defaultLink,
  isSubmitting,
}: {
  onComplete: () => Promise<void>
  onGoBack: () => void
  defaultLink: string
  isSubmitting: boolean
}) {
  const [link, setLink] = useState(defaultLink)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate URL if provided
    if (link.trim()) {
      try {
        new URL(link.trim())
      } catch {
        setError('Please enter a valid URL')
        return
      }
      if (!link.includes('google.com')) {
        setError('Must be a Google URL')
        return
      }
    }

    const formData = new FormData()
    formData.append('name', '') // Not updating name in this step
    formData.append('googleReviewLink', link.trim())
    formData.append('defaultSenderName', '')
    formData.append('defaultTemplateId', '')

    startTransition(async () => {
      const result = await updateBusiness(null, formData)
      if (result.success) {
        await onComplete()
        return
      }
      if (result.fieldErrors?.googleReviewLink) {
        setError(result.fieldErrors.googleReviewLink[0])
      }
      if (result.error) {
        setError(result.error)
      }
    })
  }

  const handleSkip = () => {
    startTransition(async () => {
      await onComplete()
    })
  }

  return (
    <div className="space-y-8">
      {/* Heading */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Add your Google review link</h1>
        <p className="text-muted-foreground text-lg">
          This is the link customers click to leave you a review. You can add this later.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="google-review-link">Google review link</Label>
          <Input
            id="google-review-link"
            type="url"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://g.page/r/..."
            disabled={isPending || isSubmitting}
            autoFocus
            className="text-lg h-12"
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        {/* Button row */}
        <div className="flex gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onGoBack}
            disabled={isPending || isSubmitting}
            className="flex-1 h-12 text-base"
          >
            Back
          </Button>
          <Button
            type="submit"
            disabled={isPending || isSubmitting}
            className="flex-1 h-12 text-base"
          >
            {isPending || isSubmitting ? 'Finishing...' : 'Finish'}
          </Button>
        </div>

        {/* Skip link */}
        <div className="text-center">
          <button
            type="button"
            onClick={handleSkip}
            disabled={isPending || isSubmitting}
            className="text-sm text-muted-foreground hover:text-foreground underline"
          >
            Skip for now
          </button>
        </div>
      </form>
    </div>
  )
}
