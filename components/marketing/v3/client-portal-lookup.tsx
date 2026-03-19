'use client'

import { useState } from 'react'
import { EnvelopeSimple, ArrowRight, SpinnerGap } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'

interface LookupResult {
  name: string
  portalPath: string
}

export function ClientPortalLookup() {
  const [email, setEmail] = useState('')
  const [results, setResults] = useState<LookupResult[]>([])
  const [searched, setSearched] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim() || !email.includes('@')) return

    setLoading(true)
    setSearched(false)
    try {
      const res = await fetch('/api/portal/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json() as { results: LookupResult[] }
      setResults(data.results)
      setSearched(true)

      // If exactly one result, navigate directly
      if (data.results.length === 1) {
        window.open(data.results[0].portalPath, '_blank')
      }
    } catch {
      setResults([])
      setSearched(true)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Search form */}
      <form onSubmit={handleSearch} className="space-y-3">
        <div className="relative">
          <EnvelopeSimple
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setSearched(false) }}
            placeholder="Enter your email address..."
            className="w-full rounded-lg border border-input bg-background pl-10 pr-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1"
            autoFocus
          />
        </div>
        <Button
          type="submit"
          disabled={loading || !email.includes('@')}
          className="w-full h-11"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <SpinnerGap size={16} className="animate-spin" />
              Searching...
            </span>
          ) : (
            'Access Portal'
          )}
        </Button>
      </form>

      {/* Results */}
      {searched && results.length === 0 && (
        <div className="rounded-lg border border-dashed border-muted-foreground/30 py-8 px-4 text-center">
          <p className="text-sm text-muted-foreground">
            No portal found for that email address.
          </p>
        </div>
      )}

      {searched && results.length > 1 && (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Multiple projects found. Select one:</p>
          {results.map((result) => (
            <button
              key={result.portalPath}
              type="button"
              onClick={() => window.open(result.portalPath, '_blank')}
              className="w-full flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-left hover:bg-muted transition-colors"
            >
              <span className="font-medium text-sm">{result.name}</span>
              <ArrowRight size={16} className="text-muted-foreground" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
