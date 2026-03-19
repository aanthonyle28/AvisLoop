import { z } from 'zod'

/**
 * Validation schema for creating a new web design client.
 * Used by createWebDesignClient() server action.
 */
export const createClientSchema = z.object({
  businessName: z.string().min(1, 'Business name is required').max(200),
  ownerName: z.string().max(200).optional().or(z.literal('')),
  ownerEmail: z.string().email('Invalid email').optional().or(z.literal('')),
  ownerPhone: z.string().max(50).optional().or(z.literal('')),
  domain: z.string().max(500).optional().or(z.literal('')),
  subscriptionTier: z.enum(['basic', 'advanced']),
  hasReviewAddon: z.boolean(),
})

export type CreateClientInput = z.infer<typeof createClientSchema>

/**
 * Validation schema for web design client fields editable from the detail view (CRM-04).
 * Used by updateClientDetails() server action before writing to the database.
 *
 * All fields are optional — the action only persists what is provided.
 * URL fields allow empty string to support clearing via the form.
 */
export const clientUpdateSchema = z.object({
  owner_name: z.string().max(200).nullable().optional(),
  owner_email: z
    .string()
    .email()
    .nullable()
    .optional()
    .or(z.literal('')),
  owner_phone: z.string().max(50).nullable().optional(),
  web_design_tier: z.enum(['basic', 'advanced']).nullable().optional(),
  domain: z.string().max(500).nullable().optional(),
  vercel_project_url: z
    .string()
    .url()
    .nullable()
    .optional()
    .or(z.literal('')),
  status: z.enum(['active', 'paused', 'churned']).nullable().optional(),
  monthly_fee: z.number().min(0).max(99999).nullable().optional(),
  start_date: z.string().nullable().optional(),
})

export type ClientUpdateInput = z.infer<typeof clientUpdateSchema>
