'use client'

import { BusinessSetupStep } from './steps/business-setup-step'
import { CampaignPresetStep } from './steps/campaign-preset-step'
import { CRMPlatformStep } from './steps/crm-platform-step'
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
 * Steps 1-4: Business setup (basics + services), campaign preset, CRM platform, SMS consent
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
        <BusinessSetupStep
          onComplete={onGoToNext}
          defaultValues={{
            name: business?.name || '',
            phone: business?.phone || '',
            google_review_link: business?.google_review_link || '',
          }}
          defaultEnabled={business?.service_types_enabled || []}
          defaultCustomServiceNames={business?.custom_service_names || []}
        />
      )

    case 2:
      return (
        <CampaignPresetStep
          onComplete={onGoToNext}
          onGoBack={onGoBack}
          presets={campaignPresets || []}
        />
      )

    case 3:
      return (
        <CRMPlatformStep
          onComplete={onGoToNext}
          onGoBack={onGoBack}
          defaultValue={business?.software_used || null}
        />
      )

    case 4:
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
