import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { AuditResults } from '@/components/audit/audit-results'
import type { AuditReport, GapAnalysis } from '@/lib/audit/types'

type Props = {
  params: Promise<{ reportId: string }>
}

/**
 * Fetch an audit report by ID using the service-role client (bypasses RLS).
 * Returns null if the report does not exist.
 */
async function fetchReport(reportId: string): Promise<AuditReport | null> {
  const supabase = createServiceRoleClient()
  const { data, error } = await supabase
    .from('audit_reports')
    .select('*')
    .eq('id', reportId)
    .limit(1)
    .maybeSingle()

  if (error || !data) return null

  // Normalize gaps_json — Supabase may return JSONB as object or string
  let gapsJson: GapAnalysis[] = []
  if (typeof data.gaps_json === 'string') {
    try {
      gapsJson = JSON.parse(data.gaps_json)
    } catch {
      gapsJson = []
    }
  } else if (Array.isArray(data.gaps_json)) {
    gapsJson = data.gaps_json as GapAnalysis[]
  }

  return { ...data, gaps_json: gapsJson } as AuditReport
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { reportId } = await params
  const report = await fetchReport(reportId)

  if (!report) {
    return {}
  }

  const title = `${report.business_name} Reputation Score: ${report.grade} | AvisLoop`
  const description = `${report.business_name} in ${report.city} scored ${report.score}/100 on the AvisLoop Reputation Audit. See the full breakdown.`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
  }
}

/**
 * Shareable audit report page — /audit/[reportId]
 *
 * Server Component. Accessible without authentication.
 * Increments view_count on each load (fire-and-forget).
 * Returns 404 for invalid or nonexistent reportIds.
 *
 * Flow: AuditForm (on /audit) → email capture → redirect here
 * Viral loop: Users share this URL → more traffic to /audit
 */
export default async function ReportPage({ params }: Props) {
  const { reportId } = await params
  const report = await fetchReport(reportId)

  if (!report) {
    notFound()
  }

  // Increment view_count — fire-and-forget, does not block render
  const supabase = createServiceRoleClient()
  supabase
    .from('audit_reports')
    .update({ view_count: report.view_count + 1 })
    .eq('id', reportId)
    .then(() => {
      // intentionally no-op — fire-and-forget
    })

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <AuditResults report={report} />
    </div>
  )
}
