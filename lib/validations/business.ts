import { z } from 'zod'

// Business profile validation
export const businessSchema = z.object({
  name: z
    .string()
    .min(1, 'Business name is required')
    .max(100, 'Business name must be less than 100 characters')
    .trim(),
  phone: z
    .string()
    .max(20, 'Phone number too long')
    .trim()
    .optional()
    .or(z.literal('')),
  googleReviewLink: z
    .string()
    .url('Please enter a valid URL')
    .includes('google.com', { message: 'Must be a Google URL' })
    .optional()
    .or(z.literal('')), // Allow empty string from form
  defaultSenderName: z
    .string()
    .max(100, 'Sender name must be less than 100 characters')
    .trim()
    .optional()
    .or(z.literal('')),
  defaultTemplateId: z
    .string()
    .uuid('Invalid template ID')
    .optional()
    .or(z.literal('')),
})

// Type exports
export type BusinessInput = z.infer<typeof businessSchema>
