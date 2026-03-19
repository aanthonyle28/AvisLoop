'use client'

import { CurrencyDollar, Users } from '@phosphor-icons/react'

interface MrrSummaryBarProps {
  totalMrr: number
  activeCount: number
}

export function MrrSummaryBar({ totalMrr, activeCount }: MrrSummaryBarProps) {
  const formattedMrr = totalMrr.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })

  return (
    <div className="border rounded-lg p-4 bg-card flex items-center justify-between gap-4">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 shrink-0">
          <CurrencyDollar size={20} weight="bold" className="text-primary" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Total MRR
          </p>
          <p className="text-2xl font-bold leading-tight">${formattedMrr}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-primary/10 shrink-0">
          <Users size={20} weight="bold" className="text-primary" />
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
            Active Clients
          </p>
          <p className="text-2xl font-bold leading-tight">{activeCount}</p>
        </div>
      </div>
    </div>
  )
}
