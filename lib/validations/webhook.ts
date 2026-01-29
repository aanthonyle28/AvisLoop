import { z } from 'zod'

/**
 * Schema for webhook contact creation payload.
 * Validates and normalizes contact data from external integrations.
 */
export const webhookContactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200).trim(),
  email: z
    .string()
    .email('Invalid email format')
    .transform((val) => val.toLowerCase().trim()),
  phone: z.string().max(50).optional(),
})

export type WebhookContactInput = z.infer<typeof webhookContactSchema>
