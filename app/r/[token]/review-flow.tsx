'use client'

import { useState, useCallback } from 'react'
import { SatisfactionRating } from '@/components/review/satisfaction-rating'
import { FeedbackForm } from '@/components/review/feedback-form'
import { ThankYouCard, RedirectingCard } from '@/components/review/thank-you-card'
import { Button } from '@/components/ui/button'
import { getReviewDestination, REVIEW_PAGE_COPY, GOOGLE_THRESHOLD } from '@/lib/review/routing'

type FlowStep = 'rating' | 'feedback' | 'redirecting' | 'complete'

interface ReviewFlowProps {
  token: string
  customer: { id: string; name: string }
  business: { id: string; name: string; googleReviewLink: string | null }
  enrollmentId?: string
  hasGoogleLink: boolean
}

/**
 * Interactive review flow orchestrator.
 *
 * Steps:
 * 1. Rating: Show star selection
 * 2a. 4-5 stars + Google link: Show redirecting, then redirect
 * 2b. 4-5 stars + no Google link: Show thank you (no redirect possible)
 * 2c. 1-3 stars: Show feedback form
 * 3. Complete: Show thank you card
 */
export function ReviewFlow({
  token,
  customer,
  business,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Reserved for Phase 26-06 API route
  enrollmentId,
  hasGoogleLink,
}: ReviewFlowProps) {
  const [step, setStep] = useState<FlowStep>('rating')
  const [rating, setRating] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Record the rating and stop enrollment if applicable.
   * Called for both Google redirect (4-5) and feedback form (1-3) paths.
   */
  const recordRatingAndStop = useCallback(async (selectedRating: number, destination: 'google' | 'feedback') => {
    try {
      const response = await fetch('/api/review/rate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          rating: selectedRating,
          destination,
        }),
      })

      if (!response.ok) {
        console.error('Failed to record rating')
        // Don't block the flow on API errors
      }
    } catch (err) {
      console.error('Rating record error:', err)
    }
  }, [token])

  /**
   * Handle rating selection and route to appropriate next step.
   */
  const handleRatingSubmit = async () => {
    if (rating === 0) return

    setIsSubmitting(true)
    setError(null)

    const destination = getReviewDestination(rating)

    // Record rating and stop enrollment
    await recordRatingAndStop(rating, destination.type)

    if (destination.type === 'google') {
      // 4-5 stars: redirect to Google
      if (hasGoogleLink && business.googleReviewLink) {
        setStep('redirecting')
        // Short delay for UX, then redirect
        setTimeout(() => {
          window.location.href = business.googleReviewLink!
        }, 1500)
      } else {
        // No Google link configured - show thank you
        setStep('complete')
      }
    } else {
      // 1-3 stars: show feedback form
      setStep('feedback')
    }

    setIsSubmitting(false)
  }

  /**
   * Handle feedback form submission success.
   */
  const handleFeedbackSuccess = () => {
    setStep('complete')
  }

  // === Render based on current step ===

  if (step === 'complete') {
    return (
      <ThankYouCard
        destination={rating >= GOOGLE_THRESHOLD ? 'google' : 'feedback'}
        businessName={business.name}
      />
    )
  }

  if (step === 'redirecting') {
    return <RedirectingCard businessName={business.name} />
  }

  if (step === 'feedback') {
    return (
      <FeedbackForm
        token={token}
        rating={rating}
        businessName={business.name}
        onSuccess={handleFeedbackSuccess}
      />
    )
  }

  // Default: rating step
  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Hi {customer.name}!</h1>
        <p className="text-muted-foreground">{REVIEW_PAGE_COPY.heading}</p>
      </div>

      {/* Star rating */}
      <div className="py-4">
        <SatisfactionRating
          value={rating}
          onChange={setRating}
          disabled={isSubmitting}
        />
      </div>

      {/* Submit button */}
      <div className="space-y-4">
        <Button
          onClick={handleRatingSubmit}
          disabled={rating === 0 || isSubmitting}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? 'Processing...' : REVIEW_PAGE_COPY.submitButton}
        </Button>

        {error && (
          <p className="text-sm text-center text-destructive" role="alert">
            {error}
          </p>
        )}
      </div>

      {/* Subheading - neutral language */}
      <p className="text-center text-sm text-muted-foreground">
        {REVIEW_PAGE_COPY.subheading}
      </p>

      {/* No Google link warning (only shown to dev/debug) */}
      {!hasGoogleLink && process.env.NODE_ENV === 'development' && (
        <p className="text-xs text-center text-amber-600">
          [Dev] Google review link not configured for this business
        </p>
      )}
    </div>
  )
}
