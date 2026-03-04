'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { EnvelopeSimple, ChatCircle, Eye, ArrowRight } from '@phosphor-icons/react'
import { TemplatePreviewModal } from '@/components/campaigns/template-preview-modal'
import type { MessageTemplate } from '@/lib/types/database'

interface TouchData {
  id: string
  touch_number: number
  channel: 'email' | 'sms'
  delay_hours: number
  template_id: string | null
}

interface TouchSequenceDisplayProps {
  touches: TouchData[]
  templates: MessageTemplate[]
  serviceType?: string | null
}

function resolveTemplate(
  touch: TouchData,
  templates: MessageTemplate[],
  serviceType?: string | null
): { name: string; subject: string; body: string; channel: 'email' | 'sms' } | null {
  // 1. Explicit template_id takes priority
  if (touch.template_id) {
    const found = templates.find(t => t.id === touch.template_id)
    return found
      ? { name: found.name, subject: found.subject, body: found.body, channel: touch.channel as 'email' | 'sms' }
      : null
  }

  // 2. Try service-type-specific system template
  if (serviceType) {
    const serviceMatch = templates.find(
      t => t.is_default && t.channel === touch.channel && t.service_type === serviceType
    )
    if (serviceMatch) {
      return { name: serviceMatch.name, subject: serviceMatch.subject, body: serviceMatch.body, channel: touch.channel as 'email' | 'sms' }
    }
  }

  // 3. Fall back to any system template for this channel
  const systemTemplate = templates.find(t => t.is_default && t.channel === touch.channel)
  return systemTemplate
    ? { name: systemTemplate.name, subject: systemTemplate.subject, body: systemTemplate.body, channel: touch.channel as 'email' | 'sms' }
    : null
}

function formatDelay(hours: number, index: number): string {
  const anchor = index === 0 ? 'after job' : `after touch ${index}`
  if (hours < 24) return `${hours}h ${anchor}`
  return `${Math.round(hours / 24)}d ${anchor}`
}

export function TouchSequenceDisplay({ touches, templates, serviceType }: TouchSequenceDisplayProps) {
  const [previewTemplate, setPreviewTemplate] = useState<{
    name: string; subject: string; body: string; channel: 'email' | 'sms'
  } | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  return (
    <>
      <div className="space-y-3">
        {touches.map((touch, idx) => (
          <div key={touch.id}>
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
              {/* Touch number */}
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary text-primary-foreground text-xs font-semibold shrink-0">
                {touch.touch_number}
              </div>

              {/* Channel icon + info */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {touch.channel === 'email' ? (
                  <EnvelopeSimple className="h-4 w-4 text-muted-foreground shrink-0" />
                ) : (
                  <ChatCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
                <span className="text-sm font-medium capitalize">{touch.channel}</span>
                <span className="text-muted-foreground/40">·</span>
                <span className="text-sm text-muted-foreground">
                  {formatDelay(touch.delay_hours, idx)}
                </span>
              </div>

              {/* Preview button */}
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => {
                  setPreviewTemplate(resolveTemplate(touch, templates, serviceType))
                  setPreviewOpen(true)
                }}
                aria-label={`Preview touch ${touch.touch_number} template`}
              >
                <Eye className="h-4 w-4" />
              </Button>
            </div>

            {/* Connector arrow */}
            {idx < touches.length - 1 && (
              <div className="flex justify-center py-1">
                <ArrowRight className="h-3 w-3 text-muted-foreground/40 rotate-90" />
              </div>
            )}
          </div>
        ))}
      </div>

      <TemplatePreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        template={previewTemplate}
      />
    </>
  )
}
