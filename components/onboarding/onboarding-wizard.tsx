'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { z } from 'zod'
import { OnboardingProgress } from './onboarding-progress'
import { OnboardingSteps } from './onboarding-steps'
import { markOnboardingComplete } from '@/lib/actions/onboarding'
import type { OnboardingBusiness } from '@/lib/types/onboarding'
import type { CampaignWithTouches } from '@/lib/types/database'

// Schema for localStorage draft data validation (SEC-04)
// Using safeParse instead of catch for Zod 4 compatibility
const draftDataSchema = z.record(z.string(), z.unknown())

type StepConfig = {
  id: number
  title: string
  skippable: boolean
}

const STEPS: StepConfig[] = [
  { id: 1, title: 'Business Basics', skippable: false },
  { id: 2, title: 'Review Destination', skippable: true },
  { id: 3, title: 'Services Offered', skippable: false },
  { id: 4, title: 'Software Used', skippable: true },
  { id: 5, title: 'Campaign Preset', skippable: false },
  { id: 6, title: 'Import Customers', skippable: true },
  { id: 7, title: 'SMS Consent', skippable: false },
]

const STORAGE_KEY = 'onboarding-draft'

interface OnboardingWizardProps {
  initialStep: number
  business: OnboardingBusiness
  campaignPresets?: CampaignWithTouches[] // For step 5
}

/**
 * Onboarding wizard shell with step navigation and draft persistence.
 *
 * Manages:
 * - Step navigation via URL params
 * - Draft data persistence in localStorage
 * - Completion marking in database
 *
 * Renders OnboardingSteps internally with navigation callbacks.
 */
export function OnboardingWizard({
  initialStep,
  business,
  campaignPresets,
}: OnboardingWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [draftData, setDraftDataState] = useState<Record<string, unknown>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load draft data from localStorage on mount with Zod validation (SEC-04)
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        const result = draftDataSchema.safeParse(parsed)
        if (result.success) {
          setDraftDataState(result.data)
        } else {
          console.error('Invalid onboarding draft data:', result.error)
          localStorage.removeItem(STORAGE_KEY)
        }
      } catch (e) {
        console.error('Failed to parse onboarding draft:', e)
        localStorage.removeItem(STORAGE_KEY)
      }
    }
  }, [])

  // Save draft data to localStorage whenever it changes
  useEffect(() => {
    if (Object.keys(draftData).length > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(draftData))
    }
  }, [draftData])

  // Navigation functions
  const goToStep = useCallback(
    (step: number) => {
      if (isSubmitting) return
      if (step < 1 || step > STEPS.length) return

      setCurrentStep(step)
      router.push(`/onboarding?step=${step}`, { scroll: false })
    },
    [isSubmitting, router]
  )

  const goToNext = useCallback(() => {
    if (currentStep < STEPS.length) {
      goToStep(currentStep + 1)
    }
  }, [currentStep, goToStep])

  const goBack = useCallback(() => {
    if (currentStep > 1) {
      goToStep(currentStep - 1)
    }
  }, [currentStep, goToStep])

  // Completion handler
  const handleComplete = useCallback(async () => {
    if (isSubmitting) return

    setIsSubmitting(true)
    try {
      // Clear localStorage draft
      localStorage.removeItem(STORAGE_KEY)

      // Mark complete in database
      await markOnboardingComplete()

      // Redirect to dashboard with success indicator
      router.push('/dashboard?onboarding=complete')
    } finally {
      setIsSubmitting(false)
    }
  }, [isSubmitting, router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 pb-20">
      <div className="w-full max-w-lg space-y-8">
        {/* Step content */}
        <OnboardingSteps
          currentStep={currentStep}
          business={business}
          campaignPresets={campaignPresets}
          onGoToNext={goToNext}
          onGoBack={goBack}
          onComplete={handleComplete}
          isSubmitting={isSubmitting}
        />
      </div>

      {/* Progress bar fixed at bottom */}
      <OnboardingProgress currentStep={currentStep} totalSteps={STEPS.length} />
    </div>
  )
}
