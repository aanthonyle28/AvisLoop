import { createBrowserClient } from "@supabase/ssr";

// Match the cookie domain used by the server client and middleware
// so browser token refreshes don't create duplicate cookies.
const COOKIE_DOMAIN = process.env.NODE_ENV === 'production' ? '.avisloop.com' : undefined;

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    COOKIE_DOMAIN ? { cookieOptions: { domain: COOKIE_DOMAIN } } : undefined
  );
}
