import { z } from 'zod'

// Business profile validation
export const businessSchema = z.object({
  name: z
    .string()
    .min(1, 'Business name is required')
    .max(100, 'Business name must be less than 100 characters')
    .trim(),
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

// Email template validation
export const emailTemplateSchema = z.object({
  name: z
    .string()
    .min(1, 'Template name is required')
    .max(100, 'Template name must be less than 100 characters')
    .trim(),
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

// Type exports
export type BusinessInput = z.infer<typeof businessSchema>
export type EmailTemplateInput = z.infer<typeof emailTemplateSchema>
