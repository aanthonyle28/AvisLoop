import { z } from 'zod'

/**
 * Validation schema for contact forms (add/edit).
 */
export const contactSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().max(20, 'Phone must be less than 20 characters').optional().or(z.literal('')),
})

/**
 * Validation schema for CSV contact import (relaxed for batch processing).
 */
export const csvContactSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name must be less than 100 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().max(20, 'Phone must be less than 20 characters').optional(),
})

export type ContactInput = z.infer<typeof contactSchema>
export type CSVContactInput = z.infer<typeof csvContactSchema>
