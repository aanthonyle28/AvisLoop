'use client'

import { SERVICE_TYPES, SERVICE_TYPE_LABELS } from '@/lib/validations/job'
import type { ServiceType } from '@/lib/types/database'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ServiceTypeSelectProps {
  value: ServiceType | ''
  onChange: (value: ServiceType) => void
  error?: string
  enabledTypes?: ServiceType[] // Optional: only show enabled types for business
  customServiceNames?: string[] // Custom names for 'other' service type
}

export function ServiceTypeSelect({
  value,
  onChange,
  error,
  enabledTypes,
  customServiceNames,
}: ServiceTypeSelectProps) {
  // Filter to enabled types if provided, otherwise show all
  const availableTypes = enabledTypes && enabledTypes.length > 0
    ? SERVICE_TYPES.filter(t => enabledTypes.includes(t))
    : SERVICE_TYPES

  return (
    <div className="space-y-1">
      <Select
        value={value || undefined}
        onValueChange={(val) => onChange(val as ServiceType)}
      >
        <SelectTrigger className={error ? 'border-destructive' : ''}>
          <SelectValue placeholder="Select service type..." />
        </SelectTrigger>
        <SelectContent>
          {availableTypes.flatMap(type => {
            if (type === 'other' && customServiceNames && customServiceNames.length > 0) {
              if (customServiceNames.length === 1) {
                return [<SelectItem key="other" value="other">{customServiceNames[0]}</SelectItem>]
              }
              return [<SelectItem key="other" value="other">{customServiceNames.join(', ')}</SelectItem>]
            }
            return [
              <SelectItem key={type} value={type}>
                {SERVICE_TYPE_LABELS[type]}
              </SelectItem>
            ]
          })}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  )
}
