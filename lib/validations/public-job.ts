import { z } from 'zod'
import { SERVICE_TYPES } from '@/lib/validations/job'

/**
 * Validation schema for public job completion form submissions.
 * Used by both the API route (server-side) and the form component (client-side).
 *
 * Cross-field validation: at least one of customerEmail or customerPhone must be provided.
 */
export const publicJobSchema = z
  .object({
    token: z.string().min(1, 'Token is required'),
    customerName: z.string().min(1, 'Customer name is required').max(200),
    customerEmail: z
      .string()
      .email('Invalid email')
      .optional()
      .or(z.literal('')),
    customerPhone: z.string().optional().or(z.literal('')),
    serviceType: z.enum(SERVICE_TYPES),
    notes: z.string().max(500).optional().or(z.literal('')),
  })
  .refine(
    (data) =>
      (data.customerEmail && data.customerEmail.length > 0) ||
      (data.customerPhone && data.customerPhone.length > 0),
    {
      message: 'Please provide an email address or phone number',
      path: ['customerEmail'],
    }
  )

export type PublicJobInput = z.infer<typeof publicJobSchema>
