import type { MessageTemplate } from '@/lib/types/database'
import { TemplateListItem } from '@/components/templates/template-list-item'

interface TemplateListProps {
  templates: MessageTemplate[]
  onUpdate?: () => void
}

export function TemplateList({ templates, onUpdate }: TemplateListProps) {
  if (templates.length === 0) {
    return (
      <p className="text-muted-foreground italic">
        No templates yet. Default templates will be available after you create your business profile.
      </p>
    )
  }

  // Group templates by channel
  const emailTemplates = templates.filter(t => t.channel === 'email')
  const smsTemplates = templates.filter(t => t.channel === 'sms')

  return (
    <div className="space-y-6">
      {/* Email Templates Section */}
      {emailTemplates.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Email Templates ({emailTemplates.length})
          </h3>
          <div className="space-y-3">
            {emailTemplates.map((template) => (
              <TemplateListItem
                key={template.id}
                template={template}
                onUpdate={onUpdate}
              />
            ))}
          </div>
        </div>
      )}

      {/* SMS Templates Section */}
      {smsTemplates.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            SMS Templates ({smsTemplates.length})
          </h3>
          <div className="space-y-3">
            {smsTemplates.map((template) => (
              <TemplateListItem
                key={template.id}
                template={template}
                onUpdate={onUpdate}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
