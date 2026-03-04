import type { Metadata } from 'next'
import { AuditForm } from '@/components/audit/audit-form'

export const metadata: Metadata = {
  title: 'Free Reputation Audit | AvisLoop',
  description:
    'See how your business stacks up on Google. Get a free reputation score card with actionable recommendations.',
}

/**
 * Public audit landing page — /audit
 *
 * Server Component. Inherits the marketing layout (nav + footer).
 * Not listed in middleware APP_ROUTES, so no auth redirect.
 *
 * Flow: AuditForm handles search → preview → email gate → redirect to /audit/[reportId]
 */
export default function AuditPage() {
  return (
    <section className="py-16 sm:py-24">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Hero */}
        <div className="flex flex-col items-center text-center gap-4 mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Free Google Reputation Audit
          </h1>
          <p className="text-lg text-muted-foreground max-w-xl">
            See how your business stacks up on Google in 30 seconds. No signup
            required.
          </p>
        </div>

        {/* Audit form — centered, max-w-md */}
        <div className="max-w-md mx-auto">
          <AuditForm />
        </div>

        {/* Trust signals + Google attribution (required by Places API TOS) */}
        <div className="mt-8 flex flex-col items-center gap-1 text-center">
          <p className="text-sm text-muted-foreground">
            Data sourced directly from Google Maps
          </p>
          <p className="text-xs text-muted-foreground/70">
            Powered by Google Places API. AvisLoop is not affiliated with or
            endorsed by Google LLC.
          </p>
        </div>
      </div>
    </section>
  )
}
