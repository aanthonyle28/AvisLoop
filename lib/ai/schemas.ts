import { z } from 'zod'

// ============================================================
// LLM Output Schemas - Constrain structured output format
// ============================================================

/**
 * Email personalization output schema.
 * Subject and body with reasonable length limits.
 */
export const PersonalizedEmailSchema = z.object({
  subject: z.string().min(1).max(200),
  body: z.string().min(10).max(2000),
})

/**
 * SMS personalization output schema.
 * Tighter constraints for SMS character limit.
 * 160 chars for single segment (opt-out added separately).
 */
export const PersonalizedSmsSchema = z.object({
  body: z.string().min(10).max(160),
})

/**
 * Discriminated union for channel-specific validation.
 * Allows single parse call with channel-appropriate constraints.
 */
export const PersonalizedMessageSchema = z.discriminatedUnion('channel', [
  z.object({
    channel: z.literal('email'),
    subject: z.string().min(1).max(200),
    body: z.string().min(10).max(2000),
  }),
  z.object({
    channel: z.literal('sms'),
    body: z.string().min(10).max(160),
  }),
])

// Type exports
export type PersonalizedEmail = z.infer<typeof PersonalizedEmailSchema>
export type PersonalizedSms = z.infer<typeof PersonalizedSmsSchema>
export type PersonalizedMessage = z.infer<typeof PersonalizedMessageSchema>

// ============================================================
// Input Context Schema - Validation before LLM call
// ============================================================

/**
 * Input context schema for personalization requests.
 * Validates all context fields before sending to LLM.
 */
export const PersonalizationInputSchema = z.object({
  // Template content
  template: z.string().min(1),

  // Customer context
  customerName: z.string().min(1).max(100),

  // Business context
  businessName: z.string().min(1).max(200),
  businessId: z.string().uuid(),  // For rate limiting

  // Optional context enrichment
  serviceType: z.string().optional(),
  technicianName: z.string().optional(),
  isRepeatCustomer: z.boolean().optional(),

  // Campaign context
  touchNumber: z.number().int().min(1).max(4),
  channel: z.enum(['email', 'sms']),

  // Review link (required in output)
  reviewLink: z.string().url(),
})

export type PersonalizationInput = z.infer<typeof PersonalizationInputSchema>
