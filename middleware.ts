import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Domain configuration
const APP_DOMAIN = "app.avisloop.com";
const MARKETING_DOMAIN = "avisloop.com";
const COOKIE_DOMAIN = ".avisloop.com";

// Routes that belong to the app (dashboard) subdomain
const APP_ROUTES = [
  "/dashboard",
  "/protected",
  "/contacts",
  "/customers",
  "/send",
  "/history",
  "/billing",
  "/onboarding",
  "/scheduled",
  "/settings",
  "/jobs",
  "/campaigns",
  "/analytics",
  "/activity",
  "/feedback",
  "/businesses",
  "/clients",
];

// Routes that belong to the marketing (root) domain
const MARKETING_ROUTES = ["/", "/pricing", "/login", "/signup", "/auth"];

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;

  // Determine if we're on the app subdomain or marketing domain
  const isAppDomain = hostname.startsWith("app.");
  const isMarketingDomain = !isAppDomain;

  // For local development, skip domain routing
  const isLocalhost =
    hostname.includes("localhost") || hostname.includes("127.0.0.1");

  if (!isLocalhost) {
    // On marketing domain (avisloop.com): redirect app routes to app.avisloop.com
    if (isMarketingDomain) {
      const isAppRoute = APP_ROUTES.some(
        (route) => pathname === route || pathname.startsWith(route + "/")
      );
      if (isAppRoute) {
        const url = new URL(request.url);
        url.host = APP_DOMAIN;
        return NextResponse.redirect(url);
      }
    }

    // On app domain (app.avisloop.com): redirect marketing routes to avisloop.com
    if (isAppDomain) {
      // Root path on app domain should go to dashboard
      if (pathname === "/") {
        const url = new URL(request.url);
        url.pathname = "/dashboard";
        return NextResponse.redirect(url);
      }

      // Marketing pages should redirect to marketing domain
      const isMarketingRoute = MARKETING_ROUTES.some(
        (route) =>
          route !== "/" &&
          (pathname === route || pathname.startsWith(route + "/"))
      );
      if (isMarketingRoute && pathname !== "/login" && pathname !== "/signup") {
        const url = new URL(request.url);
        url.host = MARKETING_DOMAIN;
        return NextResponse.redirect(url);
      }
    }
  }

  // --- Skip auth for public routes ---
  // These routes don't need authentication. Running getUser() on them risks
  // clearing auth cookies via setAll() if the Supabase library encounters any
  // issue (token refresh race, network blip, etc.). Proven by diagnostic:
  // visiting /portal/[token] in the same browser as a logged-in user wiped
  // the auth cookies.
  const PUBLIC_PREFIXES = ["/portal", "/r/", "/intake", "/api/portal", "/api/feedback", "/api/review", "/api/audit", "/complete", "/sms-consent"];
  const isPublicRoute = PUBLIC_PREFIXES.some((prefix) => pathname.startsWith(prefix));
  if (isPublicRoute) {
    return NextResponse.next({ request });
  }

  // --- Supabase Auth Handling ---
  //
  // IMPORTANT: The supabaseResponse variable must be the response object returned
  // at the end of this function (or have its cookies copied to any redirect).
  // When Supabase refreshes an expired JWT, it calls setAll() to write updated
  // session cookies. Those cookies MUST reach the browser or the session drops
  // on the very next request.
  //
  // Rules (from @supabase/ssr docs):
  // 1. setAll() must NOT replace supabaseResponse — just update cookies on it.
  // 2. Any redirect response must copy cookies from supabaseResponse before returning.
  // 3. Always return supabaseResponse (not a new NextResponse.next()) on the happy path.

  const supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          // Step 1: write updated cookies back to the request (for downstream middleware/handlers)
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          // Step 2: write updated cookies onto the EXISTING supabaseResponse.
          // DO NOT replace supabaseResponse with a new NextResponse.next() here —
          // that would discard any previously set cookies/headers on the response.
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              // Set domain for cross-subdomain auth in production
              domain: isLocalhost ? undefined : COOKIE_DOMAIN,
            })
          );
        },
      },
    }
  );

  // CRITICAL: Always use getUser(), never getSession()
  // getUser() validates the JWT signature with Supabase servers.
  // If the access token is expired, Supabase will refresh it here and call
  // setAll() above to write the new token — which is why setAll() must update
  // supabaseResponse in-place (not replace it).
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes that require authentication
  const protectedPaths = APP_ROUTES.filter(
    (r) => r !== "/login" && r !== "/signup"
  );

  // Helper: create a redirect response that carries the refreshed auth cookies.
  // Without this, a token refresh + redirect would lose the new session cookie,
  // causing the "every navigation breaks" loop.
  function redirectWithCookies(url: URL | string): NextResponse {
    const redirectResponse = NextResponse.redirect(url);
    // Copy all cookies (including any refreshed Supabase session token) to the redirect
    supabaseResponse.cookies.getAll().forEach(({ name, value }) => {
      redirectResponse.cookies.set(
        name,
        value,
        // Preserve the full options (httpOnly, sameSite, etc.) from supabaseResponse
        supabaseResponse.cookies.get(name) as Parameters<typeof redirectResponse.cookies.set>[2]
      );
    });
    return redirectResponse;
  }

  // Redirect unauthenticated users trying to access protected routes.
  //
  // IMPORTANT: Only redirect when there are NO auth cookies at all (user never
  // logged in). When auth cookies ARE present but getUser() returned null, it's
  // likely a race condition: another concurrent request (prefetch, revalidation)
  // consumed the one-time-use refresh token first. Redirecting here would clear
  // the fresh cookies that the other request just set, causing a logout loop.
  //
  // The dashboard layout handles the true "no session" case by checking
  // getAuthUser() and redirecting to /login if null.
  const hasAuthCookies = request.cookies.getAll().some(
    (c) => c.name.startsWith("sb-") && c.name.includes("auth-token")
  );

  if (
    !user &&
    !hasAuthCookies &&
    protectedPaths.some((path) => pathname.startsWith(path))
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    if (!isLocalhost && isAppDomain) {
      url.host = APP_DOMAIN;
    }
    return redirectWithCookies(url);
  }

  // Redirect authenticated users away from auth pages to dashboard
  if (
    user &&
    (pathname === "/login" ||
      pathname === "/signup" ||
      pathname === "/auth/login" ||
      pathname === "/auth/sign-up")
  ) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    if (!isLocalhost) {
      url.host = APP_DOMAIN;
    }
    return redirectWithCookies(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images - .svg, .png, .jpg, .jpeg, .gif, .webp
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
