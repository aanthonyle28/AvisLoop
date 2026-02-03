import { z } from 'zod'
import { parseAndValidatePhone } from '@/lib/utils/phone'

/**
 * Validation schema for customer forms (add/edit).
 * Phone validation uses libphonenumber-js for E.164 compliance.
 */
export const customerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  email: z
    .string()
    .email('Invalid email address'),
  phone: z
    .string()
    .optional()
    .or(z.literal(''))
    .transform((val) => val || '')
    .refine((val) => {
      if (!val) return true // Optional field
      const result = parseAndValidatePhone(val)
      return result.valid
    }, 'Invalid phone number format'),
  timezone: z
    .string()
    .optional()
    .default('America/New_York'),
})

/**
 * Validation schema for CSV customer import (relaxed for batch processing).
 * Invalid phones don't fail validation - they're flagged for review.
 */
export const csvCustomerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(100, 'Name must be less than 100 characters'),
  email: z
    .string()
    .email('Invalid email address'),
  phone: z
    .string()
    .optional(),
})

/**
 * Tag validation - max 5 tags, each max 50 chars.
 */
export const tagsSchema = z
  .array(z.string().trim().max(50, 'Tag must be under 50 characters'))
  .max(5, 'Maximum 5 tags allowed')

/**
 * SMS consent capture validation.
 */
export const smsConsentSchema = z.object({
  status: z.enum(['opted_in', 'opted_out']),
  method: z
    .enum(['verbal_in_person', 'phone_call', 'service_agreement', 'website_form', 'other'])
    .optional(),
  notes: z
    .string()
    .max(500, 'Notes must be under 500 characters')
    .optional(),
})

export type CustomerInput = z.infer<typeof customerSchema>
export type CSVCustomerInput = z.infer<typeof csvCustomerSchema>
export type TagsInput = z.infer<typeof tagsSchema>
export type SmsConsentInput = z.infer<typeof smsConsentSchema>
