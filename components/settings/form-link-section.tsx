'use client'

import { useState, useEffect } from 'react'
import {
  LinkSimple,
  Copy,
  Check,
  ArrowsClockwise,
} from '@phosphor-icons/react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { generateFormToken, regenerateFormToken } from '@/lib/actions/form-token'

interface FormLinkSectionProps {
  formToken: string | null
  businessName: string
}

/**
 * Settings section for managing the public job completion form URL.
 * Allows business owners to generate, copy, and regenerate the form link.
 * The link can be shared with technicians for on-site job submission (no AvisLoop account needed).
 */
export function FormLinkSection({ formToken, businessName }: FormLinkSectionProps) {
  const [token, setToken] = useState<string | null>(formToken)
  const [copied, setCopied] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [formUrl, setFormUrl] = useState<string>('')

  // Build the form URL client-side (window.location.origin is only available in browser)
  useEffect(() => {
    if (token) {
      setFormUrl(`${window.location.origin}/complete/${token}`)
    }
  }, [token])

  const handleGenerate = async () => {
    setIsGenerating(true)
    try {
      const result = await generateFormToken()
      if ('error' in result) {
        toast.error(result.error)
        return
      }
      setToken(result.token)
      toast.success('Form link generated')
    } catch {
      toast.error('Failed to generate form link')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRegenerate = async () => {
    const confirmed = window.confirm(
      'Regenerate link? The current link will stop working immediately. Technicians will need the new URL.'
    )
    if (!confirmed) return

    setIsGenerating(true)
    try {
      const result = await regenerateFormToken()
      if ('error' in result) {
        toast.error(result.error)
        return
      }
      setToken(result.token)
      toast.success('Form link regenerated — share the new URL with technicians')
    } catch {
      toast.error('Failed to regenerate form link')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = async () => {
    if (!formUrl) return
    try {
      await navigator.clipboard.writeText(formUrl)
      setCopied(true)
      toast.success('Form URL copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Failed to copy URL')
    }
  }

  return (
    <section className="rounded-xl border border-border bg-card p-6">
      <h2 className="text-lg font-semibold mb-1">Job Completion Form</h2>
      <p className="text-muted-foreground mb-4">
        Share this link with technicians so they can submit completed jobs on-site — no{' '}
        {businessName ? `${businessName} or ` : ''}AvisLoop account needed.
      </p>

      {token ? (
        <div className="space-y-3">
          {/* URL display with copy button */}
          <div className="flex items-center gap-2">
            <Input
              readOnly
              value={formUrl || `${typeof window !== 'undefined' ? window.location.origin : ''}/complete/${token}`}
              className="font-mono text-sm"
              aria-label="Job completion form URL"
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleCopy}
              aria-label="Copy form URL"
            >
              {copied ? (
                <Check size={16} weight="regular" />
              ) : (
                <Copy size={16} weight="regular" />
              )}
            </Button>
          </div>

          {/* Regenerate controls */}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRegenerate}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <ArrowsClockwise
                    size={14}
                    weight="regular"
                    className="mr-1.5 animate-spin"
                  />
                  Regenerating...
                </>
              ) : (
                <>
                  <ArrowsClockwise size={14} weight="regular" className="mr-1.5" />
                  Regenerate link
                </>
              )}
            </Button>
            <p className="text-xs text-muted-foreground">
              Regenerating invalidates the current link.
            </p>
          </div>
        </div>
      ) : (
        /* No token yet — show generate button */
        <Button
          type="button"
          onClick={handleGenerate}
          disabled={isGenerating}
        >
          {isGenerating ? (
            <>
              <ArrowsClockwise
                size={16}
                weight="regular"
                className="mr-2 animate-spin"
              />
              Generating...
            </>
          ) : (
            <>
              <LinkSimple size={16} weight="regular" className="mr-2" />
              Generate form link
            </>
          )}
        </Button>
      )}
    </section>
  )
}
