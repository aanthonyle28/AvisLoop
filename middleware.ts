import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Domain configuration
const APP_DOMAIN = "app.avisloop.com";
const MARKETING_DOMAIN = "avisloop.com";
const COOKIE_DOMAIN = ".avisloop.com";

// Supabase auth cookie base name — derived from project ref in SUPABASE_URL
const SUPABASE_PROJECT_REF = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split(".")[0];
const AUTH_COOKIE_BASE = `sb-${SUPABASE_PROJECT_REF}-auth-token`;

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

  // --- Clean up stale unchunked auth cookies ---
  // Supabase SSR v0.8+ uses chunked cookies (.0, .1, etc.). Older sessions may
  // have left an unchunked cookie with the same base name. When both exist, the
  // library reads the stale unchunked one first, finds it expired, and clears
  // ALL auth cookies — killing the valid chunked session.
  const hasUnchunked = request.cookies.has(AUTH_COOKIE_BASE);
  const hasChunked = request.cookies.has(`${AUTH_COOKIE_BASE}.0`);
  const staleCleanupNeeded = hasUnchunked && hasChunked;

  if (staleCleanupNeeded) {
    request.cookies.delete(AUTH_COOKIE_BASE);
  }

  // --- Supabase Auth Handling ---
  const supabaseResponse = NextResponse.next({
    request,
  });

  // Clear the stale unchunked cookie from the browser
  if (staleCleanupNeeded) {
    supabaseResponse.cookies.set(AUTH_COOKIE_BASE, "", {
      maxAge: 0,
      path: "/",
      domain: isLocalhost ? undefined : COOKIE_DOMAIN,
    });
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              domain: isLocalhost ? undefined : COOKIE_DOMAIN,
            })
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes that require authentication
  const protectedPaths = APP_ROUTES.filter(
    (r) => r !== "/login" && r !== "/signup"
  );

  // Helper: create a redirect that carries refreshed auth cookies.
  function redirectWithCookies(url: URL | string): NextResponse {
    const redirectResponse = NextResponse.redirect(url);
    supabaseResponse.cookies.getAll().forEach(({ name, value }) => {
      // Re-read the cookie options that setAll() wrote to supabaseResponse
      const existing = supabaseResponse.cookies.get(name);
      redirectResponse.cookies.set(name, existing?.value ?? value, {
        path: "/",
        sameSite: "lax" as const,
        secure: !isLocalhost,
        domain: isLocalhost ? undefined : COOKIE_DOMAIN,
      });
    });
    return redirectResponse;
  }

  // Only redirect to /login when there are NO auth cookies (user never logged in).
  // When cookies exist but getUser() returned null (race condition with concurrent
  // token refresh), pass through — the dashboard layout has a fallback auth check.
  const hasAuthCookies = hasChunked || hasUnchunked;

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
     * - _next/static, _next/image (Next.js internals)
     * - favicon.ico and image files
     * - Public routes that must never touch auth cookies:
     *   portal, r/, intake, complete, sms-consent,
     *   api/portal, api/feedback, api/review, api/audit
     */
    "/((?!_next/static|_next/image|favicon.ico|portal|r/|intake|complete|sms-consent|api/portal|api/feedback|api/review|api/audit|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
