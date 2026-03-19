import { Suspense } from "react";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { UserMenu } from "@/components/marketing/user-menu";
import { V4Nav } from "@/components/marketing/v4/nav";
import { V4Footer } from "@/components/marketing/v4/footer";
import { createClient } from "@/lib/supabase/server";

const MARKETING_LINKS = [
  { label: 'Web Design', href: '/' },
  { label: 'Reviews', href: '/reputation' },
  { label: 'Pricing', href: '/pricing' },
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

  return <ThemeSwitcher />;
}

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <V4Nav
        links={MARKETING_LINKS}
        rightSlot={
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

      <V4Footer />
    </div>
  );
}
