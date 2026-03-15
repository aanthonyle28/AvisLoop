import { notFound } from 'next/navigation'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { ClientIntakeForm } from './client-intake-form'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ token: string }>
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: 'Client Intake',
    robots: 'noindex, nofollow',
  }
}

/**
 * Public client intake form page — no authentication required.
 *
 * Flow:
 * 1. Resolve agency from intake_token (service-role, bypasses RLS)
 * 2. Render ClientIntakeForm with agency name for branding
 *
 * Uses service role client since this is a public (unauthenticated) page.
 */
export default async function IntakePage({ params }: Props) {
  const { token } = await params

  const supabase = createServiceRoleClient()

  // Resolve agency from intake_token
  const { data: business } = await supabase
    .from('businesses')
    .select('id, name')
    .eq('intake_token', token)
    .single()

  if (!business) notFound()

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <ClientIntakeForm
          agencyName={business.name}
          token={token}
        />
      </div>
    </div>
  )
}
