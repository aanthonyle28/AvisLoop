'use client'

import { useState, useEffect, useTransition } from 'react'
import Link from 'next/link'
import { Buildings, Plus, LinkSimple, Copy, ArrowsClockwise } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { BusinessCard } from '@/components/businesses/business-card'
import { BusinessDetailDrawer } from '@/components/businesses/business-detail-drawer'
import { generateIntakeToken, regenerateIntakeToken } from '@/lib/actions/intake-token'
import { toast } from 'sonner'
import type { Business } from '@/lib/types/database'

interface BusinessesClientProps {
  businesses: Business[]
  activeBusinessId: string
}

export function BusinessesClient({ businesses, activeBusinessId }: BusinessesClientProps) {
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [intakeUrl, setIntakeUrl] = useState<string | null>(null)
  const [showIntakeLink, setShowIntakeLink] = useState(false)
  const [isGenerating, startGenerating] = useTransition()

  // Local businesses state enables optimistic updates after metadata edits
  const [localBusinesses, setLocalBusinesses] = useState<Business[]>(businesses)

  // Sync localBusinesses when the prop changes (e.g., after revalidatePath fires)
  useEffect(() => {
    setLocalBusinesses(businesses)
  }, [businesses])

  const handleBusinessUpdated = (updated: Business) => {
    setLocalBusinesses((prev) => prev.map((b) => (b.id === updated.id ? updated : b)))
    setSelectedBusiness(updated)
  }

  const handleBusinessDeleted = (businessId: string) => {
    setLocalBusinesses((prev) => prev.filter((b) => b.id !== businessId))
    setSelectedBusiness(null)
  }

  const handleGetIntakeLink = () => {
    startGenerating(async () => {
      const result = await generateIntakeToken()
      if ('error' in result) {
        toast.error(result.error)
        return
      }
      setIntakeUrl(`${window.location.origin}/intake/${result.token}`)
      setShowIntakeLink(true)
    })
  }

  const handleRegenerateIntakeLink = () => {
    startGenerating(async () => {
      const result = await regenerateIntakeToken()
      if ('error' in result) {
        toast.error(result.error)
        return
      }
      setIntakeUrl(`${window.location.origin}/intake/${result.token}`)
      toast.success('Intake link regenerated. Previous link is now invalid.')
    })
  }

  const handleCopyIntakeLink = () => {
    if (!intakeUrl) return
    navigator.clipboard.writeText(intakeUrl)
    toast.success('Link copied to clipboard')
  }

  return (
    <div className='space-y-6'>
      {/* Page header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Businesses</h1>
          <p className='text-muted-foreground mt-1'>Manage your client businesses</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleGetIntakeLink} disabled={isGenerating}>
            <LinkSimple size={16} weight="bold" />
            {isGenerating ? 'Loading...' : 'Client Intake Link'}
          </Button>
          <Button asChild>
            <Link href="/onboarding?mode=new">
              <Plus size={16} weight="bold" />
              Add Business
            </Link>
          </Button>
        </div>
      </div>

      {/* Intake link display */}
      {showIntakeLink && intakeUrl && (
        <div className="border rounded-lg p-4 bg-card space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-sm">Client Intake Link</h3>
            <button
              type="button"
              onClick={() => setShowIntakeLink(false)}
              className="text-muted-foreground hover:text-foreground text-sm"
            >
              Close
            </button>
          </div>
          <p className="text-sm text-muted-foreground">
            Share this link with new clients. They fill in their business details, and a new business is created under your account.
          </p>
          <div className="flex gap-2">
            <Input
              value={intakeUrl}
              readOnly
              className="text-sm font-mono"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <Button variant="outline" size="icon" onClick={handleCopyIntakeLink} aria-label="Copy link">
              <Copy size={16} />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={handleRegenerateIntakeLink}
              disabled={isGenerating}
              aria-label="Regenerate link"
            >
              <ArrowsClockwise size={16} />
            </Button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {localBusinesses.length === 0 ? (
        <div className='flex flex-col items-center justify-center py-16 px-4 text-center'>
          <div className='rounded-full bg-muted p-6 mb-6'>
            <Buildings size={48} weight='regular' className='text-muted-foreground' />
          </div>
          <h2 className='text-2xl font-semibold tracking-tight mb-2'>No businesses yet</h2>
          <p className='text-muted-foreground max-w-md'>
            Create your first business to get started with AvisLoop.
          </p>
        </div>
      ) : (
        /* Card grid */
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4'>
          {localBusinesses.map((business) => (
            <div
              key={business.id}
              onClick={() => {
                setSelectedBusiness(business)
                setDrawerOpen(true)
              }}
            >
              <BusinessCard business={business} isActive={business.id === activeBusinessId} />
            </div>
          ))}
        </div>
      )}

      {/* Detail drawer */}
      <BusinessDetailDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        business={selectedBusiness}
        isActive={selectedBusiness?.id === activeBusinessId}
        businessCount={localBusinesses.length}
        onBusinessUpdated={handleBusinessUpdated}
        onBusinessDeleted={handleBusinessDeleted}
      />
    </div>
  )
}
