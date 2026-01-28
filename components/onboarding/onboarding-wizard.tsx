'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { OnboardingProgress } from './onboarding-progress'
import { OnboardingSteps } from './onboarding-steps'
import { markOnboardingComplete } from '@/lib/actions/onboarding'
import { Button } from '@/components/ui/button'

type StepConfig = {
  id: number
  title: string
  skippable: boolean
}

const STEPS: StepConfig[] = [
  { id: 1, title: 'Business Info', skippable: false },
  { id: 2, title: 'Add Contact', skippable: true },
  { id: 3, title: 'Send Request', skippable: false },
]

const STORAGE_KEY = 'onboarding-draft'

type Business = {
  name: string
  google_review_link: string | null
} | null

type Contact = {
  id: string
  name: string
  email: string
} | null

type Template = {
  id: string
  subject: string
  body: string
} | null

interface OnboardingWizardProps {
  initialStep: number
  business: Business
  firstContact: Contact
  defaultTemplate: Template
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
  firstContact,
  defaultTemplate,
}: OnboardingWizardProps) {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [draftData, setDraftDataState] = useState<Record<string, unknown>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Load draft data from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      try {
        setDraftDataState(JSON.parse(saved))
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

  // Draft data setter
  const setDraftData = useCallback((key: string, value: unknown) => {
    setDraftDataState(prev => ({ ...prev, [key]: value }))
  }, [])

  const currentStepConfig = STEPS[currentStep - 1]
  const stepTitles = STEPS.map(s => s.title)

  return (
    <div className="space-y-8">
      {/* Progress indicator */}
      <OnboardingProgress
        currentStep={currentStep}
        totalSteps={STEPS.length}
        stepTitles={stepTitles}
      />

      {/* Step content */}
      <div className="bg-card rounded-lg border p-6 shadow-sm">
        <OnboardingSteps
          currentStep={currentStep}
          business={business}
          firstContact={firstContact}
          defaultTemplate={defaultTemplate}
          onGoToNext={goToNext}
          onGoToStep={goToStep}
          onComplete={handleComplete}
        />
      </div>

      {/* Skip button for skippable steps */}
      {currentStepConfig?.skippable && currentStep < STEPS.length && (
        <div className="text-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToNext}
            disabled={isSubmitting}
            className="text-muted-foreground hover:text-foreground"
          >
            Skip this step
          </Button>
          <p className="text-xs text-muted-foreground mt-1">
            You can add contacts later from the Contacts page
          </p>
        </div>
      )}
    </div>
  )
}
