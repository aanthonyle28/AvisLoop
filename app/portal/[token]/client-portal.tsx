'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ChatCircleText, CheckCircle, Clock, ArrowRight, Paperclip, X, SpinnerGap } from '@phosphor-icons/react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PortalTicketThread } from './portal-ticket-thread'
import type { PortalProject, PortalQuota, PortalTicket } from '@/lib/data/portal'

interface ClientPortalProps {
  token: string
  project: PortalProject
  quota: PortalQuota
  initialTickets: PortalTicket[]
}

/** Tailwind class + label for each ticket status */
function getStatusDisplay(status: string): { label: string; className: string } {
  switch (status) {
    case 'open':
    case 'submitted':
      return { label: 'Open', className: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' }
    case 'in_progress':
      return { label: 'In Progress', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' }
    case 'waiting_client':
      return { label: 'Waiting on You', className: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' }
    case 'resolved':
    case 'completed':
      return { label: 'Resolved', className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' }
    case 'closed':
      return { label: 'Closed', className: 'bg-muted text-muted-foreground' }
    default:
      return { label: status, className: 'bg-muted text-muted-foreground' }
  }
}

export function ClientPortal({ token, project, quota, initialTickets }: ClientPortalProps) {
  const router = useRouter()
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [attachments, setAttachments] = useState<{ name: string; storagePath: string; readUrl: string }[]>([])
  const [uploading, setUploading] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const projectLabel = project.domain ?? project.client_name ?? 'Your Project'
  const quotaPercent = quota.limit > 0 ? Math.min(100, (quota.used / quota.limit) * 100) : 0

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
    // Reset input so the same file can be re-selected
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
    <div className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Client Portal</p>
        <h1 className="text-2xl font-bold tracking-tight">{projectLabel}</h1>
      </div>

      {/* Quota card */}
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <p className="text-xs text-muted-foreground uppercase tracking-wider">Monthly Revisions</p>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold">{quota.remaining}</span>
            <span className="text-muted-foreground text-sm">
              of {quota.limit} remaining this month
            </span>
          </div>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          {/* Progress bar */}
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div
              className="h-2 rounded-full bg-orange-500 transition-all"
              style={{ width: `${quotaPercent}%` }}
            />
          </div>

          {/* Warning when exhausted */}
          {quota.remaining === 0 && (
            <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-3 py-2">
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Monthly limit reached — contact your agency for additional requests.
              </p>
            </div>
          )}

          {/* Submit button + inline form */}
          {!showForm ? (
            <Button
              onClick={() => setShowForm(true)}
              disabled={quota.remaining === 0}
              className="w-full sm:w-auto"
            >
              <ArrowRight size={16} className="mr-2" />
              Submit Revision Request
            </Button>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3 pt-1">
              <div>
                <label htmlFor="portal-title" className="text-xs font-medium text-foreground block mb-1">
                  Title <span className="text-destructive">*</span>
                </label>
                <input
                  id="portal-title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Update hero headline text"
                  required
                  minLength={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:opacity-50"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label htmlFor="portal-description" className="text-xs font-medium text-foreground block mb-1">
                  Description <span className="text-muted-foreground">(optional)</span>
                </label>
                <textarea
                  id="portal-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what you'd like changed..."
                  rows={3}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 disabled:opacity-50 resize-none"
                  disabled={isSubmitting}
                />
              </div>
              {/* Attachments */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground block">
                  Attachments <span className="text-muted-foreground">(optional — screenshots, PDFs)</span>
                </label>
                <label
                  className="flex items-center gap-2 px-3 py-2 rounded-md border border-dashed border-border text-sm text-muted-foreground cursor-pointer hover:border-foreground/40 transition-colors"
                >
                  <Paperclip size={16} />
                  {uploading > 0 ? (
                    <span className="flex items-center gap-1.5">
                      <SpinnerGap size={14} className="animate-spin" />
                      Uploading {uploading} file{uploading !== 1 ? 's' : ''}...
                    </span>
                  ) : (
                    <span>Add files (PNG, JPG, PDF — max 10MB each)</span>
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
                  <ul className="space-y-1">
                    {attachments.map((file, i) => (
                      <li key={i} className="flex items-center justify-between rounded-md bg-muted px-3 py-1.5 text-sm">
                        <span className="truncate max-w-[240px]">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => setAttachments((prev) => prev.filter((_, idx) => idx !== i))}
                          className="ml-2 text-muted-foreground hover:text-destructive transition-colors"
                          aria-label={`Remove ${file.name}`}
                        >
                          <X size={14} />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting || uploading > 0 || title.trim().length < 3}>
                  {isSubmitting ? 'Submitting...' : 'Submit Request'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setShowForm(false); setTitle(''); setDescription('') }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Ticket history */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <ChatCircleText size={18} className="text-muted-foreground" />
          <h2 className="font-semibold">Revision History</h2>
          {initialTickets.length > 0 && (
            <span className="text-xs bg-muted text-muted-foreground rounded-full px-2 py-0.5">
              {initialTickets.length}
            </span>
          )}
        </div>

        {initialTickets.length === 0 ? (
          <div className="rounded-lg border border-dashed border-muted-foreground/30 py-10 px-6 text-center">
            <p className="text-sm text-muted-foreground">
              No revision requests yet. Submit your first request above.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {initialTickets.map((ticket) => {
              const { label, className } = getStatusDisplay(ticket.status)
              const isResolved = ticket.status === 'resolved' || ticket.status === 'completed' || ticket.status === 'closed'
              return (
                <Card key={ticket.id}>
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex items-start gap-2">
                        {isResolved ? (
                          <CheckCircle size={18} className="text-green-600 mt-0.5 shrink-0" />
                        ) : (
                          <Clock size={18} className="text-muted-foreground mt-0.5 shrink-0" />
                        )}
                        <h3 className="font-medium text-sm leading-snug">{ticket.title}</h3>
                      </div>
                      <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${className}`}>
                        {label}
                      </span>
                    </div>
                    {ticket.description && (
                      <p className="text-xs text-muted-foreground mb-2 ml-6 whitespace-pre-wrap">
                        {ticket.description}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground ml-6">
                      Submitted {format(new Date(ticket.created_at), 'MMM d, yyyy')}
                    </p>
                    {ticket.ticket_messages.length > 0 && (
                      <div className="ml-6">
                        <PortalTicketThread messages={ticket.ticket_messages} />
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
