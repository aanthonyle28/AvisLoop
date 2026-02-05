'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * Generate a Bitly short link from a long URL (the business's Google review link).
 * Stores the result on the business record as `branded_review_link`.
 *
 * If BITLY_ACCESS_TOKEN is not set, returns an error instructing the user to configure it.
 */
export async function generateBrandedLink(longUrl: string): Promise<{ success: boolean; shortUrl?: string; error?: string }> {
  // Validate input
  if (!longUrl || !longUrl.trim()) {
    return { success: false, error: 'Review URL is required' }
  }

  try {
    new URL(longUrl)
  } catch {
    return { success: false, error: 'Invalid URL format' }
  }

  // Check API key
  const apiToken = process.env.BITLY_ACCESS_TOKEN
  if (!apiToken) {
    return { success: false, error: 'Bitly API key not configured. Add BITLY_ACCESS_TOKEN to environment variables.' }
  }

  // Auth check
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  // Get business
  const { data: business } = await supabase
    .from('businesses')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!business) {
    return { success: false, error: 'Business not found' }
  }

  // Call Bitly API v4
  try {
    const response = await fetch('https://api-ssl.bitly.com/v4/shorten', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ long_url: longUrl }),
    })

    if (!response.ok) {
      const errorBody = await response.text()
      console.error('Bitly API error:', response.status, errorBody)
      return { success: false, error: 'Failed to create short link. Please try again.' }
    }

    const data = await response.json()
    const shortUrl = data.link as string

    // Store on business record
    await supabase
      .from('businesses')
      .update({ branded_review_link: shortUrl })
      .eq('id', business.id)

    return { success: true, shortUrl }
  } catch (err) {
    console.error('Bitly API request failed:', err)
    return { success: false, error: 'Network error creating short link. Please try again.' }
  }
}
