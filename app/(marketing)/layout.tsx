import Link from "next/link";
import { Suspense } from "react";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { UserMenu } from "@/components/marketing/user-menu";
import { MarketingNav } from "@/components/marketing/marketing-nav";
import { createClient } from "@/lib/supabase/server";

const ACCENT = 'hsl(21 58% 53%)';

const FOOTER_LINKS = [
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Reputation', href: '/reputation' },
  { label: 'Client Portal', href: '/client-portal' },
];

async function AuthSlot() {
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

  if (userMenuData) {
    return (
      <div className="flex items-center gap-2">
        <ThemeSwitcher />
        <UserMenu user={userMenuData} />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <ThemeSwitcher />
      <a
        href="https://calendly.com/anthony-le-avisloop/avisloop-demo-onboarding-call"
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 py-2 text-sm font-medium hover:bg-foreground/90 transition-colors"
      >
        Book a Call
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          fill="currentColor"
          viewBox="0 0 256 256"
          aria-hidden="true"
        >
          <path d="M221.66,133.66l-72,72a8,8,0,0,1-11.32-11.32L196.69,136H40a8,8,0,0,1,0-16H196.69L138.34,61.66a8,8,0,0,1,11.32-11.32l72,72A8,8,0,0,1,221.66,133.66Z" />
        </svg>
      </a>
    </div>
  );
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Navbar — V4 style: transparent → frosted glass on scroll */}
      <MarketingNav
        authSlot={
          <Suspense
            fallback={
              <div className="flex items-center gap-2">
                <div className="w-8 h-8" />
              </div>
            }
          >
            <AuthSlot />
          </Suspense>
        }
      />

      {/* Spacer for fixed nav */}
      <div className="h-16" />

      {/* Main content */}
      <main className="flex-1">{children}</main>

      {/* Footer — V4 minimal single-row */}
      <footer className="border-t border-border/20 py-12">
        <div className="max-w-7xl mx-auto px-6 lg:px-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <svg viewBox="0 0 28 28" fill="none" className="w-5 h-5" aria-hidden="true">
              <path
                d="M13.9614 13.9428C13.9614 13.9428 15.6661 8.28761 13.1687 5.6657C9.39938 1.70861 2.46616 5.36825 1.25864 10.7178C1.06397 11.5803 0.964999 12.4675 1.01126 13.3511C1.39358 20.6533 9.24432 25.3666 16.2932 23.6446C17.7686 23.2841 19.1513 22.7512 20.2657 21.9762C27.8097 16.7301 26.9724 8.28761 26.9724 8.28761"
                stroke={ACCENT}
                strokeWidth="2"
              />
            </svg>
            <span className="text-sm text-muted-foreground/60">&copy; 2026 AvisLoop</span>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground/40">
            {FOOTER_LINKS.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className="hover:text-foreground transition-colors"
              >
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
