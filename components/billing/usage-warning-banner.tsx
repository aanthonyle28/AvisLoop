import Link from 'next/link'
import { Warning } from '@phosphor-icons/react'

interface UsageWarningBannerProps {
  count: number
  limit: number
  tier: string
  contactCount?: number
  contactLimit?: number
}

export function UsageWarningBanner({
  count,
  limit,
  tier,
  contactCount,
  contactLimit,
}: UsageWarningBannerProps) {
  const sendPercentage = (count / limit) * 100
  const sendRemaining = limit - count

  // BILL-07: Check contact limit for Basic tier
  const contactsOverLimit =
    tier === 'basic' &&
    contactCount !== undefined &&
    contactLimit !== undefined &&
    contactCount > contactLimit

  // Show contact over-limit warning (BILL-07)
  if (contactsOverLimit) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Warning size={20} weight="regular" className="text-destructive shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium text-destructive">Customer limit exceeded</p>
            <p className="text-sm text-destructive/80">
              You have {contactCount} customers but your Basic plan allows{' '}
              {contactLimit}.{' '}
              <Link href="/billing" className="underline font-medium">
                Upgrade to Pro
              </Link>{' '}
              for unlimited customers, or remove some customers to send.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Don't show send warning below 80%
  if (sendPercentage < 80) return null

  // Send limit reached
  if (sendPercentage >= 100) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Warning size={20} weight="regular" className="text-destructive shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium text-destructive">
              {tier === 'trial' ? 'Trial' : 'Monthly'} limit reached
            </p>
            <p className="text-sm text-destructive/80">
              You&apos;ve used all {limit} sends this month.{' '}
              <Link href="/billing" className="underline font-medium">
                {tier === 'trial' ? 'Start a plan' : 'Upgrade your plan'}
              </Link>{' '}
              to keep sending messages.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Warning at 80%+
  return (
    <div className="bg-warning-bg border border-warning-border rounded-lg p-4 mb-6">
      <div className="flex items-start gap-3">
        <Warning size={20} weight="regular" className="text-warning shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-medium text-warning-foreground">
            {sendRemaining} sends remaining this month
          </p>
          <p className="text-sm text-warning">
            You&apos;ve used {count} of {limit} sends.{' '}
            <Link href="/billing" className="underline">
              View billing
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
