import { notFound } from 'next/navigation'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { JobCompletionForm } from './job-completion-form'
import type { Metadata } from 'next'

interface Props {
  params: Promise<{ token: string }>
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return {
    title: 'Complete Job',
    robots: 'noindex, nofollow', // Don't index form pages
  }
}

/**
 * Public job completion form page — no authentication required.
 *
 * Flow:
 * 1. Resolve business from form_token (service-role, bypasses RLS)
 * 2. Render mobile-optimized JobCompletionForm with business data
 *
 * Uses service role client since this is a public (unauthenticated) page.
 * Token is a persistent DB token (not HMAC) stored in businesses.form_token.
 */
export default async function CompletePage({ params }: Props) {
  const { token } = await params

  // Use service role for public page (no auth context)
  const supabase = createServiceRoleClient()

  // Resolve business from form_token
  const { data: business } = await supabase
    .from('businesses')
    .select('id, name, service_types_enabled, custom_service_names')
    .eq('form_token', token)
    .single()

  if (!business) notFound()

  // Cast to string arrays (stored as JSONB/text[] in Supabase)
  const enabledServiceTypes = (business.service_types_enabled as string[] | null) ?? []
  const customServiceNames = (business.custom_service_names as string[] | null) ?? []

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <JobCompletionForm
          businessName={business.name}
          enabledServiceTypes={enabledServiceTypes}
          customServiceNames={customServiceNames}
          token={token}
        />
      </div>
    </div>
  )
}
