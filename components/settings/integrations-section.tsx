'use client'

import { useState, useEffect } from 'react'
import { Key, Copy, Check, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { generateApiKeyAction } from '@/lib/actions/api-key'

type IntegrationsSectionProps = {
  hasExistingKey: boolean
}

export function IntegrationsSection({ hasExistingKey }: IntegrationsSectionProps) {
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState<'key' | 'url' | null>(null)
  const [webhookUrl, setWebhookUrl] = useState('/api/webhooks/contacts')

  useEffect(() => {
    setWebhookUrl(`${window.location.origin}/api/webhooks/contacts`)
  }, [])

  const handleGenerateKey = async () => {
    setIsGenerating(true)
    try {
      const result = await generateApiKeyAction()

      if (result.error) {
        toast.error(result.error)
        return
      }

      if (result.key) {
        setApiKey(result.key)
        toast.success(hasExistingKey ? 'API key regenerated' : 'API key generated')
      }
    } catch (err) {
      console.error('Failed to generate API key:', err)
      toast.error('Failed to generate API key')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopy = async (text: string, type: 'key' | 'url') => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(type)
      toast.success('Copied to clipboard')
      setTimeout(() => setCopied(null), 2000)
    } catch {
      toast.error('Failed to copy')
    }
  }

  const curlExample = apiKey
    ? `curl -X POST ${webhookUrl} \\
  -H "x-api-key: ${apiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"John Doe","email":"john@example.com","phone":"555-1234"}'`
    : `curl -X POST ${webhookUrl} \\
  -H "x-api-key: YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"name":"John Doe","email":"john@example.com","phone":"555-1234"}'`

  return (
    <div className="space-y-6">
      {/* Webhook URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Webhook URL
        </label>
        <div className="flex items-center gap-2">
          <code className="flex-1 px-3 py-2 bg-gray-50 border rounded-md text-sm font-mono">
            {webhookUrl}
          </code>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => handleCopy(webhookUrl, 'url')}
          >
            {copied === 'url' ? (
              <Check className="h-4 w-4" />
            ) : (
              <Copy className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* API Key Generation */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          API Key
        </label>

        {!apiKey ? (
          <div className="space-y-3">
            <Button
              type="button"
              onClick={handleGenerateKey}
              disabled={isGenerating}
              className="w-full sm:w-auto"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Key className="h-4 w-4 mr-2" />
                  {hasExistingKey ? 'Regenerate API Key' : 'Generate API Key'}
                </>
              )}
            </Button>

            {hasExistingKey && (
              <p className="text-sm text-amber-600">
                Warning: Regenerating will invalidate your current key.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {/* Show generated key */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <p className="text-sm font-medium text-amber-800 mb-2">
                Copy this key now. It won&apos;t be shown again.
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-white border border-amber-300 rounded-md text-sm font-mono break-all">
                  {apiKey}
                </code>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleCopy(apiKey, 'key')}
                >
                  {copied === 'key' ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Allow regeneration */}
            <Button
              type="button"
              variant="outline"
              onClick={handleGenerateKey}
              disabled={isGenerating}
              size="sm"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Generate New Key
            </Button>
          </div>
        )}
      </div>

      {/* Usage Instructions */}
      <div className="border-t pt-6">
        <h3 className="text-sm font-medium text-gray-700 mb-3">
          Usage Instructions
        </h3>

        <div className="space-y-4 text-sm text-gray-600">
          <p>
            Send a POST request with the <code className="px-1.5 py-0.5 bg-gray-100 rounded text-xs font-mono">x-api-key</code> header to create or update contacts:
          </p>

          <div className="bg-gray-50 rounded-lg p-4 overflow-x-auto">
            <pre className="text-xs font-mono whitespace-pre">{curlExample}</pre>
          </div>

          <div>
            <p className="font-medium text-gray-700 mb-2">Compatible with:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li>Zapier (Webhooks by Zapier action)</li>
              <li>Make (HTTP module)</li>
              <li>n8n (HTTP Request node)</li>
              <li>Any tool that can send HTTP POST requests</li>
            </ul>
          </div>

          <div>
            <p className="font-medium text-gray-700 mb-2">Request body fields:</p>
            <ul className="list-disc list-inside space-y-1 ml-2">
              <li><code className="text-xs">name</code> (required): Contact&apos;s full name</li>
              <li><code className="text-xs">email</code> (required): Contact&apos;s email address</li>
              <li><code className="text-xs">phone</code> (optional): Contact&apos;s phone number</li>
            </ul>
          </div>

          <p className="text-xs text-gray-500">
            Rate limit: 60 requests per minute per API key
          </p>
        </div>
      </div>
    </div>
  )
}
