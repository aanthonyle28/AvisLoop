import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { UserMenu } from "@/components/marketing/user-menu";
import { MobileNav } from "@/components/marketing/mobile-nav";
import { createClient } from "@/lib/supabase/server";
function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <path
        d="M13.9614 13.9428C13.9614 13.9428 15.6661 8.28761 13.1687 5.6657C9.39938 1.70861 2.46616 5.36825 1.25864 10.7178C1.06397 11.5803 0.964999 12.4675 1.01126 13.3511C1.39358 20.6533 9.24432 25.3666 16.2932 23.6446C17.7686 23.2841 19.1513 22.7512 20.2657 21.9762C27.8097 16.7301 26.9724 8.28761 26.9724 8.28761"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

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
    <Button size="sm" asChild>
      <Link href="/#pricing">Book a Call</Link>
    </Button>
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
              <LogoMark className="w-7 h-7 text-accent" />
              <span>AvisLoop</span>
            </Link>
            <div className="hidden md:flex items-center gap-1">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/#features">Services</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/#how-it-works">How It Works</Link>
              </Button>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/#pricing">Pricing</Link>
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
                <Link href="/#pricing">Book a Call</Link>
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
                <LogoMark className="w-6 h-6 text-accent" />
                <span>AvisLoop</span>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Managed Google review service for HVAC, plumbing, electrical, and home service businesses. More reviews, better ratings, zero effort.
              </p>
            </div>

            {/* Product links */}
            <div>
              <h3 className="font-semibold mb-4">Service</h3>
              <ul className="space-y-3 text-sm">
                <li>
                  <Link
                    href="/#features"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    What We Do
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#how-it-works"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    How It Works
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#pricing"
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
                    href="/#pricing"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Book a Call
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
              <span>Google review management for home service businesses</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
