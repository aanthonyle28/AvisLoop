import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyApiKey } from '@/lib/crypto/api-key'
import { webhookContactSchema } from '@/lib/validations/webhook'
import { checkWebhookRateLimit } from '@/lib/rate-limit'

/**
 * Webhook endpoint for creating/updating contacts via API.
 * Authenticated via x-api-key header.
 * Rate limited at 60 requests per minute per API key.
 *
 * Example usage:
 * curl -X POST https://your-domain.com/api/webhooks/contacts \
 *   -H "x-api-key: sk_..." \
 *   -H "Content-Type: application/json" \
 *   -d '{"name":"John Doe","email":"john@example.com","phone":"555-1234"}'
 */
export async function POST(request: Request) {
  try {
    // Step 1: Extract API key from header
    const apiKey = request.headers.get('x-api-key')

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Missing x-api-key header' },
        { status: 401 }
      )
    }

    // Step 2: Rate limit check
    const rateLimit = await checkWebhookRateLimit(apiKey)

    if (!rateLimit.success) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        {
          status: 429,
          headers: {
            'X-RateLimit-Limit': rateLimit.limit.toString(),
            'X-RateLimit-Remaining': rateLimit.remaining.toString(),
            'X-RateLimit-Reset': rateLimit.reset.toString(),
          },
        }
      )
    }

    // Step 3: Authenticate API key and find business
    // Use service role client since this is an unauthenticated webhook
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Query all businesses with API keys
    const { data: businesses, error: businessQueryError } = await supabase
      .from('businesses')
      .select('id, api_key_hash')
      .not('api_key_hash', 'is', null)

    if (businessQueryError) {
      console.error('Failed to query businesses:', businessQueryError)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }

    // Find matching business by verifying API key
    let matchedBusinessId: string | null = null

    for (const business of businesses || []) {
      const isValid = await verifyApiKey(apiKey, business.api_key_hash!)
      if (isValid) {
        matchedBusinessId = business.id
        break
      }
    }

    if (!matchedBusinessId) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 401 })
    }

    // Step 4: Parse and validate request body
    const body = await request.json()
    const validation = webhookContactSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          details: validation.error.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      )
    }

    const { name, email, phone } = validation.data

    // Step 5: Upsert contact (deduplicates by business_id + email)
    const { data: contact, error: upsertError } = await supabase
      .from('contacts')
      .upsert(
        {
          business_id: matchedBusinessId,
          name,
          email,
          phone: phone || null,
          status: 'active',
        },
        {
          onConflict: 'business_id,email',
          ignoreDuplicates: false, // Update if exists
        }
      )
      .select('id, name, email')
      .single()

    if (upsertError) {
      console.error('Failed to upsert contact:', upsertError)
      return NextResponse.json(
        { error: 'Failed to create contact' },
        { status: 500 }
      )
    }

    // Step 6: Return success
    return NextResponse.json(
      {
        success: true,
        contact: {
          id: contact.id,
          name: contact.name,
          email: contact.email,
        },
      },
      {
        status: 200,
        headers: {
          'X-RateLimit-Limit': rateLimit.limit.toString(),
          'X-RateLimit-Remaining': rateLimit.remaining.toString(),
          'X-RateLimit-Reset': rateLimit.reset.toString(),
        },
      }
    )
  } catch (err) {
    console.error('Webhook error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Reject other methods
export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}
