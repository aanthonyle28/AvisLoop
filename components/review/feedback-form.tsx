'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { REVIEW_PAGE_COPY } from '@/lib/review/routing'

const feedbackFormSchema = z.object({
  feedback_text: z
    .string()
    .min(1, 'Please share your feedback')
    .max(5000, 'Feedback must be less than 5000 characters'),
})

type FeedbackFormValues = z.infer<typeof feedbackFormSchema>

interface FeedbackFormProps {
  token: string
  rating: number
  businessName: string
  onSuccess: () => void
}

/**
 * Private feedback form for customers who rated 1-3 stars.
 * Collects written feedback that goes to business owner (not public).
 *
 * Note: FTC compliance - this is NOT blocking negative reviews.
 * Customers can still find and use Google reviews independently.
 * This is an OPTION for customers who want to share feedback privately.
 */
export function FeedbackForm({ token, rating, businessName, onSuccess }: FeedbackFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FeedbackFormValues>({
    resolver: zodResolver(feedbackFormSchema),
    defaultValues: {
      feedback_text: '',
    },
  })

  const feedbackText = watch('feedback_text')
  const charCount = feedbackText?.length || 0

  const onSubmit = async (data: FeedbackFormValues) => {
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          rating,
          feedback_text: data.feedback_text,
        }),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Failed to submit feedback')
      }

      onSuccess()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-2">{REVIEW_PAGE_COPY.feedbackHeading}</h2>
        <p className="text-muted-foreground">{REVIEW_PAGE_COPY.feedbackSubheading}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="feedback_text" className="sr-only">
            Your feedback
          </label>
          <textarea
            id="feedback_text"
            {...register('feedback_text')}
            placeholder={`What could ${businessName} have done better?`}
            rows={5}
            disabled={isSubmitting}
            className="w-full px-4 py-3 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none disabled:opacity-50"
            aria-describedby={errors.feedback_text ? 'feedback-error' : 'char-count'}
          />

          <div className="flex justify-between mt-2 text-sm">
            {errors.feedback_text ? (
              <p id="feedback-error" className="text-destructive">
                {errors.feedback_text.message}
              </p>
            ) : (
              <span />
            )}
            <p
              id="char-count"
              className={charCount > 4500 ? 'text-warning' : 'text-muted-foreground'}
            >
              {charCount.toLocaleString()} / 5,000
            </p>
          </div>
        </div>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
        </Button>
      </form>

      <p className="text-xs text-center text-muted-foreground">{REVIEW_PAGE_COPY.footer}</p>
    </div>
  )
}
