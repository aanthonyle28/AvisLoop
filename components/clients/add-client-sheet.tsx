'use client'

import { useState, useEffect, useTransition } from 'react'
import { toast } from 'sonner'
import { CircleNotch } from '@phosphor-icons/react'
import {
  Sheet,
  SheetContent,
  SheetBody,
  SheetFooter,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createWebDesignClient } from '@/lib/actions/client'

interface AddClientSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type SubscriptionTier = 'basic' | 'advanced'

const TIER_LABELS: Record<SubscriptionTier, string> = {
  basic: 'Basic — $199/mo',
  advanced: 'Advanced — $299/mo',
}

export function AddClientSheet({ open, onOpenChange }: AddClientSheetProps) {
  const [isPending, startTransition] = useTransition()

  // Form fields
  const [businessName, setBusinessName] = useState('')
  const [ownerName, setOwnerName] = useState('')
  const [ownerEmail, setOwnerEmail] = useState('')
  const [ownerPhone, setOwnerPhone] = useState('')
  const [domain, setDomain] = useState('')
  const [subscriptionTier, setSubscriptionTier] = useState<SubscriptionTier>('basic')
  const [hasReviewAddon, setHasReviewAddon] = useState(false)

  // Reset form when sheet closes
  useEffect(() => {
    if (!open) {
      setBusinessName('')
      setOwnerName('')
      setOwnerEmail('')
      setOwnerPhone('')
      setDomain('')
      setSubscriptionTier('basic')
      setHasReviewAddon(false)
    }
  }, [open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    startTransition(async () => {
      const result = await createWebDesignClient({
        businessName,
        ownerName: ownerName || '',
        ownerEmail: ownerEmail || '',
        ownerPhone: ownerPhone || '',
        domain: domain || '',
        subscriptionTier,
        hasReviewAddon,
      })

      if (result.success) {
        toast.success('Client added successfully')
        onOpenChange(false)
      } else {
        toast.error(result.error)
      }
    })
  }

  const isValid = businessName.trim().length > 0

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>Add Client</SheetTitle>
          <SheetDescription>
            Create a new web design client. A project will be created in Discovery status.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <SheetBody>
            <div className="space-y-4">

              {/* Business Name */}
              <div className="space-y-2">
                <Label htmlFor="businessName">Business Name *</Label>
                <Input
                  id="businessName"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  placeholder="Acme Plumbing"
                  required
                  autoFocus
                />
              </div>

              {/* Owner Name */}
              <div className="space-y-2">
                <Label htmlFor="ownerName">Owner Name</Label>
                <Input
                  id="ownerName"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="Jane Smith"
                />
              </div>

              {/* Owner Email */}
              <div className="space-y-2">
                <Label htmlFor="ownerEmail">Owner Email</Label>
                <Input
                  id="ownerEmail"
                  type="email"
                  value={ownerEmail}
                  onChange={(e) => setOwnerEmail(e.target.value)}
                  placeholder="jane@acmeplumbing.com"
                />
              </div>

              {/* Owner Phone */}
              <div className="space-y-2">
                <Label htmlFor="ownerPhone">Owner Phone</Label>
                <Input
                  id="ownerPhone"
                  type="tel"
                  value={ownerPhone}
                  onChange={(e) => setOwnerPhone(e.target.value)}
                  placeholder="+1 (555) 123-4567"
                />
              </div>

              {/* Domain */}
              <div className="space-y-2">
                <Label htmlFor="domain">Domain</Label>
                <Input
                  id="domain"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  placeholder="acmeplumbing.com"
                />
              </div>

              {/* Subscription Tier */}
              <div className="space-y-2">
                <Label>Subscription Tier</Label>
                <div className="flex rounded-md border border-input">
                  {(Object.keys(TIER_LABELS) as SubscriptionTier[]).map((tier) => (
                    <button
                      key={tier}
                      type="button"
                      onClick={() => setSubscriptionTier(tier)}
                      className={`flex-1 px-3 py-2 text-sm font-medium transition-colors first:rounded-l-md last:rounded-r-md ${
                        subscriptionTier === tier
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-background text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {TIER_LABELS[tier]}
                    </button>
                  ))}
                </div>
              </div>

              {/* Review Add-on */}
              <div className="flex items-center gap-3 rounded-lg border border-input p-3">
                <input
                  id="hasReviewAddon"
                  type="checkbox"
                  checked={hasReviewAddon}
                  onChange={(e) => setHasReviewAddon(e.target.checked)}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                <div>
                  <Label htmlFor="hasReviewAddon" className="cursor-pointer font-medium">
                    Review Add-on
                  </Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Include automated review management for this client
                  </p>
                </div>
              </div>

            </div>
          </SheetBody>

          <SheetFooter>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending || !isValid}>
                {isPending && <CircleNotch className="mr-2 h-4 w-4 animate-spin" />}
                Add Client
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
