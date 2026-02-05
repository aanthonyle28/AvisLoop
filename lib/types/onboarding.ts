// Shared types for onboarding components
// Used by onboarding-wizard.tsx and onboarding-steps.tsx

export type OnboardingBusiness = {
  name: string
  phone: string | null
  google_review_link: string | null
  software_used: string | null
  service_types_enabled: string[] | null
  sms_consent_acknowledged: boolean
} | null

export type OnboardingContact = {
  id: string
  name: string
  email: string
} | null

export type OnboardingTemplate = {
  id: string
  subject: string
  body: string
} | null
