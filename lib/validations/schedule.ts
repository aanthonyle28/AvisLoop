import { z } from 'zod'

export const scheduleSendSchema = z.object({
  contactIds: z.array(z.string().uuid()).min(1, 'Select at least one contact').max(25, 'Maximum 25 contacts per batch'),
  templateId: z.string().uuid('Invalid template ID').optional(),
  customSubject: z.string().min(1, 'Subject is required').max(200, 'Subject too long').optional(),
  scheduledFor: z.string().datetime({ message: 'Invalid date format' }),
})

export type ScheduleSendRequest = z.infer<typeof scheduleSendSchema>
