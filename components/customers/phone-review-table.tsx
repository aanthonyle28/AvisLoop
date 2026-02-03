'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { parseAndValidatePhone } from '@/lib/utils/phone'
import { updateCustomerPhone, markCustomerEmailOnly } from '@/lib/actions/customer'
import { toast } from 'sonner'
import { Check, Envelope } from '@phosphor-icons/react'

interface PhoneIssue {
  id: string
  name: string
  email: string
  rawPhone: string
  suggestedParse?: string
}

interface PhoneReviewTableProps {
  issues: PhoneIssue[]
  onComplete: () => void
}

export function PhoneReviewTable({ issues, onComplete }: PhoneReviewTableProps) {
  const [editedPhones, setEditedPhones] = useState<Record<string, string>>(() => {
    // Initialize with raw values
    const initial: Record<string, string> = {}
    issues.forEach(issue => {
      initial[issue.id] = issue.rawPhone
    })
    return initial
  })

  const [processing, setProcessing] = useState<string | null>(null)
  const [resolved, setResolved] = useState<Set<string>>(new Set())

  const handleSavePhone = async (customerId: string) => {
    const phone = editedPhones[customerId]
    const result = parseAndValidatePhone(phone)

    if (!result.valid) {
      toast.error('Please enter a valid phone number or mark as email-only')
      return
    }

    setProcessing(customerId)

    const saveResult = await updateCustomerPhone(customerId, result.e164!, 'valid')

    if (saveResult.error) {
      toast.error(saveResult.error)
    } else {
      toast.success('Phone number saved')
      setResolved(prev => new Set(prev).add(customerId))
    }

    setProcessing(null)
  }

  const handleMarkEmailOnly = async (customerId: string) => {
    setProcessing(customerId)

    const result = await markCustomerEmailOnly(customerId)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success('Marked as email-only')
      setResolved(prev => new Set(prev).add(customerId))
    }

    setProcessing(null)
  }

  const unresolvedCount = issues.length - resolved.size

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <h3 className='font-medium'>Review Phone Numbers</h3>
        <span className='text-sm text-muted-foreground'>
          {unresolvedCount} remaining
        </span>
      </div>

      <div className='border rounded-lg overflow-hidden'>
        <table className='w-full'>
          <thead className='bg-muted/50'>
            <tr>
              <th className='px-4 py-2 text-left text-sm font-medium'>Customer</th>
              <th className='px-4 py-2 text-left text-sm font-medium'>Original Value</th>
              <th className='px-4 py-2 text-left text-sm font-medium'>Fix Phone</th>
              <th className='px-4 py-2 text-left text-sm font-medium'>Actions</th>
            </tr>
          </thead>
          <tbody>
            {issues.map(issue => {
              const isResolved = resolved.has(issue.id)
              const isProcessing = processing === issue.id

              return (
                <tr
                  key={issue.id}
                  className={isResolved ? 'opacity-50 bg-muted/20' : ''}
                >
                  <td className='px-4 py-3'>
                    <div>
                      <div className='font-medium'>{issue.name}</div>
                      <div className='text-sm text-muted-foreground'>{issue.email}</div>
                    </div>
                  </td>
                  <td className='px-4 py-3'>
                    <code className='text-sm bg-muted px-1 py-0.5 rounded'>
                      {issue.rawPhone}
                    </code>
                  </td>
                  <td className='px-4 py-3'>
                    <Input
                      value={editedPhones[issue.id] || ''}
                      onChange={(e) => setEditedPhones(prev => ({
                        ...prev,
                        [issue.id]: e.target.value
                      }))}
                      placeholder='(555) 123-4567'
                      disabled={isResolved || isProcessing}
                      className='w-40'
                    />
                  </td>
                  <td className='px-4 py-3'>
                    <div className='flex items-center gap-2'>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => handleSavePhone(issue.id)}
                        disabled={isResolved || isProcessing}
                      >
                        <Check className='h-4 w-4 mr-1' />
                        Save
                      </Button>
                      <Button
                        size='sm'
                        variant='ghost'
                        onClick={() => handleMarkEmailOnly(issue.id)}
                        disabled={isResolved || isProcessing}
                      >
                        <Envelope className='h-4 w-4 mr-1' />
                        Email-only
                      </Button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {unresolvedCount === 0 && (
        <div className='flex justify-end'>
          <Button onClick={onComplete}>
            Done
          </Button>
        </div>
      )}
    </div>
  )
}
