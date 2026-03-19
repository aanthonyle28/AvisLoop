import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

/**
 * POST /api/portal/lookup
 *
 * Public endpoint — looks up a client's portal by their email address.
 * Searches web_projects.client_email (exact match, case-insensitive).
 * Returns the portal path if found.
 *
 * POST instead of GET to avoid email in URL/logs.
 */
export async function POST(request: NextRequest) {
  let body: Record<string, string>
  try {
    body = (await request.json()) as Record<string, string>
  } catch {
    return NextResponse.json({ results: [] })
  }

  const email = body.email?.trim().toLowerCase()
  if (!email || !email.includes('@')) {
    return NextResponse.json({ results: [] })
  }

  const supabase = createServiceRoleClient()

  // Search web_projects by client_email (exact, case-insensitive)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('web_projects')
    .select('portal_token, business:businesses!inner(name)')
    .ilike('client_email', email)
    .not('portal_token', 'is', null)
    .limit(5)

  if (error || !data) {
    return NextResponse.json({ results: [] })
  }

  const results = (data as Array<{ portal_token: string; business: { name: string } }>).map((row) => ({
    name: row.business.name,
    portalPath: `/portal/${row.portal_token}`,
  }))

  return NextResponse.json({ results })
}
