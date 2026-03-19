import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'

/**
 * GET /api/portal/lookup?q=business+name
 *
 * Public endpoint — searches businesses by name (case-insensitive partial match)
 * and returns matching portal URLs. Only returns businesses that have a web_project
 * with a portal_token set.
 *
 * Returns: { results: [{ name, portalPath }] }
 */
export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get('q')?.trim()

  if (!query || query.length < 2) {
    return NextResponse.json({ results: [] })
  }

  const supabase = createServiceRoleClient()

  // Search businesses with a portal token, partial name match
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('web_projects')
    .select('portal_token, business:businesses!inner(name)')
    .ilike('business.name', `%${query}%`)
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
