'use client'

/**
 * Channel selector for email/SMS toggle on send page
 *
 * Uses Radix UI Tabs for accessible toggle behavior.
 * Shows SMS as disabled with reason when customer lacks phone or consent.
 *
 * @module components/send/channel-selector
 */

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Envelope, ChatCircle } from '@phosphor-icons/react'

interface ChannelSelectorProps {
  value: 'email' | 'sms'
  onChange: (channel: 'email' | 'sms') => void
  disabled?: boolean
  smsDisabled?: boolean
  smsDisabledReason?: string
}

/**
 * Channel selector toggle for email/SMS.
 * Shows SMS as disabled with reason when customer lacks phone or consent.
 *
 * SMS is disabled when:
 * - Customer has no valid phone number
 * - Customer sms_consent_status !== 'opted_in'
 */
export function ChannelSelector({
  value,
  onChange,
  disabled,
  smsDisabled,
  smsDisabledReason,
}: ChannelSelectorProps) {
  return (
    <div className="space-y-1">
      <Tabs value={value} onValueChange={(v) => onChange(v as 'email' | 'sms')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="email" disabled={disabled} className="gap-2">
            <Envelope className="h-4 w-4" />
            Email
          </TabsTrigger>
          <TabsTrigger value="sms" disabled={disabled || smsDisabled} className="gap-2">
            <ChatCircle className="h-4 w-4" />
            SMS
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {smsDisabled && smsDisabledReason && (
        <p className="text-sm text-muted-foreground">{smsDisabledReason}</p>
      )}
    </div>
  )
}
