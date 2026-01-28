import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOnboardingStatus } from '@/lib/data/onboarding'
import { getBusiness, getEmailTemplates } from '@/lib/actions/business'
import { getContacts } from '@/lib/actions/contact'
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard'
import { OnboardingSteps } from '@/components/onboarding/onboarding-steps'

/**
 * Onboarding page - guides new users through initial setup.
 *
 * Server component that:
 * - Redirects to /login if not authenticated
 * - Redirects to /dashboard if onboarding already complete
 * - Fetches data needed for all step components
 * - Renders wizard shell with step components
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

  // Validate step range (1-3), clamp if out of range
  const currentStep = Math.min(Math.max(1, stepParam), 3)

  // Fetch data needed for step components in parallel
  const [business, contactsData, templates] = await Promise.all([
    getBusiness(),
    getContacts({ limit: 1 }), // Get first contact for SendStep
    getEmailTemplates(),
  ])

  // First contact for SendStep (if any exist)
  const firstContact = contactsData.contacts[0] || null

  // Default template for SendStep
  const defaultTemplate =
    templates.find((t) => t.is_default) || templates[0] || null

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-center">Welcome to AvisLoop</h1>
        <p className="text-muted-foreground text-center mt-2">
          Let&apos;s get your business set up to collect reviews
        </p>
      </div>

      <OnboardingWizard initialStep={currentStep}>
        {({ goToNext, goToStep, handleComplete }) => (
          <OnboardingSteps
            currentStep={currentStep}
            business={business}
            firstContact={firstContact}
            defaultTemplate={defaultTemplate}
            onGoToNext={goToNext}
            onGoToStep={goToStep}
            onComplete={handleComplete}
          />
        )}
      </OnboardingWizard>
    </div>
  )
}
