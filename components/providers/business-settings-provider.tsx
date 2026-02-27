'use client'

import { createContext, useContext } from 'react'
import type { ServiceType } from '@/lib/types/database'

export interface BusinessIdentity {
  id: string
  name: string
}

interface BusinessSettingsContextValue {
  enabledServiceTypes: ServiceType[]
  customServiceNames: string[]
  businessId: string
  businessName: string
  businesses: BusinessIdentity[]
}

const BusinessSettingsContext = createContext<BusinessSettingsContextValue | null>(null)

export function useBusinessSettings() {
  const ctx = useContext(BusinessSettingsContext)
  if (!ctx) {
    throw new Error('useBusinessSettings must be used within <BusinessSettingsProvider>')
  }
  return ctx
}

interface BusinessSettingsProviderProps {
  enabledServiceTypes: ServiceType[]
  customServiceNames: string[]
  businessId: string
  businessName: string
  businesses: BusinessIdentity[]
  children: React.ReactNode
}

export function BusinessSettingsProvider({
  enabledServiceTypes,
  customServiceNames,
  businessId,
  businessName,
  businesses,
  children,
}: BusinessSettingsProviderProps) {
  return (
    <BusinessSettingsContext.Provider
      value={{ enabledServiceTypes, customServiceNames, businessId, businessName, businesses }}
    >
      {children}
    </BusinessSettingsContext.Provider>
  )
}
