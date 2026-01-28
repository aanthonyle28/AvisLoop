import { CheckCircle } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Visual step progress indicator for onboarding wizard.
 * Shows completed/current/pending states with connecting lines.
 * Responsive: full stepper on desktop, compact text on mobile.
 */
export function OnboardingProgress({
  currentStep,
  totalSteps,
  stepTitles,
}: {
  currentStep: number
  totalSteps: number
  stepTitles: string[]
}) {
  const steps = Array.from({ length: totalSteps }, (_, i) => i + 1)

  return (
    <div
      className="w-full"
      role="group"
      aria-label={`Onboarding progress: Step ${currentStep} of ${totalSteps}`}
    >
      {/* Mobile: Compact step indicator */}
      <div className="md:hidden text-center" aria-hidden="true">
        <span className="text-sm font-medium text-muted-foreground">
          Step {currentStep} of {totalSteps}
        </span>
        <p className="text-sm font-semibold">{stepTitles[currentStep - 1]}</p>
      </div>

      {/* Desktop: Full horizontal stepper */}
      <nav
        className="hidden md:flex items-start justify-between"
        aria-label="Onboarding steps"
      >
        {steps.map((step, index) => (
          <div key={step} className="flex items-center flex-1">
            {/* Step circle and title */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors',
                  step < currentStep &&
                    'bg-primary border-primary text-primary-foreground',
                  step === currentStep && 'border-primary text-primary',
                  step > currentStep &&
                    'border-muted-foreground/30 text-muted-foreground/50'
                )}
                aria-current={step === currentStep ? 'step' : undefined}
                aria-label={`Step ${step}: ${stepTitles[index]}${step < currentStep ? ' (completed)' : ''}`}
              >
                {step < currentStep ? (
                  <CheckCircle className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <span className="text-sm font-medium" aria-hidden="true">{step}</span>
                )}
              </div>
              {/* Step title */}
              <span
                className={cn(
                  'mt-2 text-xs font-medium text-center max-w-[80px]',
                  step < currentStep && 'text-muted-foreground',
                  step === currentStep && 'text-foreground',
                  step > currentStep && 'text-muted-foreground/50'
                )}
                aria-hidden="true"
              >
                {stepTitles[index]}
              </span>
            </div>

            {/* Connecting line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  'flex-1 h-0.5 mx-4 mt-5 -translate-y-1/2',
                  step < currentStep ? 'bg-primary' : 'bg-muted-foreground/30'
                )}
                aria-hidden="true"
              />
            )}
          </div>
        ))}
      </nav>
    </div>
  )
}
