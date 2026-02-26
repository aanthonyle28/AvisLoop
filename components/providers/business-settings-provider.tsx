'use client'

import { createContext, useContext } from 'react'
import type { ServiceType } from '@/lib/types/database'

interface BusinessSettingsContextValue {
  enabledServiceTypes: ServiceType[]
  customServiceNames: string[]
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
  children: React.ReactNode
}

export function BusinessSettingsProvider({
  enabledServiceTypes,
  customServiceNames,
  children,
}: BusinessSettingsProviderProps) {
  return (
    <BusinessSettingsContext.Provider value={{ enabledServiceTypes, customServiceNames }}>
      {children}
    </BusinessSettingsContext.Provider>
  )
}
