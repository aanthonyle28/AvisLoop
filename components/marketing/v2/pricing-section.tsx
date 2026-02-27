'use client';

import Link from 'next/link';
import { Check, ShieldCheck } from '@phosphor-icons/react';
import { Button } from '@/components/ui/button';
import { FadeIn } from '@/components/ui/fade-in';

const included = [
  'AI-personalized review campaigns based on job details (SMS + email)',
  'AI-powered review responses posted to your Google profile',
  'Smart review funnel — positive to Google, negative stays private',
  'Competitor tracking and gap analysis',
  'Monthly performance reports',
  'Full setup and onboarding by our team',
  'Cancel anytime — no contracts, no setup fees',
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-24 md:py-32 scroll-mt-20">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <FadeIn direction="up">
          <p className="text-center text-xs font-medium uppercase tracking-widest text-accent mb-4">
            Pricing
          </p>
        </FadeIn>

        <FadeIn direction="up" delay={80}>
          <h2 className="text-center text-4xl md:text-5xl font-extrabold tracking-tight text-foreground text-balance">
            One plan. Everything included.
          </h2>
        </FadeIn>

        <FadeIn direction="up" delay={160}>
          <p className="mt-4 text-center text-lg text-muted-foreground max-w-xl mx-auto">
            No tiers, no upsells, no hidden fees. One flat rate for the full service.
          </p>
        </FadeIn>

        <FadeIn direction="up" delay={240}>
          <div className="mt-16 max-w-lg mx-auto">
            <div className="rounded-2xl border border-border/40 bg-card p-10 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
              <div className="text-center mb-8">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-6xl font-extrabold tracking-tight text-foreground">
                    $149
                  </span>
                  <span className="text-lg text-muted-foreground">/month</span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  Fully managed — we do everything
                </p>
              </div>

              <ul className="space-y-4 mb-10">
                {included.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check
                      weight="bold"
                      className="h-5 w-5 text-accent shrink-0 mt-0.5"
                    />
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Button
                asChild
                size="lg"
                className="w-full bg-accent hover:bg-accent/90 text-white"
              >
                <Link href="/#pricing">
                  Book Your Free Reputation Audit
                </Link>
              </Button>

              <div className="mt-5 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <ShieldCheck weight="fill" className="h-4 w-4 text-accent/60" />
                <span>Free 15-minute audit call &middot; No commitment required</span>
              </div>
            </div>

            {/* Risk reversal */}
            <p className="mt-6 text-center text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
              Not seeing results? Cancel anytime. We earn your business
              every month with reviews, not contracts.
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
