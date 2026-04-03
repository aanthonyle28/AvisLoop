'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

/**
 * Client-side auth listener that keeps the Supabase session alive.
 *
 * The browser Supabase client automatically refreshes the access token
 * before it expires and writes the updated token to cookies. Without this
 * component, tokens expire after ~1 hour and the next server request
 * triggers a refresh. If multiple concurrent server requests hit at the
 * same time (page + prefetches), they race on the one-time-use refresh
 * token — causing intermittent session drops.
 *
 * By keeping the token fresh client-side, server requests always see a
 * valid access token and never need to refresh.
 */
export function AuthListener() {
  useEffect(() => {
    const supabase = createClient()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        // Session was invalidated — redirect to login
        window.location.href = '/login'
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return null
}
