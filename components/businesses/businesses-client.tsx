'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Buildings, Plus } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { BusinessCard } from '@/components/businesses/business-card'
import { BusinessDetailDrawer } from '@/components/businesses/business-detail-drawer'
import type { Business } from '@/lib/types/database'

interface BusinessesClientProps {
  businesses: Business[]
  activeBusinessId: string
}

export function BusinessesClient({ businesses, activeBusinessId }: BusinessesClientProps) {
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

  return (
    <div className='space-y-6'>
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Businesses</h1>
          <p className='text-muted-foreground mt-1'>Manage your client businesses</p>
        </div>
        <Button asChild>
          <Link href="/onboarding?mode=new">
            <Plus size={16} weight="bold" />
            Add Business
          </Link>
        </Button>
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
