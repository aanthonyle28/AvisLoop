import { z } from 'zod'
import { SERVICE_TYPES } from './job'

/**
 * Zod schema for the public client intake form.
 * A new business client fills this out; it creates a business under the agency owner.
 */
export const clientIntakeSchema = z.object({
  businessName: z.string().min(1, 'Business name is required').max(100).trim(),
  phone: z.string().max(20).trim().optional().or(z.literal('')),
  googleReviewLink: z
    .string()
    .url('Please enter a valid URL')
    .optional()
    .or(z.literal('')),
  serviceTypes: z
    .array(z.enum(SERVICE_TYPES))
    .min(1, 'Select at least one service type'),
  customServiceNames: z
    .array(z.string().min(1).max(50).trim())
    .max(10)
    .optional()
    .default([]),
  smsConsentAcknowledged: z.literal(true, {
    message: 'You must acknowledge SMS consent requirements',
  }),
  token: z.string().min(1, 'Token is required'),
})

export type ClientIntakeInput = z.infer<typeof clientIntakeSchema>
