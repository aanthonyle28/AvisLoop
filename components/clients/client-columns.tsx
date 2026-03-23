'use client'

import { type ColumnDef } from '@tanstack/react-table'
import { StatusDot } from '@/components/ui/status-dot'
import type { WebDesignClient } from '@/lib/data/clients'

function getTierLabel(tier: string | null | undefined): { label: string; isUnlimited: boolean; limit: number | null } {
  if (tier === 'starter') return { label: 'Starter', isUnlimited: false, limit: 2 }
  if (tier === 'growth') return { label: 'Growth', isUnlimited: true, limit: null }
  if (tier === 'pro') return { label: 'Pro', isUnlimited: true, limit: null }
  return { label: '', isUnlimited: false, limit: null }
}

export const clientColumns: ColumnDef<WebDesignClient>[] = [
  {
    accessorKey: 'name',
    header: 'Business',
    cell: ({ row }) => (
      <div className="font-medium truncate">{row.original.name}</div>
    ),
  },
  {
    accessorKey: 'owner_name',
    header: 'Owner',
    cell: ({ row }) => {
      const ownerName = row.original.owner_name
      return ownerName ? (
        <span>{ownerName}</span>
      ) : (
        <span className="text-muted-foreground text-xs">—</span>
      )
    },
  },
  {
    id: 'web_design_tier',
    header: 'Tier',
    cell: ({ row }) => {
      const tier = row.original.web_design_tier
      if (!tier) return <span className="text-muted-foreground text-xs">—</span>
      const { label } = getTierLabel(tier)
      const isPro = tier === 'pro'
      const isGrowth = tier === 'growth'
      return (
        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${
          isPro ? 'bg-primary px-2 py-1 text-primary-foreground' :
          isGrowth ? 'bg-primary/10 text-primary' :
          'bg-muted text-muted-foreground'
        }`}>
          {label}
        </span>
      )
    },
  },
  {
    id: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.original.status
      if (status === 'active') {
        return <StatusDot dotColor="bg-success" label="Active" />
      }
      if (status === 'paused') {
        return <StatusDot dotColor="bg-warning" label="Paused" />
      }
      if (status === 'churned') {
        return <StatusDot dotColor="bg-muted-foreground" label="Churned" />
      }
      return <span className="text-muted-foreground text-xs">—</span>
    },
  },
  {
    accessorKey: 'domain',
    header: 'Domain',
    cell: ({ row }) => {
      const domain = row.original.domain
      return domain ? (
        <span className="text-sm font-mono truncate max-w-[140px] block">{domain}</span>
      ) : (
        <span className="text-muted-foreground text-xs">—</span>
      )
    },
  },
  {
    accessorKey: 'monthly_fee',
    header: 'MRR',
    cell: ({ row }) => {
      const fee = row.original.monthly_fee
      return fee !== null ? (
        <span className="text-right block">${fee.toFixed(0)}</span>
      ) : (
        <span className="text-muted-foreground text-xs text-right block">—</span>
      )
    },
  },
  {
    id: 'revisions',
    header: 'Revisions',
    cell: ({ row }) => {
      const used = row.original.revisions_used_this_month
      const { isUnlimited, limit } = getTierLabel(row.original.web_design_tier)
      if (!limit && !isUnlimited) {
        return <span className="text-muted-foreground text-xs">—</span>
      }
      if (isUnlimited) {
        return <span className="text-sm">{used}</span>
      }
      return (
        <span className="text-sm">
          {used} / {limit}
        </span>
      )
    },
  },
]
