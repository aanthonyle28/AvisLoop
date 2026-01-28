import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOnboardingStatus } from '@/lib/data/onboarding'
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard'

/**
 * Onboarding page - guides new users through initial setup.
 *
 * Server component that:
 * - Redirects to /login if not authenticated
 * - Redirects to /dashboard if onboarding already complete
 * - Renders wizard shell with step from URL params
 *
 * Step content is wired in 07-04 after step components are created.
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

  return (
    <div className="container mx-auto py-8 px-4 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-center">Welcome to AvisLoop</h1>
        <p className="text-muted-foreground text-center mt-2">
          Let&apos;s get your business set up to collect reviews
        </p>
      </div>

      <OnboardingWizard initialStep={currentStep}>
        {({ goToNext, handleComplete }) => (
          <div className="p-4 text-center text-muted-foreground">
            {/* Step components wired in 07-04 Task 4 */}
            <p>Step {currentStep} content will be added in the next plan.</p>
            <div className="mt-4 space-x-2">
              {currentStep < 3 ? (
                <button
                  onClick={goToNext}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  Continue
                </button>
              ) : (
                <button
                  onClick={handleComplete}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                >
                  Complete Setup
                </button>
              )}
            </div>
          </div>
        )}
      </OnboardingWizard>
    </div>
  )
}
