/**
 * Horizontal progress bar for onboarding wizard.
 * Fixed at bottom of page with step counter (e.g. "1/2").
 */
export function OnboardingProgress({
  currentStep,
  totalSteps,
}: {
  currentStep: number
  totalSteps: number
}) {
  const progress = (currentStep / totalSteps) * 100

  return (
    <div
      className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t"
      role="progressbar"
      aria-valuenow={currentStep}
      aria-valuemin={1}
      aria-valuemax={totalSteps}
      aria-label={`Onboarding progress: Step ${currentStep} of ${totalSteps}`}
    >
      <div className="max-w-lg mx-auto flex items-center gap-3">
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-sm text-muted-foreground font-medium">
          {currentStep}/{totalSteps}
        </span>
      </div>
    </div>
  )
}
