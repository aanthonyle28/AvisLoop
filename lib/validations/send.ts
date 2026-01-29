import { z } from 'zod'

/**
 * Schema for send review request action.
 * Validates required IDs and optional message customization.
 */
export const sendRequestSchema = z.object({
  contactId: z.string().uuid('Invalid contact ID'),
  templateId: z.string().uuid('Invalid template ID').optional(),
  // Optional message customization (if user edits before sending)
  customSubject: z.string().min(1, 'Subject is required').max(200, 'Subject too long').optional(),
  customBody: z.string().min(1, 'Message body is required').max(5000, 'Message too long').optional(),
})

/**
 * Schema for batch send (future use).
 */
export const batchSendSchema = z.object({
  contactIds: z.array(z.string().uuid()).min(1, 'Select at least one contact').max(25, 'Maximum 25 contacts per batch'),
  templateId: z.string().uuid('Invalid template ID').optional(),
  customSubject: z.string().min(1, 'Subject is required').max(200, 'Subject too long').optional(),
})

export type SendRequest = z.infer<typeof sendRequestSchema>
export type BatchSendRequest = z.infer<typeof batchSendSchema>
