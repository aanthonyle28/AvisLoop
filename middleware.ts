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

  // --- Supabase Auth Handling ---
  let supabaseResponse = NextResponse.next({
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
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
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
  // getUser() validates the JWT signature, getSession() doesn't
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes that require authentication
  const protectedPaths = APP_ROUTES.filter(
    (r) => r !== "/login" && r !== "/signup"
  );

  // Redirect unauthenticated users trying to access protected routes
  if (
    !user &&
    protectedPaths.some((path) => pathname.startsWith(path))
  ) {
    // Redirect to login on the app domain
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    if (!isLocalhost && isAppDomain) {
      url.host = APP_DOMAIN;
    }
    return NextResponse.redirect(url);
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
    return NextResponse.redirect(url);
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
