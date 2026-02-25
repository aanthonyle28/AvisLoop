'use client'

import { createContext, useContext, useState, useCallback } from 'react'
import type { RightPanelView } from '@/lib/types/dashboard'
import { RightPanel } from './right-panel'

// ─── Context ────────────────────────────────────────────────────────────────

interface DashboardPanelContextValue {
  panelView: RightPanelView
  setPanelView: (view: RightPanelView) => void
  closePanel: () => void
}

const DashboardPanelContext = createContext<DashboardPanelContextValue | null>(null)

export function useDashboardPanel(): DashboardPanelContextValue {
  const ctx = useContext(DashboardPanelContext)
  if (!ctx) {
    throw new Error('useDashboardPanel must be used within a DashboardShell or DashboardPanelProvider')
  }
  return ctx
}

// ─── Provider (standalone, for cases where shell layout isn't needed) ────────

interface DashboardPanelProviderProps {
  children: React.ReactNode
}

export function DashboardPanelProvider({ children }: DashboardPanelProviderProps) {
  const [panelView, setPanelView] = useState<RightPanelView>({ type: 'default' })

  const closePanel = useCallback(() => {
    setPanelView({ type: 'default' })
  }, [])

  return (
    <DashboardPanelContext.Provider value={{ panelView, setPanelView, closePanel }}>
      {children}
    </DashboardPanelContext.Provider>
  )
}

// ─── Shell (two-column layout with embedded provider) ────────────────────────

interface DashboardShellProps {
  /** Left column content — the task lists and main dashboard content */
  children: React.ReactNode
  /** Right panel default view — KPIs, recent activity */
  defaultContent: React.ReactNode
  /** Right panel detail view — job details or alert details */
  detailContent: React.ReactNode | null
  /** Right panel getting-started view */
  gettingStartedContent?: React.ReactNode
}

export function DashboardShell({
  children,
  defaultContent,
  detailContent,
  gettingStartedContent,
}: DashboardShellProps) {
  const [panelView, setPanelView] = useState<RightPanelView>({ type: 'default' })

  const closePanel = useCallback(() => {
    setPanelView({ type: 'default' })
  }, [])

  return (
    <DashboardPanelContext.Provider value={{ panelView, setPanelView, closePanel }}>
      <div className="flex gap-0 h-full -mr-4 sm:-mr-6 lg:-mr-8">
        {/* Left column — flexible, scrollable */}
        <div className="flex-1 min-w-0 overflow-y-auto">
          {children}
        </div>

        {/* Right panel — fixed width, hidden on mobile */}
        <RightPanel
          panelView={panelView}
          onClose={closePanel}
          defaultContent={defaultContent}
          detailContent={detailContent}
          gettingStartedContent={gettingStartedContent}
        />
      </div>
    </DashboardPanelContext.Provider>
  )
}
