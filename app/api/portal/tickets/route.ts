import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { checkPortalRateLimit } from '@/lib/rate-limit'
import { portalTicketSchema } from '@/lib/validations/portal-ticket'
import { REVISION_LIMITS, DEFAULT_REVISION_LIMIT } from '@/lib/constants/tickets'

/**
 * POST /api/portal/tickets — Public portal ticket submission.
 *
 * No authentication required — project is resolved from the portal_token.
 * Uses service-role client to bypass RLS (same pattern as /api/complete, /api/intake).
 *
 * Flow:
 * 1. Rate limit by IP (10 submissions per minute)
 * 2. Validate request body against portalTicketSchema (Zod)
 * 3. Resolve project + business from portal_token using service-role
 * 4. Enforce monthly revision quota via submit_ticket_with_limit_check RPC
 * 5. Return 201 on success
 */
export async function POST(request: NextRequest) {
  // Step 1: Rate limit by IP
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rateLimitResult = await checkPortalRateLimit(ip)
  if (!rateLimitResult.success) {
    return NextResponse.json(
      { error: 'Too many requests. Please wait before submitting again.' },
      { status: 429 }
    )
  }

  // Step 2: Parse + validate body with Zod
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = portalTicketSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Invalid input' },
      { status: 400 }
    )
  }

  const { token, title, description } = parsed.data
  // C-5: Validate attachment URLs — must be string[], max 5, and prefixed with correct business/project path
  const rawAttachments = (body as Record<string, unknown>).attachmentUrls
  let attachmentUrls: string[] | undefined
  if (Array.isArray(rawAttachments) && rawAttachments.length > 0) {
    const validPaths = rawAttachments
      .filter((u): u is string => typeof u === 'string' && u.length <= 500)
      .slice(0, 5)
    // Will validate prefix after project is resolved (below)
    attachmentUrls = validPaths.length > 0 ? validPaths : undefined
  }

  const supabase = createServiceRoleClient()

  // Step 3: Resolve project by portal_token (service-role — no RLS)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: project, error: projectError } = await (supabase as any)
    .from('web_projects')
    .select('id, business_id, subscription_tier')
    .eq('portal_token', token)
    .single()

  if (projectError || !project) {
    return NextResponse.json({ error: 'Invalid or expired portal link' }, { status: 404 })
  }

  const tier = project.subscription_tier as string | null
  const monthlyLimit =
    tier && REVISION_LIMITS[tier] ? REVISION_LIMITS[tier] : DEFAULT_REVISION_LIMIT

  // Step 4: Enforce monthly quota — atomic check + insert via RPC
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: rpcData, error: rpcError } = await (supabase as any).rpc(
    'submit_ticket_with_limit_check',
    {
      p_project_id: project.id,
      p_business_id: project.business_id,
      p_title: title,
      p_description: description ?? null,
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
        error: `Monthly revision limit reached (${monthlyLimit} per month). Contact your agency for additional requests.`,
        overLimit: true,
      },
      { status: 429 }
    )
  }

  // C-5: Validate attachment path prefixes match this project
  if (attachmentUrls?.length) {
    const expectedPrefix = `${project.business_id}/${project.id}/`
    attachmentUrls = attachmentUrls.filter((url: string) => url.startsWith(expectedPrefix))
  }

  // Step 5: If attachments were uploaded, insert a message with them
  if (attachmentUrls?.length && result.ticket_id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from('ticket_messages')
      .insert({
        ticket_id: result.ticket_id,
        business_id: project.business_id,
        author_type: 'client',
        author_name: 'Client',
        body: description || 'Attached files',
        attachment_urls: attachmentUrls,
      })
  }

  // Step 6: Return success
  return NextResponse.json({ success: true, ticketId: result.ticket_id }, { status: 201 })
}
