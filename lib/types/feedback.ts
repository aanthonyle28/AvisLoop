/**
 * Customer Feedback Types
 * Phase 26: Review Funnel
 *
 * Feedback is collected from customers who rate their experience 1-3 stars.
 * Higher ratings (4-5) are routed to Google reviews instead.
 */

/**
 * Base feedback record from customer_feedback table.
 */
export interface CustomerFeedback {
  id: string
  business_id: string
  customer_id: string
  enrollment_id: string | null

  // Rating and content
  rating: number // 1-5, though typically 1-3 for feedback path
  feedback_text: string | null

  // Timestamps
  submitted_at: string
  created_at: string
  updated_at: string

  // Resolution workflow
  resolved_at: string | null
  resolved_by: string | null
  internal_notes: string | null
}

/**
 * Feedback with customer details for dashboard display.
 */
export interface FeedbackWithCustomer extends CustomerFeedback {
  customer: {
    id: string
    name: string
    email: string
    phone: string | null
  }
}

/**
 * Feedback with full relations (customer + resolver user).
 */
export interface FeedbackWithRelations extends FeedbackWithCustomer {
  resolved_by_user?: {
    email: string
  } | null
}

/**
 * Input for creating new feedback (from public form).
 */
export interface CreateFeedbackInput {
  business_id: string
  customer_id: string
  enrollment_id?: string
  rating: number
  feedback_text?: string
}

/**
 * Input for resolving feedback (from dashboard).
 */
export interface ResolveFeedbackInput {
  id: string
  internal_notes?: string
}

/**
 * Feedback list filters for dashboard.
 */
export interface FeedbackFilters {
  resolved?: boolean // true = resolved only, false = unresolved only, undefined = all
  rating?: number // filter by specific rating
  search?: string // search customer name or feedback text
}

/**
 * Stats for feedback dashboard.
 */
export interface FeedbackStats {
  total: number
  unresolved: number
  averageRating: number
  byRating: Record<number, number> // { 1: 5, 2: 3, 3: 10 }
}
