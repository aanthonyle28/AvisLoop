'use client'

import { format } from 'date-fns'
import type { PortalTicketMessage } from '@/lib/data/portal'

interface PortalTicketThreadProps {
  messages: PortalTicketMessage[]
}

/**
 * Read-only message thread for the client portal.
 * Agency messages are visually distinct (orange left border).
 */
export function PortalTicketThread({ messages }: PortalTicketThreadProps) {
  if (messages.length === 0) {
    return (
      <p className="text-xs text-muted-foreground mt-2 pl-1">
        No replies yet.
      </p>
    )
  }

  return (
    <div className="mt-3 space-y-3">
      {messages.map((msg) => {
        const isAgency = msg.author_type === 'agency'
        return (
          <div
            key={msg.id}
            className={
              isAgency
                ? 'border-l-2 border-orange-500 pl-3'
                : 'border-l-2 border-muted pl-3'
            }
          >
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`text-xs font-semibold ${
                  isAgency ? 'text-orange-600 dark:text-orange-400' : 'text-muted-foreground'
                }`}
              >
                {isAgency ? 'AvisLoop Team' : 'You'}
              </span>
              <span className="text-xs text-muted-foreground">
                {format(new Date(msg.created_at), 'MMM d, yyyy h:mm a')}
              </span>
            </div>
            <p className="text-sm text-foreground whitespace-pre-wrap">{msg.body}</p>
            {msg.attachment_urls && msg.attachment_urls.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-2">
                {msg.attachment_urls.map((url, idx) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-orange-600 dark:text-orange-400 underline underline-offset-2 hover:opacity-80"
                  >
                    View attachment {msg.attachment_urls && msg.attachment_urls.length > 1 ? idx + 1 : ''}
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
