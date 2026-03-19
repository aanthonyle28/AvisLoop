import { NextRequest, NextResponse } from 'next/server'
import { createServiceRoleClient } from '@/lib/supabase/service-role'
import { checkPortalRateLimit } from '@/lib/rate-limit'

/**
 * POST /api/portal/tickets/reply — Client replies to a ticket from the portal.
 *
 * Body: { token, ticketId, body }
 * No auth required — validates via portal_token → project ownership of ticket.
 */
export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const rateLimitResult = await checkPortalRateLimit(ip)
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: 'Too many requests.' }, { status: 429 })
  }

  let body: Record<string, string>
  try {
    body = (await request.json()) as Record<string, string>
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { token, ticketId, body: messageBody } = body
  if (!token || !ticketId || !messageBody?.trim()) {
    return NextResponse.json({ error: 'token, ticketId, and body are required' }, { status: 400 })
  }

  if (token.length < 32) {
    return NextResponse.json({ error: 'Invalid token format' }, { status: 400 })
  }

  if (messageBody.length > 5000) {
    return NextResponse.json({ error: 'Reply too long (max 5000 characters)' }, { status: 400 })
  }

  const supabase = createServiceRoleClient()

  // Verify token → project
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: project } = await (supabase as any)
    .from('web_projects')
    .select('id, business_id')
    .eq('portal_token', token)
    .single()

  if (!project) {
    return NextResponse.json({ error: 'Invalid portal token' }, { status: 404 })
  }

  // Verify ticket belongs to this project
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: ticket } = await (supabase as any)
    .from('project_tickets')
    .select('id')
    .eq('id', ticketId)
    .eq('project_id', project.id)
    .single()

  if (!ticket) {
    return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
  }

  // Insert reply message
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('ticket_messages')
    .insert({
      ticket_id: ticketId,
      business_id: project.business_id,
      author_type: 'client',
      author_name: 'Client',
      body: messageBody.trim(),
    })

  if (error) {
    console.error('[POST /api/portal/tickets/reply] error:', error)
    return NextResponse.json({ error: 'Failed to send reply' }, { status: 500 })
  }

  return NextResponse.json({ success: true }, { status: 201 })
}
