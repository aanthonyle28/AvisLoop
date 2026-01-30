import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { UserMenu } from "@/components/marketing/user-menu";
import { MobileNav } from "@/components/marketing/mobile-nav";
import { createClient } from "@/lib/supabase/server";
import { Star } from "lucide-react";

async function AuthButtons() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const userMenuData = user
    ? {
        email: user.email ?? "",
        fullName: user.user_metadata?.full_name as string | undefined,
      }
    : null;

  return userMenuData ? (
    <UserMenu user={userMenuData} />
  ) : (
    <>
      <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
        <Link href="/auth/login">Log in</Link>
      </Button>
      <Button size="sm" asChild>
        <Link href="/auth/sign-up">Start Free</Link>
      </Button>
    </>
  );
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 w-full border-b border-border/30 bg-background/80 backdrop-blur-lg supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto max-w-6xl flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo and nav links */}
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Star className="w-4 h-4 text-primary-foreground fill-current" />
              </div>
              <span>AvisLoop</span>
            </Link>
            <div className="hidden md:flex items-center gap-1">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/#features">Features</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/pricing">Pricing</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/#faq">FAQ</Link>
              </Button>
            </div>
          </div>

          {/* Right side: theme switcher, mobile nav, and auth/user menu */}
          <div className="flex items-center gap-3">
            <ThemeSwitcher />
            <Suspense fallback={
              <Button size="sm" asChild>
                <Link href="/auth/sign-up">Start Free</Link>
              </Button>
            }>
              <AuthButtons />
            </Suspense>
            <MobileNav />
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-muted/50">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
            {/* Company info */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 font-bold text-lg mb-4">
                <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                  <Star className="w-3.5 h-3.5 text-primary-foreground fill-current" />
                </div>
                <span>AvisLoop</span>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Simple review requests for busy businesses. Get more reviews without the hassle.
              </p>
            </div>

            {/* Product links */}
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link
                    href="/#features"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Features
                  </Link>
                </li>
                <li>
                  <Link
                    href="/pricing"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#faq"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    FAQ
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company links */}
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link
                    href="/auth/sign-up"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Get Started
                  </Link>
                </li>
                <li>
                  <Link
                    href="/auth/login"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Log In
                  </Link>
                </li>
              </ul>
            </div>

            {/* Legal links */}
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li>
                  <span className="cursor-not-allowed">Privacy Policy</span>
                </li>
                <li>
                  <span className="cursor-not-allowed">Terms of Service</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-12 pt-8 border-t border-border/40 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              &copy; 2026 AvisLoop. All rights reserved.
            </p>
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Made for local businesses</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
