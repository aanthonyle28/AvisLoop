'use client'

import { SERVICE_TYPES, SERVICE_TYPE_LABELS } from '@/lib/validations/job'
import type { ServiceType } from '@/lib/types/database'

interface ServiceTypeSelectProps {
  value: ServiceType | ''
  onChange: (value: ServiceType) => void
  error?: string
  enabledTypes?: ServiceType[] // Optional: only show enabled types for business
}

export function ServiceTypeSelect({
  value,
  onChange,
  error,
  enabledTypes,
}: ServiceTypeSelectProps) {
  // Filter to enabled types if provided, otherwise show all
  const availableTypes = enabledTypes && enabledTypes.length > 0
    ? SERVICE_TYPES.filter(t => enabledTypes.includes(t))
    : SERVICE_TYPES

  return (
    <div className="space-y-1">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as ServiceType)}
        className={`w-full rounded-md border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring ${
          error ? 'border-destructive' : 'border-input'
        }`}
      >
        <option value="">Select service type...</option>
        {availableTypes.map(type => (
          <option key={type} value={type}>
            {SERVICE_TYPE_LABELS[type]}
          </option>
        ))}
      </select>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
