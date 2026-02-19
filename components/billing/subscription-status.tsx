'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { createPortalSession } from '@/lib/actions/billing'
import { useTransition } from 'react'
import { format } from 'date-fns'
import type { Subscription } from '@/lib/types/database'

interface SubscriptionStatusProps {
  subscription: Subscription | null
  tier: string
}

export function SubscriptionStatus({ subscription, tier }: SubscriptionStatusProps) {
  const [isPending, startTransition] = useTransition()

  const handleManage = () => {
    startTransition(() => {
      createPortalSession()
    })
  }

  // Trial user (no subscription)
  if (!subscription || tier === 'trial') {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Free Trial</CardTitle>
          <CardDescription>You&apos;re on the free trial with 25 sends</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Subscribe to a plan for more sends and features.
          </p>
        </CardContent>
      </Card>
    )
  }

  // Active subscription
  const planName = tier === 'pro' ? 'Pro' : 'Basic'
  const renewalDate = subscription.current_period_end
    ? format(new Date(subscription.current_period_end), 'MMMM d, yyyy')
    : null

  return (
    <Card>
      <CardHeader>
        <CardTitle>{planName} Plan</CardTitle>
        <CardDescription>
          {subscription.cancel_at_period_end
            ? `Cancels on ${renewalDate}`
            : `Renews on ${renewalDate}`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {subscription.status === 'past_due' && (
          <div className="text-sm text-warning bg-warning-bg p-3 rounded-lg">
            Payment failed. Please update your payment method to avoid service interruption.
          </div>
        )}
        <Button
          variant="outline"
          onClick={handleManage}
          disabled={isPending}
        >
          {isPending ? 'Loading...' : 'Manage Subscription'}
        </Button>
      </CardContent>
    </Card>
  )
}
