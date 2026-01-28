import { Resend } from 'resend'

// Validate environment variable exists (will throw at module load if missing)
if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY environment variable is required')
}

// Warn if from email not set (emails will fail in production without verified domain)
if (!process.env.RESEND_FROM_EMAIL) {
  console.warn('RESEND_FROM_EMAIL not set - using sandbox domain (emails will fail in production)')
}

// Export singleton Resend client
export const resend = new Resend(process.env.RESEND_API_KEY)

// Export validated from email constant
export const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev'
