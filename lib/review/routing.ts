/**
 * Review destination routing based on satisfaction rating.
 * 4-5 stars -> Google review link
 * 1-3 stars -> Private feedback form
 *
 * IMPORTANT: Language must be FTC-compliant. Use "share your experience"
 * framing, NOT "leave a review if happy" (that's review gating).
 */

export type ReviewDestination = {
  type: 'google' | 'feedback'
  message: string
}

/**
 * Determine where to route the customer based on their satisfaction rating.
 *
 * FTC Compliance Note:
 * - We route satisfied customers (4-5) to Google as a convenience
 * - We offer dissatisfied customers (1-3) a private feedback option
 * - The language must frame this as "sharing experience" not "leave review if happy"
 * - Customers can still find Google reviews independently (we don't block access)
 *
 * @param rating - Customer's satisfaction rating (1-5)
 * @returns Destination type and confirmation message
 */
export function getReviewDestination(rating: number): ReviewDestination {
  // 4-5 stars: satisfied -> Google review
  if (rating >= 4) {
    return {
      type: 'google',
      message: "Thank you for sharing! We'd love to hear more about your experience.",
    }
  }

  // 1-3 stars: less satisfied -> private feedback
  return {
    type: 'feedback',
    message: 'We appreciate your feedback and want to make things right.',
  }
}

/**
 * Rating threshold for Google vs feedback routing.
 * Export for UI components that need to know the boundary.
 */
export const GOOGLE_THRESHOLD = 4

/**
 * Get human-readable description for a rating.
 * Used for accessibility and screen readers.
 */
export function getRatingLabel(rating: number): string {
  switch (rating) {
    case 1:
      return 'Very dissatisfied'
    case 2:
      return 'Dissatisfied'
    case 3:
      return 'Neutral'
    case 4:
      return 'Satisfied'
    case 5:
      return 'Very satisfied'
    default:
      return 'Unknown'
  }
}

/**
 * Compliant page title and header text.
 * NEVER use conditional language like "if you're happy" or "for satisfied customers".
 */
export const REVIEW_PAGE_COPY = {
  // Main heading - neutral, asks everyone the same thing
  heading: 'How was your experience?',

  // Subheading - frames as feedback, not review request
  subheading: 'Your honest feedback helps us serve you better',

  // Footer disclaimer - required for FTC compliance
  footer: 'We value all feedback and use it to improve our service.',

  // Button text for submitting rating
  submitButton: 'Continue',

  // Feedback form heading (1-3 stars path)
  feedbackHeading: "We'd love to hear more",
  feedbackSubheading: 'Please share any details about your experience so we can improve.',

  // Thank you messages
  thankYouGoogle: 'Thank you! Your feedback helps other customers find great service.',
  thankYouFeedback: "Thank you for your feedback. We'll use it to improve.",
} as const
