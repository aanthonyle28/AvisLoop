'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format } from 'date-fns'
import {
  PaperPlaneTilt,
  CheckCircle,
  Clock,
  Paperclip,
  X,
  SpinnerGap,
  ArrowRight,
  ChatCircleText,
  CaretDown,
  Files,
  Infinity as InfinityIcon,
} from '@phosphor-icons/react'
import { cn } from '@/lib/utils'
import { PortalTicketThread } from './portal-ticket-thread'
import type { PortalProject, PortalQuota, PortalTicket } from '@/lib/data/portal'

interface ClientPortalProps {
  token: string
  project: PortalProject
  quota: PortalQuota
  initialTickets: PortalTicket[]
}

/* ─── Status display helper ──────────────────────────── */

function getStatusDisplay(status: string): { label: string; dot: string } {
  switch (status) {
    case 'open':
    case 'submitted':
      return { label: 'Open', dot: 'bg-amber-500' }
    case 'in_progress':
      return { label: 'In Progress', dot: 'bg-blue-500' }
    case 'waiting_client':
      return { label: 'Waiting on You', dot: 'bg-purple-500' }
    case 'resolved':
    case 'completed':
      return { label: 'Resolved', dot: 'bg-green-500' }
    case 'closed':
      return { label: 'Closed', dot: 'bg-muted-foreground' }
    default:
      return { label: status, dot: 'bg-muted-foreground' }
  }
}

/* ─── Logo SVG ───────────────────────────────────────── */

function PortalLogo() {
  return (
    <svg viewBox="0 0 28 28" fill="none" className="w-5 h-5" aria-hidden="true">
      <path
        d="M13.9614 13.9428C13.9614 13.9428 15.6661 8.28761 13.1687 5.6657C9.39938 1.70861 2.46616 5.36825 1.25864 10.7178C1.06397 11.5803 0.964999 12.4675 1.01126 13.3511C1.39358 20.6533 9.24432 25.3666 16.2932 23.6446C17.7686 23.2841 19.1513 22.7512 20.2657 21.9762C27.8097 16.7301 26.9724 8.28761 26.9724 8.28761"
        stroke="currentColor"
        strokeWidth="2"
        className="text-accent"
      />
    </svg>
  )
}

/* ─── Main Portal ────────────────────────────────────── */

