'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Buildings, Plus, Copy } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { BusinessCard } from '@/components/businesses/business-card'
import { BusinessDetailDrawer } from '@/components/businesses/business-detail-drawer'
import { toast } from 'sonner'
import type { Business, WebProject } from '@/lib/types/database'

interface BusinessesClientProps {
  businesses: Business[]
  activeBusinessId: string
  intakeToken: string
  webProjectMap: Record<string, WebProject>
  ticketCountMap: Record<string, number>
}

export function BusinessesClient({ businesses, activeBusinessId, intakeToken, webProjectMap, ticketCountMap }: BusinessesClientProps) {
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

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

  const intakeUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/intake/${intakeToken}`
    : `/intake/${intakeToken}`

  const handleCopyIntakeLink = () => {
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
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleCopyIntakeLink} className="gap-1.5">
            <Copy size={14} />
            Intake Link
          </Button>
          <Button asChild size="sm">
            <Link href="/onboarding?mode=new">
              <Plus size={14} weight="bold" />
              Add Business
            </Link>
          </Button>
        </div>
      </div>

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
        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch'>
          {localBusinesses.map((business) => (
            <div
              key={business.id}
              className="h-full"
              onClick={() => {
                setSelectedBusiness(business)
                setDrawerOpen(true)
              }}
            >
              <BusinessCard business={business} isActive={business.id === activeBusinessId} webProject={webProjectMap[business.id] ?? null} openTicketCount={ticketCountMap[business.id] ?? 0} />
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
        webProject={selectedBusiness ? webProjectMap[selectedBusiness.id] ?? null : null}
      />
    </div>
  )
}
