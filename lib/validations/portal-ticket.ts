import { z } from 'zod'

export const portalTicketSchema = z.object({
  token: z.string().min(32, 'Invalid portal token'),
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be 200 characters or less')
    .trim(),
  description: z
    .string()
    .max(5000, 'Description must be 5000 characters or less')
    .trim()
    .optional(),
})

export type PortalTicketInput = z.infer<typeof portalTicketSchema>
