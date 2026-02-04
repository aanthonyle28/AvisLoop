import { EmailPreview } from './email-preview'
import { SMSPreview } from './sms-preview'
import type { Business, MessageChannel } from '@/lib/types/database'

interface MessageTemplatePreviewProps {
  channel: MessageChannel
  subject: string  // Only used for email
  body: string
  business: Business | null
}

/**
 * Conditional preview component that renders email or SMS preview
 * based on the channel prop.
 */
export function MessageTemplatePreview({
  channel,
  subject,
  body,
  business,
}: MessageTemplatePreviewProps) {
  if (channel === 'email') {
    return (
      <EmailPreview
        subject={subject}
        body={body}
        business={business}
      />
    )
  }

  return (
    <SMSPreview
      body={body}
      business={business}
    />
  )
}

// Re-export individual components for direct use
export { EmailPreview } from './email-preview'
export { SMSPreview } from './sms-preview'
