import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { REVISION_LIMITS, DEFAULT_REVISION_LIMIT } from '@/lib/constants/tickets'

/**
 * POST /api/portal/tickets
 *
 * Public endpoint — no authentication required. Validates portal_token,
 * then calls submit_ticket_with_limit_check RPC with source='client_portal'.
 *
 * Body: { token: string, title: string, description?: string }
 */
export async function POST(request: NextRequest) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { token, title, description } = body as {
    token?: string
    title?: string
    description?: string
  }

  if (!token || typeof token !== 'string' || token.trim() === '') {
    return NextResponse.json({ error: 'Token is required' }, { status: 400 })
  }
  if (!title || typeof title !== 'string' || title.trim().length < 3) {
    return NextResponse.json(
      { error: 'Title must be at least 3 characters' },
      { status: 400 }
    )
  }

  const supabase = createServiceRoleClient()

  // Resolve project by portal_token
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: project, error: projectError } = await (supabase as any)
    .from('web_projects')
    .select('id, business_id, subscription_tier')
    .eq('portal_token', token.trim())
    .single()

  if (projectError || !project) {
    return NextResponse.json({ error: 'Invalid or expired portal link' }, { status: 404 })
  }

  const tier = project.subscription_tier as string | null
  const monthlyLimit =
    tier && REVISION_LIMITS[tier] ? REVISION_LIMITS[tier] : DEFAULT_REVISION_LIMIT

  // Call RPC — atomic check + insert
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rpcData, error: rpcError } = await (supabase as any).rpc(
    'submit_ticket_with_limit_check',
    {
      p_project_id: project.id,
      p_business_id: project.business_id,
      p_title: title.trim(),
      p_description: description?.trim() ?? null,
      p_source: 'client_portal',
      p_author_name: 'Client',
      p_body: null,
      p_monthly_limit: monthlyLimit,
      p_is_overage: false,
    }
  )

  if (rpcError) {
    console.error('[POST /api/portal/tickets] RPC error:', rpcError)
    return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 })
  }

  const result = Array.isArray(rpcData) ? rpcData[0] : rpcData
  if (!result) {
    return NextResponse.json({ error: 'No result from server' }, { status: 500 })
  }

  if (result.status === 'over_limit') {
    return NextResponse.json(
      {
        error: 'Monthly revision limit reached. Contact your agency for additional requests.',
        overLimit: true,
      },
      { status: 422 }
    )
  }

  return NextResponse.json({ success: true, ticketId: result.ticket_id }, { status: 201 })
}
