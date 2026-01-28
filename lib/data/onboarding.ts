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
    hasContacts: boolean
    hasSentMessage: boolean
  }
}

/**
 * Fetch onboarding status for current user's business.
 * Returns null if user is not authenticated.
 *
 * Steps checked:
 * - hasBusinessProfile: Business record exists
 * - hasReviewLink: google_review_link is set
 * - hasContacts: At least one active contact exists
 * - hasSentMessage: At least one send_log entry exists
 */
export async function getOnboardingStatus(): Promise<OnboardingStatus | null> {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return null
  }

  // Get business with onboarding columns
  const { data: business } = await supabase
    .from('businesses')
    .select('id, onboarding_completed_at, google_review_link')
    .eq('user_id', user.id)
    .single()

  // No business means no steps completed
  if (!business) {
    return {
      completed: false,
      completedAt: null,
      steps: {
        hasBusinessProfile: false,
        hasReviewLink: false,
        hasContacts: false,
        hasSentMessage: false,
      }
    }
  }

  // Check if any active contacts exist
  const { count: contactCount } = await supabase
    .from('contacts')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', business.id)
    .eq('status', 'active')

  // Check if any messages have been sent
  const { count: sendCount } = await supabase
    .from('send_logs')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', business.id)

  return {
    completed: !!business.onboarding_completed_at,
    completedAt: business.onboarding_completed_at,
    steps: {
      hasBusinessProfile: true, // Business exists
      hasReviewLink: !!business.google_review_link,
      hasContacts: (contactCount ?? 0) > 0,
      hasSentMessage: (sendCount ?? 0) > 0,
    }
  }
}
