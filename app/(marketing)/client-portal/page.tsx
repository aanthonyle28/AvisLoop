import type { Metadata } from 'next'
import { ClientPortalLookup } from '@/components/marketing/v3/client-portal-lookup'

export const metadata: Metadata = {
  title: 'Client Portal — AvisLoop',
  description: 'Access your web design project portal to submit revision requests and track progress.',
}

export default function ClientPortalPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-20">
      <div className="w-full max-w-md space-y-8">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-3xl font-bold tracking-tight">Client Portal</h1>
          <p className="text-muted-foreground">
            Enter your business name to access your project portal.
          </p>
        </div>

        {/* Lookup form */}
        <ClientPortalLookup />

        {/* Help text */}
        <p className="text-center text-xs text-muted-foreground">
          Can&apos;t find your business?{' '}
          <a href="mailto:anthony@avisloop.com" className="text-primary underline">
            Contact us
          </a>
        </p>
      </div>
    </div>
  )
}
