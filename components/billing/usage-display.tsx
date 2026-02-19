import Link from 'next/link'

interface UsageDisplayProps {
  sendCount: number
  sendLimit: number
  contactCount?: number      // Optional: only passed for basic tier
  contactLimit?: number      // Optional: only passed for basic tier (200)
  tier: string
}

export function UsageDisplay({ sendCount, sendLimit, contactCount, contactLimit, tier }: UsageDisplayProps) {
  const sendPercentage = (sendCount / sendLimit) * 100
  const sendRemaining = sendLimit - sendCount

  // Color based on usage level
  let sendBarColor = 'bg-primary'
  if (sendPercentage >= 100) sendBarColor = 'bg-destructive'
  else if (sendPercentage >= 80) sendBarColor = 'bg-warning'

  return (
    <div className="space-y-6">
      {/* Send usage */}
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Sends this month</span>
          <span className="font-medium">{sendCount} / {sendLimit}</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className={`h-full ${sendBarColor} transition-all`}
            style={{ width: `${Math.min(sendPercentage, 100)}%` }}
          />
        </div>
        {sendPercentage >= 80 && sendPercentage < 100 && (
          <p className="text-sm text-warning">
            {sendRemaining} sends remaining this month
          </p>
        )}
        {sendPercentage >= 100 && (
          <p className="text-sm text-destructive">
            {tier === 'trial' ? 'Trial' : 'Plan'} limit reached.{' '}
            <Link href="#plans" className="underline">Upgrade</Link> to keep sending.
          </p>
        )}
      </div>

      {/* Contact usage - only for Basic tier (BILL-07) */}
      {tier === 'basic' && contactCount !== undefined && contactLimit !== undefined && (
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Customers</span>
            <span className="font-medium">{contactCount} / {contactLimit}</span>
          </div>
          {(() => {
            const contactPercentage = (contactCount / contactLimit) * 100
            const contactRemaining = contactLimit - contactCount
            let contactBarColor = 'bg-primary'
            if (contactPercentage >= 100) contactBarColor = 'bg-destructive'
            else if (contactPercentage >= 80) contactBarColor = 'bg-warning'

            return (
              <>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full ${contactBarColor} transition-all`}
                    style={{ width: `${Math.min(contactPercentage, 100)}%` }}
                  />
                </div>
                {contactPercentage >= 80 && contactPercentage < 100 && (
                  <p className="text-sm text-warning">
                    {contactRemaining} customers remaining
                  </p>
                )}
                {contactPercentage >= 100 && (
                  <p className="text-sm text-destructive">
                    Customer limit reached. You can add more customers, but cannot send until you{' '}
                    <Link href="#plans" className="underline">upgrade</Link>.
                  </p>
                )}
              </>
            )
          })()}
        </div>
      )}
    </div>
  )
}
