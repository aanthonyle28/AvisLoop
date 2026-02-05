'use client'

import { BusinessBasicsStep } from './steps/business-basics-step'
import { ReviewDestinationStep } from './steps/review-destination-step'
import { ServicesOfferedStep } from './steps/services-offered-step'
import { SoftwareUsedStep } from './steps/software-used-step'
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
 * Steps 1-4: Business basics, review link, services, software
 * Steps 5-7: Campaign preset, customer import, SMS consent
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
        <ReviewDestinationStep
          onComplete={onGoToNext}
          onGoBack={onGoBack}
          defaultLink={business?.google_review_link || ''}
        />
      )

    case 3:
      return (
        <ServicesOfferedStep
          onComplete={onGoToNext}
          onGoBack={onGoBack}
          defaultEnabled={business?.service_types_enabled || []}
        />
      )

    case 4:
      return (
        <SoftwareUsedStep
          onComplete={onGoToNext}
          onGoBack={onGoBack}
          defaultValue={business?.software_used || ''}
        />
      )

    case 5:
      return (
        <CampaignPresetStep
          onComplete={onGoToNext}
          onGoBack={onGoBack}
          presets={campaignPresets || []}
        />
      )

    case 6:
      return (
        <CustomerImportStep
          onComplete={onGoToNext}
          onGoBack={onGoBack}
        />
      )

    case 7:
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
