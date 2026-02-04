import { useSMSCharacterCounter } from './use-sms-character-counter'
import { cn } from '@/lib/utils'
import type { Business } from '@/lib/types/database'

interface SMSPreviewProps {
  body: string
  business: Business | null
}

// Sample data for preview
const SAMPLE_CUSTOMER = {
  name: 'John Smith',
}

/**
 * Resolve template placeholders with sample data
 */
function resolveTemplate(text: string, business: Business | null): string {
  const businessName = business?.name || 'Your Business'
  const senderName = business?.default_sender_name || businessName

  return text
    .replace(/{{CUSTOMER_NAME}}/gi, SAMPLE_CUSTOMER.name)
    .replace(/{{BUSINESS_NAME}}/gi, businessName)
    .replace(/{{SENDER_NAME}}/gi, senderName)
}

export function SMSPreview({ body, business }: SMSPreviewProps) {
  const resolvedBody = resolveTemplate(body, business)
  const charInfo = useSMSCharacterCounter(body) // Count on raw body, not resolved

  return (
    <div className="bg-muted/30 p-4 rounded-lg">
      <div className="text-xs text-muted-foreground mb-3 font-medium">SMS Preview</div>

      {/* Phone frame mockup */}
      <div className="relative max-w-xs mx-auto">
        {/* Phone outline */}
        <div className="bg-card border-4 border-foreground/20 rounded-[2rem] p-3 shadow-lg">
          {/* Phone notch */}
          <div className="w-20 h-5 bg-foreground/20 rounded-full mx-auto mb-3" />

          {/* Message area */}
          <div className="bg-background rounded-xl p-3 min-h-[200px]">
            {/* Sender info */}
            <div className="text-center mb-3">
              <div className="text-xs text-muted-foreground">
                {business?.name || 'Your Business'}
              </div>
              <div className="text-[10px] text-muted-foreground/70">
                Text Message
              </div>
            </div>

            {/* Message bubble (received style - gray, left-aligned) */}
            {resolvedBody && (
              <div className="flex justify-start">
                <div className="relative max-w-[85%]">
                  {/* Bubble with tail */}
                  <div className="bg-muted text-foreground px-3 py-2 rounded-2xl rounded-bl-sm shadow-sm">
                    <p className="text-sm whitespace-pre-wrap break-words">
                      {resolvedBody}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {!resolvedBody && (
              <div className="text-center text-muted-foreground text-sm italic py-8">
                Start typing to see preview...
              </div>
            )}

            {/* Opt-out footer */}
            {resolvedBody && (
              <div className="mt-3 text-center">
                <span className="text-[10px] text-muted-foreground/70 bg-muted/50 px-2 py-1 rounded">
                  Reply STOP to opt out
                </span>
              </div>
            )}
          </div>

          {/* Phone home indicator */}
          <div className="w-24 h-1 bg-foreground/20 rounded-full mx-auto mt-3" />
        </div>
      </div>

      {/* Character count info */}
      <div className="mt-4 text-center space-y-1">
        <div className={cn(
          'text-sm font-medium',
          charInfo.warning === 'error' && 'text-red-600',
          charInfo.warning === 'warning' && 'text-yellow-600',
          charInfo.warning === 'none' && 'text-muted-foreground'
        )}>
          {charInfo.length} / {charInfo.limit} characters
        </div>
        <div className="text-xs text-muted-foreground">
          {charInfo.encoding} encoding
          {charInfo.segments > 1 && (
            <span className="text-yellow-600 ml-1">
              ({charInfo.segments} SMS segments)
            </span>
          )}
        </div>
        {charInfo.warningMessage && (
          <div className={cn(
            'text-xs',
            charInfo.warning === 'error' ? 'text-red-600' : 'text-yellow-600'
          )}>
            {charInfo.warningMessage}
          </div>
        )}
      </div>

      {/* Sample data notice */}
      <p className="text-xs text-muted-foreground text-center mt-3">
        Preview uses sample data. Actual SMS will use real customer information.
      </p>
    </div>
  )
}
