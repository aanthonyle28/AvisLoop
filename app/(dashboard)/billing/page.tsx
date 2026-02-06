import { getBusinessBillingInfo } from '@/lib/data/subscription'
import { redirect } from 'next/navigation'
import { PlanCard } from '@/components/billing/plan-card'
import { UsageDisplay } from '@/components/billing/usage-display'
import { SubscriptionStatus } from '@/components/billing/subscription-status'
import { CONTACT_LIMITS } from '@/lib/constants/billing'
import { CheckCircle } from '@phosphor-icons/react'

export const metadata = {
  title: 'Billing',
}

// Validate env vars at module load (SEC-03)
const basicPriceId = process.env.STRIPE_BASIC_PRICE_ID
const proPriceId = process.env.STRIPE_PRO_PRICE_ID

if (!basicPriceId || !proPriceId) {
  console.error('Missing Stripe price IDs in environment variables')
}

// Plan configuration
const PLANS = [
  {
    name: 'Basic',
    price: '$49',
    priceId: basicPriceId || '',
    tier: 'basic',
    features: [
      '200 review requests/month',
      '200 customers',
      'Email support',
    ],
  },
  {
    name: 'Pro',
    price: '$99',
    priceId: proPriceId || '',
    tier: 'pro',
    recommended: true,
    features: [
      '500 review requests/month',
      'Unlimited customers',
      'Priority support',
    ],
  },
]

export default async function BillingPage({
  searchParams,
}: {
  searchParams: Promise<{ success?: string; canceled?: string }>
}) {
  const { business, subscription, usage, contactCount } = await getBusinessBillingInfo()
  const params = await searchParams

  if (!business) {
    redirect('/dashboard/settings')
  }

  const showSuccess = params.success === '1'
  const showCanceled = params.canceled === '1'
  const contactLimit = CONTACT_LIMITS[business.tier]

  return (
    <div className="container mx-auto py-6 px-4 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Billing</h1>

      {/* Success message after checkout */}
      {showSuccess && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
          <CheckCircle size={20} weight="regular" className="text-green-600" />
          <div>
            <p className="font-medium text-green-800">Subscription activated!</p>
            <p className="text-sm text-green-700">
              You&apos;re now on the {business.tier === 'pro' ? 'Pro' : 'Basic'} plan.
            </p>
          </div>
        </div>
      )}

      {/* Canceled message */}
      {showCanceled && (
        <div className="mb-6 p-4 bg-muted rounded-lg">
          <p className="text-muted-foreground">Checkout was canceled. You can try again below.</p>
        </div>
      )}

      {/* Current subscription status */}
      <div className="mb-8">
        <SubscriptionStatus subscription={subscription} tier={business.tier} />
      </div>

      {/* Usage */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-4">Usage</h2>
        <div className="p-4 border rounded-lg">
          <UsageDisplay
            sendCount={usage.count}
            sendLimit={usage.limit}
            contactCount={contactCount}
            contactLimit={contactLimit}
            tier={business.tier}
          />
        </div>
      </div>

      {/* Plan options (show for trial users or if they want to upgrade) */}
      <div id="plans">
        <h2 className="text-lg font-semibold mb-4">
          {business.tier === 'trial' ? 'Choose a Plan' : 'Available Plans'}
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.name}
              name={plan.name}
              price={plan.price}
              priceId={plan.priceId}
              features={plan.features}
              current={business.tier === plan.tier}
              recommended={plan.recommended}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
