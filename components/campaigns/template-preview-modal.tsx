'use client'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { EnvelopeSimple, ChatCircle } from '@phosphor-icons/react'

interface TemplatePreviewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  template: {
    name: string
    subject: string
    body: string
    channel: 'email' | 'sms'
  } | null
}

export function TemplatePreviewModal({
  open,
  onOpenChange,
  template,
}: TemplatePreviewModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{template?.name || 'Template Preview'}</DialogTitle>
        </DialogHeader>

        {!template ? (
          <p className="text-sm text-muted-foreground py-4 text-center">
            No template preview available. This touch uses an AI-generated default.
          </p>
        ) : template.channel === 'email' ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <EnvelopeSimple size={16} />
              <span className="text-xs font-medium uppercase tracking-wide">Email Preview</span>
            </div>
            <div className="rounded-lg border bg-muted/30 overflow-hidden">
              <div className="px-4 py-3 border-b bg-muted/50">
                <p className="text-[11px] text-muted-foreground mb-0.5">Subject</p>
                <p className="text-sm font-medium">{template.subject}</p>
              </div>
              <div className="px-4 py-4">
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{template.body}</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <ChatCircle size={16} />
              <span className="text-xs font-medium uppercase tracking-wide">SMS Preview</span>
            </div>
            <div className="flex justify-end">
              <div className="bg-primary text-primary-foreground rounded-2xl rounded-tr-sm px-4 py-3 max-w-[85%]">
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{template.body}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-right">
              {template.body.length} / 160 characters
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
