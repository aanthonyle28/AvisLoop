'use client'

import { BusinessStep } from './steps/business-step'
import { ContactStep } from './steps/contact-step'
import { SendStep } from './steps/send-step'
import type {
  OnboardingBusiness,
  OnboardingContact,
  OnboardingTemplate,
} from '@/lib/types/onboarding'

interface OnboardingStepsProps {
  currentStep: number
  business: OnboardingBusiness
  firstContact: OnboardingContact
  defaultTemplate: OnboardingTemplate
  onGoToNext: () => void
  onGoToStep: (step: number) => void
  onComplete: () => Promise<void>
}

/**
 * Client component that renders the appropriate step component based on currentStep.
 * Wires wizard navigation callbacks to step component props.
 */
export function OnboardingSteps({
  currentStep,
  business,
  firstContact,
  defaultTemplate,
  onGoToNext,
  onGoToStep,
  onComplete,
}: OnboardingStepsProps) {
  switch (currentStep) {
    case 1:
      // BusinessStep.onComplete -> advance to step 2
      return (
        <BusinessStep
          onComplete={onGoToNext}
          defaultValues={{
            name: business?.name || '',
            google_review_link: business?.google_review_link || '',
          }}
        />
      )

    case 2:
      // ContactStep.onComplete -> advance to step 3
      // ContactStep.onSkip -> advance to step 3
      // Note: businessId NOT needed - createContact derives from session
      return <ContactStep onComplete={onGoToNext} onSkip={onGoToNext} />

    case 3:
      // SendStep.onComplete -> mark complete and redirect to dashboard
      // Pass business data, first contact, and default template
      return (
        <SendStep
          contact={firstContact}
          business={{
            name: business?.name || '',
            google_review_link: business?.google_review_link || null,
          }}
          template={defaultTemplate}
          onComplete={onComplete}
          onGoToStep={onGoToStep}
        />
      )

    default:
      // Fallback - should not happen due to step clamping
      return null
  }
}
