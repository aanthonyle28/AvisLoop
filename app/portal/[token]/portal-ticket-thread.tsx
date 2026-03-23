'use client'

import { format } from 'date-fns'
import { cn } from '@/lib/utils'
import type { PortalTicketMessage } from '@/lib/data/portal'

interface PortalTicketThreadProps {
  messages: PortalTicketMessage[]
}

/**
 * Message thread for the client portal.
 * Agency messages are visually distinct (accent left border + subtle bg).
 */
export function PortalTicketThread({ messages }: PortalTicketThreadProps) {
  if (messages.length === 0) return null

  return (
    <div className="space-y-3">
      {messages.map((msg) => {
        const isAgency = msg.author_type === 'agency'
        return (
          <div
            key={msg.id}
            className={cn(
              'rounded-xl px-4 py-3 text-sm',
              isAgency
                ? 'bg-accent/5 border border-accent/15'
                : 'bg-muted/40 border border-border/20'
            )}
          >
            <div className="flex items-center gap-2 mb-1.5">
              <span
                className={cn(
                  'text-xs font-semibold',
                  isAgency ? 'text-accent' : 'text-muted-foreground'
                )}
              >
                {isAgency ? 'AvisLoop Team' : 'You'}
              </span>
              <span className="text-[11px] text-muted-foreground/50">
                {format(new Date(msg.created_at), 'MMM d, yyyy · h:mm a')}
              </span>
            </div>
            <p className="text-foreground/80 whitespace-pre-wrap leading-relaxed">{msg.body}</p>
            {msg.attachment_urls && msg.attachment_urls.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {msg.attachment_urls.map((url, idx) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-accent hover:text-accent/70 transition-colors"
                  >
                    View attachment{msg.attachment_urls && msg.attachment_urls.length > 1 ? ` ${idx + 1}` : ''}
                  </a>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
