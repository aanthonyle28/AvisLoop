import { z } from 'zod'

/**
 * Validation schema for business metadata fields.
 * Used by updateBusinessMetadata() server action before writing to the database.
 */
export const businessMetadataSchema = z.object({
  client_type: z.enum(['reputation', 'web_design', 'both']).optional(),
  // Review fields
  google_rating_start: z.number().min(1).max(5).nullable().optional(),
  google_rating_current: z.number().min(1).max(5).nullable().optional(),
  review_count_start: z.number().int().min(0).nullable().optional(),
  review_count_current: z.number().int().min(0).nullable().optional(),
  gbp_access: z.boolean().nullable().optional(),
  // Web design fields
  owner_name: z.string().max(200).nullable().optional(),
  owner_email: z.string().max(200).nullable().optional(),
  owner_phone: z.string().max(50).nullable().optional(),
  domain: z.string().max(200).nullable().optional(),
  web_design_tier: z.enum(['starter', 'growth', 'pro']).nullable().optional(),
  live_website_url: z.string().max(500).nullable().optional(),
  vercel_project_url: z.string().max(500).nullable().optional(),
  // Shared fields
  monthly_fee: z.number().min(0).max(99999.99).nullable().optional(),
  start_date: z.string().nullable().optional(),
  status: z.enum(['active', 'paused', 'churned']).nullable().optional(),
})

export type BusinessMetadataInput = z.infer<typeof businessMetadataSchema>
