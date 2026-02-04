import { CheckCircle } from 'lucide-react'
import { REVIEW_PAGE_COPY } from '@/lib/review/routing'

interface ThankYouCardProps {
  /** 'google' for 4-5 star path, 'feedback' for 1-3 star path */
  destination: 'google' | 'feedback'
  businessName: string
}

/**
 * Confirmation card shown after rating submission.
 *
 * For Google path: Shows brief thanks before redirect
 * For Feedback path: Shows appreciation message after form submission
 */
export function ThankYouCard({ destination, businessName }: ThankYouCardProps) {
  const message =
    destination === 'google'
      ? REVIEW_PAGE_COPY.thankYouGoogle
      : REVIEW_PAGE_COPY.thankYouFeedback

  return (
    <div className="text-center space-y-6">
      <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
        <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
      </div>

      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">Thank You!</h2>
        <p className="text-muted-foreground">{message}</p>
      </div>

      <p className="text-sm text-muted-foreground">
        — The {businessName} Team
      </p>
    </div>
  )
}

/**
 * Loading state while redirecting to Google.
 * Shows for 4-5 star ratings before redirect.
 */
export function RedirectingCard({ businessName }: { businessName: string }) {
  return (
    <div className="text-center space-y-6">
      <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
        <span className="text-2xl">⭐</span>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Thank you for your feedback!</h2>
        <p className="text-muted-foreground">
          Redirecting you to share your experience with {businessName}...
        </p>
      </div>

      <div className="flex justify-center">
        <div className="animate-spin rounded-full h-5 w-5 border-2 border-primary border-t-transparent" />
      </div>
    </div>
  )
}
