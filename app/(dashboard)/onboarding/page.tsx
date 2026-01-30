import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOnboardingStatus } from '@/lib/data/onboarding'
import { getBusiness } from '@/lib/actions/business'
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard'

/**
 * Onboarding page - guides new users through 2-step setup.
 *
 * Server component that:
 * - Redirects to /login if not authenticated
 * - Redirects to /dashboard if onboarding already complete
 * - Fetches business data for step components
 * - Renders wizard shell with 2-step flow
 *
 * Step 1: Business Name (required)
 * Step 2: Google Review Link (optional/skippable)
 */
export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string }>
}) {
  // Auth check
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check onboarding status
  const status = await getOnboardingStatus()

  // If already complete, go to dashboard
  if (status?.completed) {
    redirect('/dashboard')
  }

  // Parse step from URL params
  const params = await searchParams
  const stepParam = parseInt(params.step || '1', 10)

  // Validate step range (1-2), clamp if out of range
  const currentStep = Math.min(Math.max(1, stepParam), 2)

  // Fetch business data for step components
  const business = await getBusiness()

  return <OnboardingWizard initialStep={currentStep} business={business} />
}
