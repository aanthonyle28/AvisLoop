'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { X } from '@phosphor-icons/react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { createWebDesignProject } from '@/lib/actions/client'

interface WebDesignSetupFormProps {
  businessId: string
}

/**
 * Standalone form for adding web design project to an existing business.
 * Used when a reputation client upgrades to web_design or both.
 */
export function WebDesignSetupForm({ businessId }: WebDesignSetupFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [ownerName, setOwnerName] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [ownerPhone, setOwnerPhone] = useState('')
  const [domain, setDomain] = useState('')
  const [tier, setTier] = useState<'basic' | 'advanced'>('basic')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    startTransition(async () => {
      const result = await createWebDesignProject(businessId, {
        ownerName: ownerName.trim(),
        ownerEmail: ownerEmail.trim(),
        ownerPhone: ownerPhone.trim(),
        domain: domain.trim(),
        subscriptionTier: tier,
        hasReviewAddon: true, // they already have review, so this is both
      })

      if (!result.success) {
        setError(result.error || 'Failed to create web project')
        return
      }

      toast.success('Web design project created!')
      router.push('/businesses')
    })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 pb-20">
      {/* Cancel button */}
      <div className="fixed top-4 right-4 z-50">
        <button
          type="button"
          onClick={() => router.push('/businesses')}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          aria-label="Cancel and go back"
        >
          <X size={16} weight="bold" />
          Cancel
        </button>
      </div>

      <div className="w-full max-w-lg space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Set up web design project</h1>
          <p className="text-muted-foreground text-lg">
            Enter the web design project details for this client.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wd-owner-name">Owner / Contact name</Label>
              <Input
                id="wd-owner-name"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="e.g. John Smith"
                disabled={isPending}
                className="text-lg h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wd-owner-email">Owner email</Label>
              <Input
                id="wd-owner-email"
                type="email"
                value={ownerEmail}
                onChange={(e) => setOwnerEmail(e.target.value)}
                placeholder="john@example.com"
                disabled={isPending}
                className="text-lg h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wd-owner-phone">Owner phone</Label>
              <Input
                id="wd-owner-phone"
                type="tel"
                value={ownerPhone}
                onChange={(e) => setOwnerPhone(e.target.value)}
                placeholder="(555) 123-4567"
                disabled={isPending}
                className="text-lg h-12"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wd-domain">Domain</Label>
              <Input
                id="wd-domain"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
                placeholder="e.g. sunrisehvac.com"
                disabled={isPending}
                className="text-lg h-12"
              />
            </div>
            <div className="space-y-3">
              <Label>Subscription tier</Label>
              <div className="flex gap-2">
                {([
                  { value: 'basic' as const, label: 'Basic — $199/mo', desc: '1-4 pages, 2 revisions/mo' },
                  { value: 'advanced' as const, label: 'Advanced — $299/mo', desc: '4-10 pages, 4 revisions/mo' },
                ]).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setTier(opt.value)}
                    disabled={isPending}
                    className={cn(
                      'flex-1 px-3 py-3 rounded-lg border text-left transition-colors',
                      tier === opt.value
                        ? 'bg-foreground text-background border-foreground'
                        : 'bg-background border-border hover:border-foreground/50'
                    )}
                  >
                    <p className="text-sm font-medium">{opt.label}</p>
                    <p className={cn('text-xs mt-0.5', tier === opt.value ? 'text-background/70' : 'text-muted-foreground')}>{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button
            type="submit"
            className="w-full h-12 text-base"
            disabled={isPending}
          >
            {isPending ? 'Creating...' : 'Create Web Design Project'}
          </Button>
        </form>
      </div>
    </div>
  )
}
