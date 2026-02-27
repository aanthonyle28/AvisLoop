import { createClient } from '@/lib/supabase/server'

/**
 * Onboarding status for current user's business.
 * Tracks overall completion and individual step status.
 */
export type OnboardingStatus = {
  completed: boolean
  completedAt: string | null
  steps: {
    hasBusinessProfile: boolean
    hasReviewLink: boolean
    hasPhone: boolean
    hasServiceTypes: boolean
    hasSMSConsent: boolean
    hasContacts: boolean
    hasSentMessage: boolean
  }
}

/**
 * Dashboard onboarding card completion status.
 * Tracks the 3 post-wizard onboarding cards (create contact, create template, send test).
 */
export type OnboardingCardStatus = {
  contact_created: boolean
  template_created: boolean
  test_sent: boolean
}

/**
 * Fetch onboarding status for the given business.
 * Caller is responsible for providing a verified businessId (from getActiveBusiness()).
 *
 * Steps checked:
 * - hasBusinessProfile: Business record exists
 * - hasReviewLink: google_review_link is set
 * - hasContacts: At least one active contact exists
 * - hasSentMessage: At least one send_log entry exists
 */
export async function getOnboardingStatus(businessId: string): Promise<OnboardingStatus | null> {
  const supabase = await createClient()

  // Get business with onboarding columns
  const { data: business } = await supabase
    .from('businesses')
    .select('id, onboarding_completed_at, google_review_link, phone, software_used, service_types_enabled, custom_service_names, sms_consent_acknowledged')
    .eq('id', businessId)
    .single()

  // No business means no steps completed
  if (!business) {
    return {
      completed: false,
      completedAt: null,
      steps: {
        hasBusinessProfile: false,
        hasReviewLink: false,
        hasPhone: false,
        hasServiceTypes: false,
        hasSMSConsent: false,
        hasContacts: false,
        hasSentMessage: false,
      }
    }
  }

  // Check if any active contacts exist
  const { count: contactCount } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .eq('status', 'active')

  // Check if any messages have been sent
  const { count: sendCount } = await supabase
    .from('send_logs')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId)

  return {
    completed: !!business.onboarding_completed_at,
    completedAt: business.onboarding_completed_at,
    steps: {
      hasBusinessProfile: true, // Business exists
      hasReviewLink: !!business.google_review_link,
      hasPhone: !!business.phone,
      hasServiceTypes: Array.isArray(business.service_types_enabled) && business.service_types_enabled.length > 0,
      hasSMSConsent: !!business.sms_consent_acknowledged,
      hasContacts: (contactCount ?? 0) > 0,
      hasSentMessage: (sendCount ?? 0) > 0,
    }
  }
}

/**
 * Get onboarding card completion status for the given business.
 * Auto-detects contact_created and template_created from database state.
 * test_sent is manual-only: set exclusively via markOnboardingCardStep('test_sent').
 * Caller is responsible for providing a verified businessId (from getActiveBusiness()).
 *
 * Checks:
 * - contact_created: At least one active contact exists (auto-detected)
 * - template_created: At least one email template exists (auto-detected)
 * - test_sent: Read from onboarding_steps_completed JSONB column only (manual)
 */
export async function getOnboardingCardStatus(businessId: string): Promise<OnboardingCardStatus> {
  const supabase = await createClient()

  const { data: business } = await supabase
    .from('businesses')
    .select('id, onboarding_steps_completed')
    .eq('id', businessId)
    .single()

  if (!business) {
    return { contact_created: false, template_created: false, test_sent: false }
  }

  // Read stored status from JSONB column
  const stored = (business.onboarding_steps_completed || {}) as Partial<OnboardingCardStatus>

  // If all stored as true, return immediately (no need to re-query)
  if (stored.contact_created && stored.template_created && stored.test_sent) {
    return stored as OnboardingCardStatus
  }

  // Auto-detect contact_created and template_created from database state
  const [contactResult, templateResult] = await Promise.all([
    supabase.from('customers').select('id', { count: 'exact', head: true }).eq('business_id', businessId).eq('status', 'active'),
    supabase.from('message_templates').select('id', { count: 'exact', head: true }).eq('business_id', businessId).eq('channel', 'email'),
  ])

  const detected: OnboardingCardStatus = {
    contact_created: (contactResult.count ?? 0) > 0,
    template_created: (templateResult.count ?? 0) > 0,
    test_sent: stored.test_sent || false,
  }

  // If any newly detected, persist to JSONB column for faster future reads
  const needsUpdate = Object.entries(detected).some(
    ([key, val]) => val && !stored[key as keyof OnboardingCardStatus]
  )
  if (needsUpdate) {
    await supabase
      .from('businesses')
      .update({ onboarding_steps_completed: detected })
      .eq('id', businessId)
  }

  return detected
}

/**
 * Helper to check if all onboarding cards are complete.
 */
export function areAllCardsComplete(status: OnboardingCardStatus): boolean {
  return status.contact_created && status.template_created && status.test_sent
}

/**
 * Get setup progress for the setup pill/drawer UI.
 * Uses V2 checklist data (jobs-centric, not contacts-centric).
 * Caller is responsible for providing a verified businessId (from getActiveBusiness()).
 */
export async function getSetupProgress(businessId: string) {
  // Import checklist data function
  const { getChecklistState } = await import('./checklist')
  return getChecklistState(businessId)
}
