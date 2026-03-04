import 'server-only'

/**
 * Google Places API (New) client for business lookup.
 * Server-only — never imported on the client side.
 *
 * Uses the Places API (New) searchText endpoint with field masking
 * to fetch only the fields we need, minimizing API costs.
 */

import type { PlacesResult } from './types'

const PLACES_API_URL = 'https://places.googleapis.com/v1/places:searchText'
const FIELD_MASK =
  'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount'

/** Raw shape of a place from the Places API (New) response */
interface PlacesApiPlace {
  id: string
  displayName?: { text: string; languageCode?: string }
  formattedAddress?: string
  rating?: number
  userRatingCount?: number
}

interface PlacesApiResponse {
  places?: PlacesApiPlace[]
}

/**
 * Search for a business by name and city using Google Places API (New).
 *
 * Returns the top result or null if no match found.
 * Uses pageSize: 1 to minimize API costs — we only need the best match.
 *
 * @param businessName - Business name as entered by the prospect
 * @param city - City name (appended to query for better geolocation)
 * @returns PlacesResult or null if not found
 * @throws Error if API key not configured or fetch fails
 */
export async function searchBusiness(
  businessName: string,
  city: string,
): Promise<PlacesResult | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY
  if (!apiKey) {
    throw new Error(
      'GOOGLE_PLACES_API_KEY is not configured. Set this environment variable to enable the audit tool.',
    )
  }

  const query = `${businessName} ${city}`

  let response: Response
  try {
    response = await fetch(PLACES_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': FIELD_MASK,
      },
      body: JSON.stringify({
        textQuery: query,
        pageSize: 1,
      }),
    })
  } catch (err) {
    console.error('[places-client] Fetch failed for query:', query, err)
    throw new Error(
      `Google Places API request failed: ${err instanceof Error ? err.message : String(err)}`,
    )
  }

  if (!response.ok) {
    const errorText = await response.text().catch(() => 'unknown error')
    console.error(
      '[places-client] API error:',
      response.status,
      response.statusText,
      errorText,
    )
    throw new Error(
      `Google Places API returned ${response.status}: ${response.statusText}`,
    )
  }

  const data: PlacesApiResponse = await response.json()

  if (!data.places || data.places.length === 0) {
    return null
  }

  const place = data.places[0]

  return {
    placeId: place.id,
    displayName: place.displayName?.text ?? businessName,
    formattedAddress: place.formattedAddress ?? city,
    rating: place.rating ?? null,
    userRatingCount: place.userRatingCount ?? null,
  }
}
