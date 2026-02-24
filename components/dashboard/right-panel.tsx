'use client'

import { X } from '@phosphor-icons/react'
import type { RightPanelView } from '@/lib/types/dashboard'

interface RightPanelProps {
  panelView: RightPanelView
  onClose: () => void
  defaultContent: React.ReactNode
  detailContent: React.ReactNode | null
  gettingStartedContent?: React.ReactNode
}

function getPanelTitle(view: RightPanelView): string {
  switch (view.type) {
    case 'job-detail':
      return 'Job Details'
    case 'attention-detail':
      return 'Alert Details'
    case 'getting-started':
      return 'Getting Started'
    default:
      return ''
  }
}

export function RightPanel({
  panelView,
  onClose,
  defaultContent,
  detailContent,
  gettingStartedContent,
}: RightPanelProps) {
  const isDetailView = panelView.type !== 'default'
  const title = getPanelTitle(panelView)

  function renderContent() {
    switch (panelView.type) {
      case 'default':
        return defaultContent
      case 'job-detail':
      case 'attention-detail':
        return detailContent
      case 'getting-started':
        return gettingStartedContent ?? null
    }
  }

  return (
    <aside className="hidden lg:flex lg:flex-col w-[360px] shrink-0 border-l border-border bg-card overflow-y-auto">
      {/* Sticky header — only shown for detail views */}
      {isDetailView && (
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-border bg-card">
          <span className="text-sm font-medium text-foreground">{title}</span>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center h-7 w-7 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Close panel"
          >
            <X size={16} weight="bold" />
          </button>
        </div>
      )}

      {/* Content — key triggers re-mount on view change for clean transitions */}
      <div
        key={panelView.type}
        className="flex-1 animate-in fade-in-0 slide-in-from-right-2 duration-200"
      >
        {renderContent()}
      </div>
    </aside>
  )
}
