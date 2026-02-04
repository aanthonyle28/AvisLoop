import { z } from 'zod'

/**
 * Schema for creating feedback from public review page.
 * Rating is required, text is optional but limited.
 */
export const feedbackSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  rating: z
    .number()
    .int('Rating must be a whole number')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),
  feedback_text: z
    .string()
    .max(5000, 'Feedback must be less than 5000 characters')
    .optional()
    .transform((val) => val?.trim() || undefined),
})

export type FeedbackInput = z.infer<typeof feedbackSchema>

/**
 * Schema for rating-only submission (before feedback form).
 * Used when 4-5 stars selected (no feedback text needed).
 */
export const ratingSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  rating: z
    .number()
    .int('Rating must be a whole number')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),
})

export type RatingInput = z.infer<typeof ratingSchema>

/**
 * Schema for resolving feedback from dashboard.
 * Internal notes are optional.
 */
export const resolveFeedbackSchema = z.object({
  id: z.string().uuid('Invalid feedback ID'),
  internal_notes: z
    .string()
    .max(2000, 'Notes must be less than 2000 characters')
    .optional()
    .transform((val) => val?.trim() || undefined),
})

export type ResolveFeedbackInput = z.infer<typeof resolveFeedbackSchema>

/**
 * Schema for feedback list query params.
 */
export const feedbackFiltersSchema = z.object({
  resolved: z.boolean().optional(),
  rating: z.number().int().min(1).max(5).optional(),
  search: z.string().max(100).optional(),
  page: z.number().int().min(1).optional().default(1),
  limit: z.number().int().min(1).max(100).optional().default(20),
})

export type FeedbackFiltersInput = z.infer<typeof feedbackFiltersSchema>
