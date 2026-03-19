'use client'

import { useState, useTransition, useRef, useEffect } from 'react'
import { format } from 'date-fns'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetBody,
  SheetFooter,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Paperclip, CaretDown, CaretRight } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { updateTicketStatus, addAgencyMessage, updateInternalNotes } from '@/lib/actions/ticket'
import type { ProjectTicket, TicketMessage, TicketStatus } from '@/lib/types/database'

interface TicketDetailDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  ticket: ProjectTicket | null
  messages: TicketMessage[]
  onStatusChange: (ticketId: string, status: TicketStatus) => void
  onMessageSent: () => void
}

const STATUS_OPTIONS: { value: TicketStatus; label: string }[] = [
  { value: 'submitted', label: 'Submitted' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
]

function StatusBadge({ status }: { status: TicketStatus }) {
  const config: Record<string, { label: string; className: string }> = {
    submitted: {
      label: 'Submitted',
      className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100',
    },
    in_progress: {
      label: 'In Progress',
      className: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-100',
    },
    completed: {
      label: 'Completed',
      className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100',
    },
  }

  const cfg = config[status] ?? {
    label: status,
    className: 'bg-muted text-muted-foreground',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
        cfg.className
      )}
    >
      {cfg.label}
    </span>
  )
}

function formatMessageTime(dateStr: string): string {
  try {
    return format(new Date(dateStr), "MMM d 'at' h:mm a")
  } catch {
    return dateStr
  }
}

export function TicketDetailDrawer({
  open,
  onOpenChange,
  ticket,
  messages,
  onStatusChange,
  onMessageSent,
}: TicketDetailDrawerProps) {
  const [isPendingStatus, startStatusTransition] = useTransition()
  const [isPendingMessage, startMessageTransition] = useTransition()
  const [replyBody, setReplyBody] = useState('')
  const [notesOpen, setNotesOpen] = useState(false)

  // Internal notes auto-save state (fire-and-forget, matches customer notes pattern)
  const [notes, setNotes] = useState('')
  const notesTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)
  const notesRef = useRef('')
  const initialNotesRef = useRef('')

  // Sync notes when ticket changes
  useEffect(() => {
    if (ticket) {
      const initial = ticket.internal_notes ?? ''
      setNotes(initial)
      notesRef.current = initial
      initialNotesRef.current = initial
    }
  }, [ticket])

  notesRef.current = notes

  // Flush pending notes save on drawer close
  useEffect(() => {
    if (!open && ticket && notesTimeoutRef.current) {
      clearTimeout(notesTimeoutRef.current)
      notesTimeoutRef.current = undefined
      if (notesRef.current !== initialNotesRef.current) {
        void updateInternalNotes(ticket.id, notesRef.current)
      }
    }
  }, [open, ticket])

  function handleNotesChange(value: string) {
    setNotes(value)
    if (notesTimeoutRef.current) clearTimeout(notesTimeoutRef.current)
    if (ticket) {
      notesTimeoutRef.current = setTimeout(() => {
        void updateInternalNotes(ticket.id, value)
        initialNotesRef.current = value
      }, 500)
    }
  }

  function handleStatusChange(newStatus: TicketStatus) {
    if (!ticket || isPendingStatus) return
    startStatusTransition(async () => {
      const result = await updateTicketStatus(ticket.id, newStatus)
      if (result.success) {
        onStatusChange(ticket.id, newStatus)
        toast.success(`Status updated to ${newStatus.replace('_', ' ')}`)
      } else {
        toast.error(result.error ?? 'Failed to update status')
      }
    })
  }

  function handleSendReply() {
    if (!ticket || !replyBody.trim() || isPendingMessage) return
    startMessageTransition(async () => {
      const result = await addAgencyMessage(ticket.id, replyBody)
      if (result.success) {
        setReplyBody('')
        onMessageSent()
        toast.success('Reply sent')
      } else {
        toast.error(result.error ?? 'Failed to send reply')
      }
    })
  }

  if (!ticket) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="pr-6 leading-snug">{ticket.title}</SheetTitle>
          <SheetDescription asChild>
            <div className="flex items-center gap-2 flex-wrap">
              <StatusBadge status={ticket.status} />
              <span className="text-xs text-muted-foreground">
                {ticket.source === 'client_portal' ? 'From client' : 'From agency'}
              </span>
              {ticket.is_overage && (
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-100">
                  $50 overage
                </span>
              )}
            </div>
          </SheetDescription>
        </SheetHeader>

        <SheetBody className="space-y-6">
          {/* Status selector */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Status
            </p>
            <div className="flex gap-2 flex-wrap">
              {STATUS_OPTIONS.map((opt) => (
                <Button
                  key={opt.value}
                  size="sm"
                  variant={ticket.status === opt.value ? 'default' : 'outline'}
                  disabled={isPendingStatus}
                  onClick={() => handleStatusChange(opt.value)}
                  className="text-xs"
                >
                  {opt.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Description */}
          {ticket.description && (
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">
                Description
              </p>
              <p className="text-sm whitespace-pre-wrap">{ticket.description}</p>
            </div>
          )}

          {/* Message thread */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">
              Messages
            </p>
            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No messages yet.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {messages.map((msg) => {
                  const isAgency = msg.author_type === 'agency'
                  return (
                    <div
                      key={msg.id}
                      className={cn(
                        'flex flex-col gap-1',
                        isAgency ? 'items-end' : 'items-start'
                      )}
                    >
                      <div
                        className={cn(
                          'max-w-[85%] rounded-lg px-3 py-2 text-sm',
                          isAgency
                            ? 'bg-primary/10 text-foreground'
                            : 'bg-muted text-foreground'
                        )}
                      >
                        <p className="whitespace-pre-wrap">{msg.body}</p>
                        {msg.attachment_urls && msg.attachment_urls.length > 0 && (
                          <div className="mt-2 flex flex-col gap-1">
                            {msg.attachment_urls.map((url, i) => (
                              <a
                                key={i}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-primary underline hover:no-underline"
                              >
                                <Paperclip size={12} />
                                Attachment {i + 1}
                              </a>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground px-1">
                        <span className="font-medium">
                          {isAgency ? 'Agency' : (msg.author_name ?? 'Client')}
                        </span>{' '}
                        · {formatMessageTime(msg.created_at)}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Internal notes (collapsible) */}
          <div>
            <button
              type="button"
              onClick={() => setNotesOpen((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wide hover:text-foreground transition-colors"
            >
              {notesOpen ? (
                <CaretDown size={12} weight="bold" />
              ) : (
                <CaretRight size={12} weight="bold" />
              )}
              Internal Notes (agency only)
            </button>
            {notesOpen && (
              <div className="mt-2">
                <Textarea
                  value={notes}
                  onChange={(e) => handleNotesChange(e.target.value)}
                  placeholder="Private notes — not visible to the client..."
                  rows={3}
                  className="text-sm"
                />
              </div>
            )}
          </div>
        </SheetBody>

        <SheetFooter>
          <div className="w-full space-y-2">
            <Textarea
              value={replyBody}
              onChange={(e) => setReplyBody(e.target.value)}
              placeholder="Write a reply..."
              rows={3}
              className="text-sm resize-none"
            />
            <Button
              onClick={handleSendReply}
              disabled={!replyBody.trim() || isPendingMessage}
              className="w-full"
              size="sm"
            >
              {isPendingMessage ? 'Sending...' : 'Send Reply'}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
