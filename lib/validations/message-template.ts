import { z } from 'zod'

// Service types matching database constraint
const serviceTypes = ['hvac', 'plumbing', 'electrical', 'cleaning', 'roofing', 'painting', 'handyman', 'other'] as const

// Base fields shared by both channels
const baseTemplateFields = {
  name: z
    .string()
    .min(1, 'Template name is required')
    .max(100, 'Template name must be less than 100 characters')
    .trim(),
  service_type: z.enum(serviceTypes).nullable().optional(),
}

// Email template schema
const emailTemplateSchema = z.object({
  ...baseTemplateFields,
  channel: z.literal('email'),
  subject: z
    .string()
    .min(1, 'Email subject is required')
    .max(200, 'Subject must be less than 200 characters')
    .trim(),
  body: z
    .string()
    .min(1, 'Email body is required')
    .max(5000, 'Body must be less than 5000 characters')
    .trim(),
})

// SMS template schema (soft limit on body, allow multi-segment)
const smsTemplateSchema = z.object({
  ...baseTemplateFields,
  channel: z.literal('sms'),
  subject: z.literal('').optional().default(''), // SMS has no subject
  body: z
    .string()
    .min(1, 'SMS body is required')
    .max(320, 'SMS body too long (max 2 segments)') // Soft limit
    .trim(),
})

// Discriminated union - validates based on channel value
export const messageTemplateSchema = z.discriminatedUnion('channel', [
  emailTemplateSchema,
  smsTemplateSchema,
])

// Type exports
export type MessageTemplateInput = z.infer<typeof messageTemplateSchema>
export type EmailTemplateSchemaInput = z.infer<typeof emailTemplateSchema>
export type SMSTemplateSchemaInput = z.infer<typeof smsTemplateSchema>

// Re-export individual schemas for direct use if needed
export { emailTemplateSchema, smsTemplateSchema }
