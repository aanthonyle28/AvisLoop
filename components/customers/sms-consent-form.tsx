'use client'

import { useState } from 'react'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { updateCustomerSmsConsent } from '@/lib/actions/customer'
import { toast } from 'sonner'
import { CaretDown, CaretUp, Info } from '@phosphor-icons/react'

interface SmsConsentFormProps {
  customerId?: string  // For existing customers
  initialConsented?: boolean
  onConsentChange?: (consented: boolean, method?: string, notes?: string) => void
  mode?: 'inline' | 'standalone'  // inline for forms, standalone for drawer
}

const CONSENT_METHODS = [
  { value: 'verbal_in_person', label: 'Verbal (in-person)' },
  { value: 'phone_call', label: 'Phone call' },
  { value: 'service_agreement', label: 'Service agreement' },
  { value: 'website_form', label: 'Website form' },
  { value: 'other', label: 'Other' },
]

export function SmsConsentForm({
  customerId,
  initialConsented = false,
  onConsentChange,
  mode = 'inline',
}: SmsConsentFormProps) {
  const [consented, setConsented] = useState(initialConsented)
  const [showDetails, setShowDetails] = useState(false)
  const [method, setMethod] = useState<string>('')
  const [notes, setNotes] = useState('')
  const [saving, setSaving] = useState(false)

  const handleConsentChange = (checked: boolean) => {
    setConsented(checked)
    if (!checked) {
      setShowDetails(false)
      setMethod('')
      setNotes('')
    }
    onConsentChange?.(checked, method, notes)
  }

  const handleMethodChange = (newMethod: string) => {
    setMethod(newMethod)
    onConsentChange?.(consented, newMethod, notes)
  }

  const handleNotesChange = (newNotes: string) => {
    setNotes(newNotes)
    onConsentChange?.(consented, method, newNotes)
  }

  const handleSave = async () => {
    if (!customerId) return

    setSaving(true)

    // Get client IP via API route (optional enhancement)
    let clientIp: string | undefined
    try {
      const ipRes = await fetch('/api/client-ip')
      const ipData = await ipRes.json()
      clientIp = ipData.ip
    } catch {
      // IP capture is optional, continue without
    }

    const result = await updateCustomerSmsConsent(customerId, {
      status: consented ? 'opted_in' : 'opted_out',
      method: method || undefined,
      notes: notes || undefined,
      ip: clientIp,
    })

    setSaving(false)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(consented ? 'SMS consent recorded' : 'SMS opt-out recorded')
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-start space-x-3">
        <Checkbox
          id="sms-consent"
          checked={consented}
          onCheckedChange={handleConsentChange}
        />
        <div className="space-y-1">
          <Label htmlFor="sms-consent" className="font-medium cursor-pointer">
            Customer consented to receive texts (SMS)
          </Label>
          <p className="text-sm text-muted-foreground">
            Required for SMS follow-ups
          </p>
        </div>
      </div>

      {consented && (
        <div className="pl-6">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {showDetails ? <CaretUp className="h-4 w-4" /> : <CaretDown className="h-4 w-4" />}
            {showDetails ? 'Hide' : 'Add'} consent details
          </button>
        </div>
      )}

      {showDetails && consented && (
        <div className="pl-6 space-y-4 border-l-2 border-muted ml-2">
          <div className="space-y-2">
            <Label htmlFor="consent-method">Consent method</Label>
            <Select value={method || undefined} onValueChange={handleMethodChange}>
              <SelectTrigger id="consent-method" className="w-full">
                <SelectValue placeholder="How was consent given?" />
              </SelectTrigger>
              <SelectContent>
                {CONSENT_METHODS.map(m => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="consent-notes">Notes (optional)</Label>
            <Textarea
              id="consent-notes"
              value={notes}
              onChange={(e) => handleNotesChange(e.target.value)}
              placeholder="Additional context about consent..."
              rows={2}
            />
          </div>

          <div className="p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <strong className="text-foreground">TCPA Compliance:</strong> This information
                creates a legal audit trail. Consent must be explicitly given by the
                customer. Date, time, and capture method are recorded automatically.
              </div>
            </div>
          </div>
        </div>
      )}

      {mode === 'standalone' && customerId && (
        <div className="pt-2">
          <Button
            onClick={handleSave}
            disabled={saving}
            size="sm"
          >
            {saving ? 'Saving...' : 'Save consent status'}
          </Button>
        </div>
      )}
    </div>
  )
}
