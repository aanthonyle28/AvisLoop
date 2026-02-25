import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOnboardingStatus } from '@/lib/data/onboarding'
import { getBusiness } from '@/lib/actions/business'
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard'

/**
 * Onboarding page - standalone full-screen experience (no dashboard shell).
 *
 * Server component that:
 * - Redirects to /login if not authenticated
 * - Redirects to /dashboard if onboarding already complete
 * - Fetches business data and campaign presets for step components
 * - Renders wizard shell with 4-step flow
 *
 * Step 1: Business Setup (basics + services)
 * Step 2: Campaign Preset (required)
 * Step 3: CRM Platform (skippable)
 * Step 4: SMS Consent (required)
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
  const stepParam = parseInt(params.step || '1', 10) || 1

  // Validate step range (1-4), clamp if out of range
  const currentStep = Math.min(Math.max(1, stepParam), 4)

  // Fetch business data for step components
  const business = await getBusiness()

  // Fetch campaign presets for step 3 (system presets available to all users)
  const { data: presets } = await supabase
    .from('campaigns')
    .select('*, campaign_touches (*)')
    .eq('is_preset', true)
    .order('name')

  // Map business data to OnboardingBusiness type
  const onboardingBusiness = business ? {
    name: business.name,
    phone: business.phone || null,
    google_review_link: business.google_review_link || null,
    software_used: business.software_used || null,
    service_types_enabled: business.service_types_enabled || null,
    sms_consent_acknowledged: business.sms_consent_acknowledged || false,
  } : null

  return (
    <OnboardingWizard
      initialStep={currentStep}
      business={onboardingBusiness}
      campaignPresets={presets || []}
    />
  )
}
