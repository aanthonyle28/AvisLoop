'use client'

import { BusinessBasicsStep } from './steps/business-basics-step'
import { ServicesOfferedStep } from './steps/services-offered-step'
import { CampaignPresetStep } from './steps/campaign-preset-step'
import { CustomerImportStep } from './steps/customer-import-step'
import { SMSConsentStep } from './steps/sms-consent-step'
import type { OnboardingBusiness } from '@/lib/types/onboarding'
import type { CampaignWithTouches } from '@/lib/types/database'

interface OnboardingStepsProps {
  currentStep: number
  business: OnboardingBusiness
  campaignPresets?: CampaignWithTouches[]
  onGoToNext: () => void
  onGoBack: () => void
  onComplete: () => Promise<void>
  isSubmitting: boolean
}

/**
 * Client component that renders the appropriate step component based on currentStep.
 * Steps 1-5: Business basics, services, campaign preset, import, SMS consent
 */
export function OnboardingSteps({
  currentStep,
  business,
  campaignPresets,
  onGoToNext,
  onGoBack,
  onComplete,
  isSubmitting,
}: OnboardingStepsProps) {
  switch (currentStep) {
    case 1:
      return (
        <BusinessBasicsStep
          onComplete={onGoToNext}
          defaultValues={{
            name: business?.name || '',
            phone: business?.phone || '',
            google_review_link: business?.google_review_link || '',
          }}
        />
      )

    case 2:
      return (
        <ServicesOfferedStep
          onComplete={onGoToNext}
          onGoBack={onGoBack}
          defaultEnabled={business?.service_types_enabled || []}
        />
      )

    case 3:
      return (
        <CampaignPresetStep
          onComplete={onGoToNext}
          onGoBack={onGoBack}
          presets={campaignPresets || []}
        />
      )

    case 4:
      return (
        <CustomerImportStep
          onComplete={onGoToNext}
          onGoBack={onGoBack}
        />
      )

    case 5:
      return (
        <SMSConsentStep
          onComplete={onComplete}
          onGoBack={onGoBack}
          isSubmitting={isSubmitting}
        />
      )

    default:
      return null
  }
}
