'use client'

import { BusinessSetupStep } from './steps/business-setup-step'
import { CampaignPresetStep } from './steps/campaign-preset-step'
import { BrandVoiceStep } from './steps/brand-voice-step'
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
 * Steps: 1. Business setup, 2. Campaign preset, 3. Brand voice, 4. SMS consent
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
        <BrandVoiceStep
          onComplete={onGoToNext}
          onGoBack={onGoBack}
          defaultValue={business?.brand_voice || null}
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
