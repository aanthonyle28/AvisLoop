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
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Trash, EnvelopeSimple, ChatCircle, Eye } from '@phosphor-icons/react'
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
    // For default (null template_id), find the matching system template by channel
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
    <div className="space-y-4">
      {touches.map((touch, index) => (
        <Card key={index}>
          <CardContent className="pt-4">
            <div className="flex items-start gap-4">
              {/* Touch number indicator */}
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-medium shrink-0">
                {touch.touch_number}
              </div>

              <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Channel */}
                <div className="space-y-2">
                  <Label>Channel</Label>
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

                {/* Delay */}
                <div className="space-y-2">
                  <Label>
                    {index === 0 ? 'Delay after job' : `Delay after touch ${index}`}
                  </Label>
                  <div className="flex gap-2">
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
                    <span className="flex items-center text-sm text-muted-foreground">
                      hours
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {touch.delay_hours < 24
                      ? `${touch.delay_hours} hours`
                      : `${Math.round(touch.delay_hours / 24)} days`}
                  </p>
                </div>

                {/* Template */}
                <div className="space-y-2">
                  <Label>Template</Label>
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

              {/* Preview button */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => {
                  setPreviewTemplate(resolveTemplate(touch))
                  setPreviewOpen(true)
                }}
                className="shrink-0"
                aria-label={`Preview touch ${index + 1} template`}
              >
                <Eye className="h-4 w-4" />
              </Button>

              {/* Remove button */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeTouch(index)}
                disabled={touches.length <= 1}
                className="shrink-0"
                aria-label={`Remove touch ${index + 1}`}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
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
