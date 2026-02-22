'use client'

import { createContext, useCallback, useContext, useRef, useState, useTransition } from 'react'
import { getAddJobData, type AddJobData } from '@/lib/actions/add-job-data'
import { AddJobSheet } from './add-job-sheet'

interface AddJobContextValue {
  openAddJob: () => void
}

const AddJobContext = createContext<AddJobContextValue | null>(null)

export function useAddJob() {
  const ctx = useContext(AddJobContext)
  if (!ctx) {
    throw new Error('useAddJob must be used within <AddJobProvider>')
  }
  return ctx
}

export function AddJobProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [data, setData] = useState<AddJobData | null>(null)
  const [isLoadingData, startTransition] = useTransition()
  const staleRef = useRef(true) // mark data stale so next open refreshes

  const openAddJob = useCallback(() => {
    setOpen(true)

    // Load or refresh data when stale
    if (staleRef.current) {
      startTransition(async () => {
        const result = await getAddJobData()
        setData(result)
        staleRef.current = false
      })
    }
  }, [])

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    setOpen(nextOpen)
    if (!nextOpen) {
      // Mark data stale so next open fetches fresh data
      staleRef.current = true
    }
  }, [])

  return (
    <AddJobContext.Provider value={{ openAddJob }}>
      {children}
      <AddJobSheet
        open={open}
        onOpenChange={handleOpenChange}
        customers={data?.customers ?? []}
        enabledServiceTypes={data?.enabledServiceTypes}
        isLoadingData={isLoadingData}
      />
    </AddJobContext.Provider>
  )
}
