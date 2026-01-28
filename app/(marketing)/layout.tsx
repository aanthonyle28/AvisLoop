import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeSwitcher } from "@/components/theme-switcher";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto max-w-6xl flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo and nav links */}
          <div className="flex items-center gap-6">
            <Link href="/" className="text-xl font-bold">
              AvisLoop
            </Link>
            <div className="hidden md:flex items-center gap-4">
              <Button variant="ghost" asChild>
                <Link href="/pricing">Pricing</Link>
              </Button>
            </div>
          </div>

          {/* Right side: theme switcher and auth buttons */}
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <Button variant="ghost" asChild className="hidden sm:inline-flex">
              <Link href="/auth/login">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/sign-up">Sign Up</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-muted/30">
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Company info */}
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="text-lg font-bold">
                AvisLoop
              </Link>
              <p className="mt-2 text-sm text-muted-foreground">
                Simple review requests for busy businesses.
              </p>
            </div>

            {/* Product links */}
            <div>
              <h3 className="font-semibold mb-3">Product</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link href="/pricing" className="hover:text-foreground transition-colors">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/auth/sign-up" className="hover:text-foreground transition-colors">
                    Get Started
                  </Link>
                </li>
              </ul>
            </div>

            {/* Company links - placeholder for future pages */}
            <div>
              <h3 className="font-semibold mb-3">Company</h3>
              <p className="text-sm text-muted-foreground">
                Coming soon
              </p>
            </div>

            {/* Legal links - placeholder for future pages */}
            <div>
              <h3 className="font-semibold mb-3">Legal</h3>
              <p className="text-sm text-muted-foreground">
                Coming soon
              </p>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-border/40 text-center text-sm text-muted-foreground">
            <p>&copy; {new Date().getFullYear()} AvisLoop. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
