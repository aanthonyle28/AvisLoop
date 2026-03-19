import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOnboardingStatus } from '@/lib/data/onboarding'
import { getActiveBusiness } from '@/lib/data/active-business'
import { getBusiness } from '@/lib/data/business'
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard'
import { CreateBusinessWizard } from '@/components/onboarding/create-business-wizard'
import { WebDesignSetupForm } from '@/components/onboarding/web-design-setup-form'

/**
 * Onboarding page - standalone full-screen experience (no dashboard shell).
 *
 * Server component that:
 * - Redirects to /login if not authenticated
 * - Redirects to /dashboard if onboarding already complete
 * - Fetches business data and campaign presets for step components
 * - Renders wizard shell with 5-step flow
 *
 * Step 1: Business Setup (basics + services)
 * Step 2: Campaign Preset (required)
 * Step 3: CRM Platform (skippable)
 * Step 4: Brand Voice (skippable)
 * Step 5: SMS Consent (required)
 */
export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string; mode?: string; businessId?: string }>
}) {
  // Auth check
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Parse params early — mode=new bypasses the "already completed" redirect
  const params = await searchParams
  const isNewBusinessMode = params.mode === 'new'
  const isReviewSetupMode = params.mode === 'review-setup'
  const isWebDesignSetupMode = params.mode === 'web-design-setup'
  const targetBusinessId = params.businessId ?? null

  // Get active business (may be null for brand-new users)
  const activeBusiness = await getActiveBusiness()

  // Check onboarding status (handles null business gracefully)
  const status = activeBusiness ? await getOnboardingStatus(activeBusiness.id) : null

  // If already complete, go to dashboard — UNLESS we're creating a new business or setting up review
  if (status?.completed && !isNewBusinessMode && !isReviewSetupMode && !isWebDesignSetupMode) {
    redirect('/dashboard')
  }

  // Parse step from URL params
  const stepParam = parseInt(params.step || '1', 10) || 1

  // Validate step range (1-5), clamp if out of range
  const currentStep = Math.min(Math.max(1, stepParam), 5)

  // Fetch full business data for step components
  const business = activeBusiness ? await getBusiness(activeBusiness.id) : null

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
    custom_service_names: business.custom_service_names || null,
    sms_consent_acknowledged: business.sms_consent_acknowledged || false,
    brand_voice: business.brand_voice || null,
  } : null

  // Review setup mode — for existing web_design businesses upgrading to review management
  if (isReviewSetupMode && targetBusinessId) {
    // Switch to the target business first if needed
    const targetBusiness = targetBusinessId
      ? await getBusiness(targetBusinessId)
      : business

    const reviewSetupBusiness = targetBusiness ? {
      name: targetBusiness.name,
      phone: targetBusiness.phone || null,
      google_review_link: targetBusiness.google_review_link || null,
      software_used: targetBusiness.software_used || null,
      service_types_enabled: targetBusiness.service_types_enabled || null,
      custom_service_names: targetBusiness.custom_service_names || null,
      sms_consent_acknowledged: targetBusiness.sms_consent_acknowledged || false,
      brand_voice: targetBusiness.brand_voice || null,
    } : null

    return (
      <OnboardingWizard
        initialStep={1}
        business={reviewSetupBusiness}
        campaignPresets={presets || []}
      />
    )
  }

  // Web design setup mode — for existing reputation businesses adding web design
  if (isWebDesignSetupMode && targetBusinessId) {
    return <WebDesignSetupForm businessId={targetBusinessId} />
  }

  if (isNewBusinessMode) {
    return (
      <CreateBusinessWizard
        campaignPresets={presets || []}
      />
    )
  }

  return (
    <OnboardingWizard
      initialStep={currentStep}
      business={onboardingBusiness}
      campaignPresets={presets || []}
    />
  )
}
