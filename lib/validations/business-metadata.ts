import { z } from 'zod'

/**
 * Validation schema for agency metadata fields on a business.
 * Used by updateBusinessMetadata() server action before writing to the database.
 *
 * Note: agency_notes is intentionally excluded — it has its own dedicated
 * updateBusinessNotes() action with a simple length check.
 */
export const businessMetadataSchema = z.object({
  client_type: z.enum(['reputation', 'web_design', 'both']).optional(),
  google_rating_start: z.number().min(1).max(5).nullable().optional(),
  google_rating_current: z.number().min(1).max(5).nullable().optional(),
  review_count_start: z.number().int().min(0).nullable().optional(),
  review_count_current: z.number().int().min(0).nullable().optional(),
  monthly_fee: z.number().min(0).max(99999.99).nullable().optional(),
  start_date: z.string().nullable().optional(),
  gbp_access: z.boolean().nullable().optional(),
  competitor_name: z.string().max(200).nullable().optional(),
  competitor_review_count: z.number().int().min(0).nullable().optional(),
})

export type BusinessMetadataInput = z.infer<typeof businessMetadataSchema>
