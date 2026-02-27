'use client'

import { useState } from 'react'
import { Buildings } from '@phosphor-icons/react'
import { BusinessCard } from '@/components/businesses/business-card'
import type { Business } from '@/lib/types/database'

interface BusinessesClientProps {
  businesses: Business[]
  activeBusinessId: string
}

export function BusinessesClient({ businesses, activeBusinessId }: BusinessesClientProps) {
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  // Suppress unused variable warnings for state that will be used in Plan 55-03
  void selectedBusiness
  void drawerOpen

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Businesses</h1>
        <p className="text-muted-foreground mt-1">Manage your client businesses</p>
      </div>

      {/* Empty state */}
      {businesses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <div className="rounded-full bg-muted p-6 mb-6">
            <Buildings size={48} weight="regular" className="text-muted-foreground" />
          </div>
          <h2 className="text-2xl font-semibold tracking-tight mb-2">No businesses yet</h2>
          <p className="text-muted-foreground max-w-md">
            Create your first business to get started with AvisLoop.
          </p>
        </div>
      ) : (
        /* Card grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {businesses.map((business) => (
            <div
              key={business.id}
              onClick={() => {
                setSelectedBusiness(business)
                setDrawerOpen(true)
              }}
            >
              <BusinessCard
                business={business}
                isActive={business.id === activeBusinessId}
              />
            </div>
          ))}
        </div>
      )}

      {/* BusinessDetailDrawer will be added in Plan 55-03 */}
    </div>
  )
}
