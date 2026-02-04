'use client'

import { useState } from 'react'
import { EnvelopeSimple, ChatCircle, Copy, Trash, CaretDown, CaretUp } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import { copySystemTemplate, deleteMessageTemplate } from '@/lib/actions/message-template'
import type { MessageTemplate } from '@/lib/types/database'

interface TemplateListItemProps {
  template: MessageTemplate
  onUpdate?: () => void
}

export function TemplateListItem({ template, onUpdate }: TemplateListItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isCopying, setIsCopying] = useState(false)

  const isEmail = template.channel === 'email'
  const isSystemTemplate = template.is_default

  const handleCopy = async () => {
    setIsCopying(true)
    try {
      const result = await copySystemTemplate(template.id)
      if (result.success) {
        toast.success('Template copied successfully')
        onUpdate?.()
      } else {
        toast.error(result.error || 'Failed to copy template')
      }
    } catch {
      toast.error('Failed to copy template')
    } finally {
      setIsCopying(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this template?')) {
      return
    }

    setIsDeleting(true)
    try {
      const result = await deleteMessageTemplate(template.id)
      if (result.success) {
        toast.success('Template deleted')
        onUpdate?.()
      } else {
        toast.error(result.error || 'Failed to delete template')
      }
    } catch {
      toast.error('Failed to delete template')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="border border-border rounded-md p-4 bg-card">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 flex-1">
          {/* Channel badge */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium ${
              isEmail
                ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                : 'bg-green-100 dark:bg-green-950 text-green-700 dark:text-green-300'
            }`}
          >
            {isEmail ? (
              <EnvelopeSimple size={14} weight="bold" />
            ) : (
              <ChatCircle size={14} weight="bold" />
            )}
            <span>{isEmail ? 'Email' : 'SMS'}</span>
          </div>

          <div className="flex-1">
            <h4 className="font-medium text-foreground">{template.name}</h4>
            {isSystemTemplate && (
              <span className="inline-block mt-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                System Template
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {isSystemTemplate ? (
            <Button
              size="sm"
              variant="outline"
              onClick={handleCopy}
              disabled={isCopying}
            >
              <Copy size={16} className="mr-1.5" />
              {isCopying ? 'Copying...' : 'Use this template'}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={handleDelete}
              disabled={isDeleting}
              className="text-destructive hover:text-destructive"
            >
              <Trash size={16} className="mr-1.5" />
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          )}
        </div>
      </div>

      {/* Subject line (email only) */}
      {isEmail && template.subject && (
        <p className="text-sm text-muted-foreground mb-2">
          <span className="font-medium">Subject:</span> {template.subject}
        </p>
      )}

      {/* Expandable body */}
      <div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="flex items-center gap-1 text-sm text-primary hover:text-primary/80 font-medium"
        >
          {isExpanded ? (
            <>
              <CaretUp size={16} weight="bold" />
              Hide message
            </>
          ) : (
            <>
              <CaretDown size={16} weight="bold" />
              View message
            </>
          )}
        </button>

        {isExpanded && (
          <pre className="mt-3 p-3 bg-muted border border-border rounded text-xs whitespace-pre-wrap font-mono text-foreground">
            {template.body}
          </pre>
        )}
      </div>
    </div>
  )
}
