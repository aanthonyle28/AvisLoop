'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { createCheckoutSession } from '@/lib/actions/billing'
import { useTransition } from 'react'

interface PlanCardProps {
  name: string
  price: string
  priceId: string
  features: string[]
  current?: boolean
  recommended?: boolean
}

export function PlanCard({ name, price, priceId, features, current, recommended }: PlanCardProps) {
  const [isPending, startTransition] = useTransition()

  const handleSubscribe = () => {
    startTransition(() => {
      createCheckoutSession(priceId)
    })
  }

  return (
    <Card className={`relative ${recommended ? 'border-primary' : ''}`}>
      {recommended && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium">
          Recommended
        </div>
      )}
      <CardHeader>
        <CardTitle>{name}</CardTitle>
        <CardDescription>
          <span className="text-2xl font-bold">{price}</span>
          <span className="text-muted-foreground">/month</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-sm">
          {features.map((feature, i) => (
            <li key={i} className="flex items-center gap-2">
              <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {feature}
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        {current ? (
          <Button variant="outline" className="w-full" disabled>
            Current Plan
          </Button>
        ) : (
          <Button
            className="w-full"
            onClick={handleSubscribe}
            disabled={isPending}
          >
            {isPending ? 'Loading...' : 'Subscribe'}
          </Button>
        )}
      </CardFooter>
    </Card>
  )
}
