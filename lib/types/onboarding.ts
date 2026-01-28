// Shared types for onboarding components
// Used by onboarding-wizard.tsx and onboarding-steps.tsx

export type OnboardingBusiness = {
  name: string
  google_review_link: string | null
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
