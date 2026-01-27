import { Resend } from 'resend'

// Validate environment variable exists (will throw at module load if missing)
if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY environment variable is required')
}

// Export singleton Resend client
export const resend = new Resend(process.env.RESEND_API_KEY)
