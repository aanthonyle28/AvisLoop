import type { EmailTemplate } from '@/lib/types/database'

interface TemplateListProps {
  templates: EmailTemplate[]
}

export function TemplateList({ templates }: TemplateListProps) {
  if (templates.length === 0) {
    return (
      <p className="text-muted-foreground italic">
        No templates yet. Default templates will be available after you create your business profile.
      </p>
    )
  }

  return (
    <div className="space-y-4">
      {templates.map((template) => (
        <div
          key={template.id}
          className="border rounded-md p-4 bg-muted/50"
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-medium">
              {template.name}
              {template.is_default && (
                <span className="ml-2 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                  System Default
                </span>
              )}
            </h4>
          </div>
          <p className="text-sm text-muted-foreground mb-2">
            <span className="font-medium">Subject:</span> {template.subject}
          </p>
          <details className="text-sm">
            <summary className="cursor-pointer text-primary hover:text-primary/80">
              View body
            </summary>
            <pre className="mt-2 p-3 bg-background border rounded text-xs whitespace-pre-wrap font-mono">
              {template.body}
            </pre>
          </details>
        </div>
      ))}
    </div>
  )
}
