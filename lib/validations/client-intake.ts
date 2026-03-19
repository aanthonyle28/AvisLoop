import { z } from 'zod'
import { SERVICE_TYPES } from './job'

/**
 * Zod schema for the public client intake form.
 * A new business client fills this out; it creates a business under the agency owner.
 *
 * Web-design-first: collects design brief info + optional review management add-on.
 */
export const clientIntakeSchema = z.object({
  // Business basics
  businessName: z.string().min(1, 'Business name is required').max(100).trim(),
  ownerName: z.string().max(100).trim().optional().or(z.literal('')),
  ownerEmail: z.string().email('Please enter a valid email').optional().or(z.literal('')),
  ownerPhone: z.string().max(20).trim().optional().or(z.literal('')),

  // Services (always required — needed for both web design and review management)
  serviceTypes: z
    .array(z.enum(SERVICE_TYPES))
    .min(1, 'Select at least one service type'),
  customServiceNames: z
    .array(z.string().min(1).max(50).trim())
    .max(10)
    .optional()
    .default([]),

  // Design brief
  description: z.string().max(2000).trim().optional().or(z.literal('')),
  targetAudience: z.string().max(500).trim().optional().or(z.literal('')),
  brandColors: z.string().max(200).trim().optional().or(z.literal('')),
  currentWebsite: z.string().url('Please enter a valid URL').optional().or(z.literal('')),
  inspirationUrls: z.string().max(2000).trim().optional().or(z.literal('')), // newline-separated
  assetPaths: z.array(z.string()).max(10).optional().default([]), // storage paths from uploads

  // Review management add-on (optional)
  wantsReviewManagement: z.boolean().optional().default(false),
  googleReviewLink: z
    .string()
    .url('Please enter a valid URL')
    .optional()
    .or(z.literal('')),
  smsConsentAcknowledged: z.boolean().optional().default(false),

  // Token
  token: z.string().min(1, 'Token is required'),
})

export type ClientIntakeInput = z.infer<typeof clientIntakeSchema>
