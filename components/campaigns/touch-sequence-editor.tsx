'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash, EnvelopeSimple, ChatCircle, Eye, ArrowDown } from '@phosphor-icons/react'
import { TemplatePreviewModal } from '@/components/campaigns/template-preview-modal'
import type { CampaignTouchFormData } from '@/lib/validations/campaign'
import type { MessageTemplate, MessageChannel } from '@/lib/types/database'

interface TouchSequenceEditorProps {
  touches: CampaignTouchFormData[]
  templates: MessageTemplate[]
  onChange: (touches: CampaignTouchFormData[]) => void
}

export function TouchSequenceEditor({
  touches,
  templates,
  onChange,
}: TouchSequenceEditorProps) {
  const [previewTemplate, setPreviewTemplate] = useState<{
    name: string
    subject: string
    body: string
    channel: 'email' | 'sms'
  } | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)

  const addTouch = () => {
    if (touches.length >= 4) return

    const newTouch: CampaignTouchFormData = {
      touch_number: touches.length + 1,
      channel: 'email',
      delay_hours: touches.length === 0 ? 24 : 48,
      template_id: null,
    }

    onChange([...touches, newTouch])
  }

  const removeTouch = (index: number) => {
    if (touches.length <= 1) return

    const newTouches = touches
      .filter((_, i) => i !== index)
      .map((t, i) => ({ ...t, touch_number: i + 1 }))

    onChange(newTouches)
  }

  const updateTouch = (index: number, updates: Partial<CampaignTouchFormData>) => {
    const newTouches = touches.map((t, i) =>
      i === index ? { ...t, ...updates } : t
    )
    onChange(newTouches)
  }

  const getTemplatesForChannel = (channel: MessageChannel) =>
    templates.filter(t => t.channel === channel)

  const resolveTemplate = (touch: CampaignTouchFormData) => {
    if (touch.template_id) {
      const found = templates.find(t => t.id === touch.template_id)
      return found
        ? { name: found.name, subject: found.subject, body: found.body, channel: touch.channel }
        : null
    }
    const systemTemplate = templates.find(
      t => t.is_default && t.channel === touch.channel
    )
    return systemTemplate
      ? {
          name: systemTemplate.name,
          subject: systemTemplate.subject,
          body: systemTemplate.body,
          channel: touch.channel,
        }
      : null
  }

  return (
    <div className="space-y-3">
      {touches.map((touch, index) => (
        <div key={index}>
          <div className="rounded-lg border bg-card">
            {/* Touch header */}
            <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/20">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                  {touch.touch_number}
                </div>
                <div className="flex items-center gap-1.5 text-sm">
                  {touch.channel === 'email' ? (
                    <EnvelopeSimple className="h-3.5 w-3.5 text-muted-foreground" />
                  ) : (
                    <ChatCircle className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                  <span className="font-medium capitalize">{touch.channel}</span>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-muted-foreground">
                    {touch.delay_hours < 24
                      ? `${touch.delay_hours}h`
                      : `${Math.round(touch.delay_hours / 24)}d`}
                    {' '}
                    {index === 0 ? 'after job' : `after touch ${index}`}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => {
                    setPreviewTemplate(resolveTemplate(touch))
                    setPreviewOpen(true)
                  }}
                  aria-label={`Preview touch ${index + 1} template`}
                >
                  <Eye className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeTouch(index)}
                  disabled={touches.length <= 1}
                  aria-label={`Remove touch ${index + 1}`}
                  className="text-muted-foreground hover:text-destructive"
                >
                  <Trash className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            {/* Touch fields */}
            <div className="p-4 space-y-4">
              {/* Channel + Delay row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Channel</Label>
                  <Select
                    value={touch.channel}
                    onValueChange={(value: MessageChannel) => {
                      updateTouch(index, { channel: value, template_id: null })
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">
                        <span className="flex items-center gap-2">
                          <EnvelopeSimple className="h-4 w-4" />
                          Email
                        </span>
                      </SelectItem>
                      <SelectItem value="sms">
                        <span className="flex items-center gap-2">
                          <ChatCircle className="h-4 w-4" />
                          SMS
                        </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    {index === 0 ? 'Delay after job' : `Delay after touch ${index}`}
                  </Label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={720}
                      value={touch.delay_hours}
                      onChange={(e) =>
                        updateTouch(index, { delay_hours: parseInt(e.target.value) || 1 })
                      }
                      className="w-20"
                    />
                    <span className="text-sm text-muted-foreground">hours</span>
                  </div>
                </div>
              </div>

              {/* Template — full width */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Template</Label>
                <Select
                  value={touch.template_id || 'default'}
                  onValueChange={(value) =>
                    updateTouch(index, { template_id: value === 'default' ? null : value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Use default" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="default">Use default template</SelectItem>
                    {getTemplatesForChannel(touch.channel).map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Timeline connector */}
          {index < touches.length - 1 && (
            <div className="flex justify-center py-1">
              <ArrowDown className="h-3 w-3 text-muted-foreground/30" />
            </div>
          )}
        </div>
      ))}

      {touches.length < 4 && (
        <Button type="button" variant="outline" onClick={addTouch} className="w-full">
          <Plus className="mr-2 h-4 w-4" />
          Add Touch ({touches.length}/4)
        </Button>
      )}

      <TemplatePreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        template={previewTemplate}
      />
    </div>
  )
}