export function ClientPortal({ token, project, quota, initialTickets }: ClientPortalProps) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [attachments, setAttachments] = useState<{ name: string; storagePath: string; readUrl: string }[]>([])
  const [uploading, setUploading] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [expandedTicket, setExpandedTicket] = useState<string | null>(
    initialTickets.length > 0 ? initialTickets[0].id : null
  )

  const projectLabel = project.domain ?? project.client_name ?? 'Your Project'
  const isUnlimited = quota.limit === -1
  const quotaPercent = !isUnlimited && quota.limit > 0 ? Math.min(100, (quota.used / quota.limit) * 100) : 0
  const isExhausted = !isUnlimited && quota.remaining === 0

  const openCount = initialTickets.filter(
    (t) => t.status !== 'resolved' && t.status !== 'completed' && t.status !== 'closed'
  ).length

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files?.length) return
    if (attachments.length + files.length > 5) {
      toast.error('Maximum 5 files per request')
      return
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']

    for (const file of Array.from(files)) {
      if (!allowedTypes.includes(file.type)) {
        toast.error(`${file.name}: File type not allowed`)
        continue
      }
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name}: Exceeds 10MB limit`)
        continue
      }

      setUploading((c) => c + 1)
      try {
        const urlRes = await fetch('/api/portal/upload-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, filename: file.name, contentType: file.type }),
        })
        if (!urlRes.ok) {
          toast.error(`Failed to upload ${file.name}`)
          continue
        }
        const { signedUploadUrl, storagePath, readUrl } = await urlRes.json() as {
          signedUploadUrl: string; storagePath: string; readUrl: string | null
        }

        const putRes = await fetch(signedUploadUrl, {
          method: 'PUT',
          headers: { 'Content-Type': file.type },
          body: file,
        })
        if (!putRes.ok) {
          toast.error(`Upload failed for ${file.name}`)
          continue
        }

        setAttachments((prev) => [...prev, { name: file.name, storagePath, readUrl: readUrl ?? storagePath }])
      } catch {
        toast.error(`Upload failed for ${file.name}`)
      } finally {
        setUploading((c) => c - 1)
      }
    }
    e.target.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (title.trim().length < 3) {
      toast.error('Title must be at least 3 characters')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await fetch('/api/portal/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          title: title.trim(),
          description: description.trim() || undefined,
          attachmentUrls: attachments.length > 0 ? attachments.map((a) => a.storagePath) : undefined,
        }),
      })

      const data = await res.json() as { error?: string; overLimit?: boolean }

      if (!res.ok) {
        toast.error(data.error ?? 'Failed to submit request')
        return
      }

      toast.success('Revision request submitted!')
      setShowForm(false)
      setTitle('')
      setDescription('')
      setAttachments([])
      router.refresh()
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Top bar ── */}
      <header className="border-b border-border/20">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <PortalLogo />
            <span className="text-sm font-semibold tracking-tight">AvisLoop</span>
          </div>
          <span className="text-xs tracking-[0.15em] uppercase text-muted-foreground/50 font-medium">
            Client Portal
          </span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 sm:px-8 py-10 sm:py-14 space-y-10">
        {/* ── Hero header ── */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent mb-3">
            {projectLabel}
          </p>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight leading-[1.1]">
            Your Revisions,<br />
            <span className="text-muted-foreground">One Place.</span>
          </h1>
        </div>

        {/* ── Stats row ── */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-2xl border border-border/30 bg-card p-5">
            <p className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground/60 font-medium mb-1.5">
              This Month
            </p>
            <p className="text-2xl font-black tracking-tight">{quota.used}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isUnlimited ? 'submitted' : `of ${quota.limit}`}
            </p>
          </div>
          <div className="rounded-2xl border border-border/30 bg-card p-5">
            <p className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground/60 font-medium mb-1.5">
              {isUnlimited ? 'Plan' : 'Remaining'}
            </p>
            {isUnlimited ? (
              <div className="flex items-center gap-1.5">
                <InfinityIcon size={22} weight="bold" className="text-accent" />
                <p className="text-sm font-bold text-accent mt-0.5">Unlimited</p>
              </div>
            ) : (
              <>
                <p className={cn('text-2xl font-black tracking-tight', isExhausted && 'text-red-500')}>
                  {quota.remaining}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">revisions left</p>
              </>
            )}
          </div>
          <div className="rounded-2xl border border-border/30 bg-card p-5">
            <p className="text-[10px] tracking-[0.15em] uppercase text-muted-foreground/60 font-medium mb-1.5">
              In Progress
            </p>
            <p className="text-2xl font-black tracking-tight">{openCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">open tickets</p>
          </div>
        </div>

        {/* ── Progress bar (capped plans only) ── */}
        {!isUnlimited && (
          <div className="space-y-2">
            <div className="h-1.5 rounded-full bg-border/30 overflow-hidden">
              <div
                className={cn(
                  'h-1.5 rounded-full transition-all duration-500',
                  isExhausted ? 'bg-red-500' : quotaPercent >= 80 ? 'bg-amber-500' : 'bg-accent'
                )}
                style={{ width: `${quotaPercent}%` }}
              />
            </div>
            {isExhausted && (
              <p className="text-xs text-red-500 dark:text-red-400">
                Monthly limit reached — contact your agency for additional requests.
              </p>
            )}
          </div>
        )}

        {/* ── Submit section ── */}
        <div className="rounded-2xl border border-border/30 bg-card overflow-hidden">
          {!showForm ? (
            <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold tracking-tight">Need a change?</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Submit a revision request and we&apos;ll get it done within 48 hours.
                </p>
              </div>
              <button
                onClick={() => setShowForm(true)}
                disabled={isExhausted}
                className={cn(
                  'inline-flex items-center gap-2.5 rounded-full px-6 py-3 text-sm font-semibold transition-colors shrink-0',
                  isExhausted
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-foreground text-background hover:bg-foreground/90'
                )}
              >
                <PaperPlaneTilt size={16} weight="fill" />
                New Request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold tracking-tight">New Revision Request</h2>
                <button
                  type="button"
                  onClick={() => { setShowForm(false); setTitle(''); setDescription(''); setAttachments([]) }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Close form"
                >
                  <X size={18} weight="bold" />
                </button>
              </div>

              <div>
                <label htmlFor="portal-title" className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground block mb-2">
                  Title <span className="text-accent">*</span>
                </label>
                <input
                  id="portal-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Update hero headline text"
                  required
                  minLength={3}
                  className="w-full rounded-xl border border-border/40 bg-background px-4 py-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all disabled:opacity-50"
                  disabled={isSubmitting}
                  autoFocus
                />
              </div>

              <div>
                <label htmlFor="portal-description" className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground block mb-2">
                  Description <span className="text-muted-foreground/50 normal-case tracking-normal font-normal">(optional)</span>
                </label>
                <textarea
                  id="portal-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what you'd like changed..."
                  rows={3}
                  className="w-full rounded-xl border border-border/40 bg-background px-4 py-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all disabled:opacity-50 resize-none"
                  disabled={isSubmitting}
                />
              </div>

              {/* Attachments */}
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.1em] text-muted-foreground block">
                  Attachments
                </label>
                <label
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 rounded-xl border border-dashed transition-colors cursor-pointer',
                    attachments.length >= 5
                      ? 'border-border/20 text-muted-foreground/30 cursor-not-allowed'
                      : 'border-border/40 text-muted-foreground hover:border-accent/40 hover:text-accent'
                  )}
                >
                  <Paperclip size={16} />
                  {uploading > 0 ? (
                    <span className="flex items-center gap-1.5 text-sm">
                      <SpinnerGap size={14} className="animate-spin" />
                      Uploading {uploading} file{uploading !== 1 ? 's' : ''}...
                    </span>
                  ) : (
                    <span className="text-sm">Drop files or click to browse (PNG, JPG, PDF)</span>
                  )}
                  <input
                    type="file"
                    multiple
                    accept="image/jpeg,image/png,image/gif,image/webp,application/pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    disabled={isSubmitting || attachments.length >= 5}
                  />
                </label>
                {attachments.length > 0 && (
                  <ul className="space-y-1.5">
                    {attachments.map((file, i) => (
                      <li key={i} className="flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2 text-sm">
                        <span className="flex items-center gap-2 truncate">
                          <Files size={14} className="text-muted-foreground shrink-0" />
                          <span className="truncate max-w-[260px]">{file.name}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                          className="ml-2 text-muted-foreground hover:text-red-500 transition-colors"
                          aria-label={`Remove ${file.name}`}
                        >
                          <X size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  disabled={isSubmitting || uploading > 0 || title.trim().length < 3}
                  className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-6 py-3 text-sm font-semibold hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <SpinnerGap size={14} className="animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <ArrowRight size={14} weight="bold" />
                      Submit Request
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* ── Ticket history ── */}
        <div>
          <div className="flex items-center gap-2.5 mb-5">
            <ChatCircleText size={18} weight="fill" className="text-accent" />
            <h2 className="text-xl font-bold tracking-tight">Revision History</h2>
            {initialTickets.length > 0 && (
              <span className="text-xs bg-accent/10 text-accent rounded-full px-2.5 py-0.5 font-semibold">
                {initialTickets.length}
              </span>
            )}
          </div>

          {initialTickets.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/30 py-16 px-6 text-center">
              <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
                <ChatCircleText size={22} className="text-muted-foreground/40" />
              </div>
              <p className="text-sm text-muted-foreground">
                No revision requests yet. Submit your first request above.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {initialTickets.map((ticket) => {
                const { label, dot } = getStatusDisplay(ticket.status)
                const isResolved = ticket.status === 'resolved' || ticket.status === 'completed' || ticket.status === 'closed'
                const isExpanded = expandedTicket === ticket.id

                return (
                  <div
                    key={ticket.id}
                    className="rounded-2xl border border-border/30 bg-card overflow-hidden transition-colors"
                  >
                    {/* Ticket header — always visible, clickable */}
                    <button
                      type="button"
                      onClick={() => setExpandedTicket(isExpanded ? null : ticket.id)}
                      className="w-full flex items-center gap-3 p-4 sm:p-5 text-left hover:bg-muted/30 transition-colors"
                    >
                      {isResolved ? (
                        <CheckCircle size={18} weight="fill" className="text-green-500 shrink-0" />
                      ) : (
                        <Clock size={18} weight="fill" className="text-amber-500 shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm truncate">{ticket.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(new Date(ticket.created_at), 'MMM d, yyyy')}
                          {ticket.ticket_messages.length > 0 && (
                            <span className="ml-2 text-muted-foreground/50">
                              {ticket.ticket_messages.length} message{ticket.ticket_messages.length !== 1 ? 's' : ''}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-2.5 shrink-0">
                        <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                          <span className={cn('w-1.5 h-1.5 rounded-full', dot)} />
                          {label}
                        </span>
                        <CaretDown
                          size={14}
                          weight="bold"
                          className={cn(
                            'text-muted-foreground/40 transition-transform duration-200',
                            isExpanded && 'rotate-180'
                          )}
                        />
                      </div>
                    </button>

                    {/* Expanded content */}
                    {isExpanded && (
                      <div className="px-4 sm:px-5 pb-4 sm:pb-5 pt-0 border-t border-border/20">
                        {ticket.description && (
                          <p className="text-sm text-muted-foreground mt-3 whitespace-pre-wrap leading-relaxed">
                            {ticket.description}
                          </p>
                        )}
                        {ticket.ticket_messages.length > 0 && (
                          <div className="mt-4">
                            <PortalTicketThread messages={ticket.ticket_messages} />
                          </div>
                        )}
                        {/* Reply form — only for open tickets */}
                        {!isResolved && (
                          <TicketReplyForm token={token} ticketId={ticket.id} />
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>

      {/* ── Footer ── */}
      <footer className="border-t border-border/20 py-8">
        <div className="max-w-3xl mx-auto px-5 sm:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PortalLogo />
            <span className="text-xs text-muted-foreground/40">&copy; 2026 AvisLoop</span>
          </div>
          <a
            href="mailto:support@avisloop.com"
            className="text-xs text-muted-foreground/40 hover:text-foreground transition-colors"
          >
            Need help?
          </a>
        </div>
      </footer>
    </div>
  )
}

/* ─── Ticket Reply Form ──────────────────────────────── */

function TicketReplyForm({ token, ticketId }: { token: string; ticketId: string }) {
  const router = useRouter()
  const [replyOpen, setReplyOpen] = useState(false)
  const [replyText, setReplyText] = useState('')
  const [sending, setSending] = useState(false)

  if (!replyOpen) {
    return (
      <button
        type="button"
        onClick={() => setReplyOpen(true)}
        className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-accent transition-colors"
      >
        <ChatCircleText size={13} />
        Reply
      </button>
    )
  }

  async function handleSendReply() {
    if (!replyText.trim()) return
    setSending(true)
    try {
      const res = await fetch('/api/portal/tickets/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, ticketId, body: replyText.trim() }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({})) as Record<string, string>
        toast.error(data.error ?? 'Failed to send reply')
        return
      }
      toast.success('Reply sent')
      setReplyText('')
      setReplyOpen(false)
      router.refresh()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="mt-4 space-y-3">
      <textarea
        value={replyText}
        onChange={(e) => setReplyText(e.target.value)}
        placeholder="Type your reply..."
        rows={2}
        maxLength={5000}
        className="w-full rounded-xl border border-border/40 bg-background px-4 py-3 text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 resize-none"
        disabled={sending}
        autoFocus
      />
      <div className="flex gap-2">
        <button
          onClick={handleSendReply}
          disabled={sending || !replyText.trim()}
          className="inline-flex items-center gap-1.5 rounded-full bg-foreground text-background px-5 py-2 text-xs font-semibold hover:bg-foreground/90 transition-colors disabled:opacity-50"
        >
          {sending ? 'Sending...' : 'Send Reply'}
        </button>
        <button
          onClick={() => { setReplyOpen(false); setReplyText('') }}
          disabled={sending}
          className="rounded-full border border-border/40 px-5 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
