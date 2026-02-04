import type { Business } from '@/lib/types/database'

interface EmailPreviewProps {
  subject: string
  body: string
  business: Business | null
}

// Sample data for preview
const SAMPLE_CUSTOMER = {
  name: 'John Smith',
  email: 'john.smith@example.com',
}

/**
 * Resolve template placeholders with sample data
 */
function resolveTemplate(text: string, business: Business | null): string {
  const businessName = business?.name || 'Your Business'
  const senderName = business?.default_sender_name || businessName
  const reviewLink = business?.google_review_link || 'https://g.page/your-business/review'

  return text
    .replace(/{{CUSTOMER_NAME}}/gi, SAMPLE_CUSTOMER.name)
    .replace(/{{BUSINESS_NAME}}/gi, businessName)
    .replace(/{{SENDER_NAME}}/gi, senderName)
    .replace(/{{REVIEW_LINK}}/gi, reviewLink)
}

export function EmailPreview({ subject, body, business }: EmailPreviewProps) {
  const resolvedSubject = resolveTemplate(subject, business)
  const resolvedBody = resolveTemplate(body, business)
  const senderName = business?.default_sender_name || business?.name || 'Your Business'

  return (
    <div className="bg-muted/30 p-4 rounded-lg">
      <div className="text-xs text-muted-foreground mb-3 font-medium">Email Preview</div>

      <div className="bg-card border border-border rounded-lg shadow-sm max-w-lg mx-auto overflow-hidden">
        {/* Email header */}
        <div className="px-4 py-3 border-b border-border bg-muted/50">
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">From:</span> {senderName}
          </div>
          <div className="text-xs text-muted-foreground">
            <span className="font-medium">To:</span> {SAMPLE_CUSTOMER.email}
          </div>
        </div>

        {/* Email subject */}
        <div className="px-4 py-3 border-b border-border">
          <div className="font-semibold text-foreground">{resolvedSubject || '(No subject)'}</div>
        </div>

        {/* Email body */}
        <div className="px-4 py-4">
          <div className="text-sm text-foreground whitespace-pre-wrap mb-6">
            {resolvedBody || '(No content)'}
          </div>

          {/* CTA Button */}
          <div className="text-center">
            <span className="inline-block bg-primary text-primary-foreground px-6 py-3 rounded-md font-medium text-sm">
              Leave a Review
            </span>
          </div>
        </div>

        {/* Email footer */}
        <div className="px-4 py-3 border-t border-border bg-muted/50">
          <div className="text-xs text-muted-foreground text-center">
            Sent via AvisLoop
          </div>
        </div>
      </div>

      {/* Sample data notice */}
      <p className="text-xs text-muted-foreground text-center mt-3">
        Preview uses sample data. Actual emails will use real customer information.
      </p>
    </div>
  )
}
