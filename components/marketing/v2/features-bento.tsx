'use client';

import { FadeIn } from '@/components/ui/fade-in';
import {
  Headset,
  ShieldCheck,
  MapPin,
  Handshake,
} from '@phosphor-icons/react';

/* ------------------------------------------------------------------ */
/*  Differentiators — outcomes and trust builders                      */
/* ------------------------------------------------------------------ */

const differentiators = [
  {
    icon: Headset,
    stat: '100%',
    title: 'Managed service',
    description:
      'We handle everything — setup, campaigns, responses, reporting. You don\'t learn any tools or manage any dashboards.',
  },
  {
    icon: ShieldCheck,
    stat: '4.8+',
    title: 'Average client rating',
    description:
      'Our smart funnel ensures only your best experiences become public Google reviews. Negative feedback stays private.',
  },
  {
    icon: MapPin,
    stat: 'Austin',
    title: 'Built for local',
    description:
      'We know the home service market. Your competitors are mapped and tracked from day one so you always know where you stand.',
  },
  {
    icon: Handshake,
    stat: '$0',
    title: 'Setup fees or contracts',
    description:
      'Cancel anytime. We earn your business every month with results — not lock-in agreements or hidden costs.',
  },
];

/* ------------------------------------------------------------------ */
/*  Main export                                                       */
/* ------------------------------------------------------------------ */

export function WhyAvisLoop() {
  return (
    <section className="py-24 md:py-32 bg-white dark:bg-card">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <FadeIn direction="up">
            <p className="text-xs font-medium uppercase tracking-widest text-accent mb-4">
              Why AvisLoop
            </p>
          </FadeIn>
          <FadeIn direction="up" delay={80}>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground text-balance">
              Results that speak for themselves.
            </h2>
          </FadeIn>
          <FadeIn direction="up" delay={160}>
            <p className="mt-5 text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              We&apos;re not software you have to learn. We&apos;re a team that
              manages your reputation so you can focus on running your business.
            </p>
          </FadeIn>
        </div>

        {/* 2x2 differentiator grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {differentiators.map((item, i) => {
            const Icon = item.icon;
            return (
              <FadeIn key={item.title} direction="up" delay={i * 100}>
                <div className="rounded-2xl border border-accent/10 bg-accent/[0.04] p-8 h-full">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/10">
                      <Icon
                        weight="light"
                        className="h-5 w-5 text-accent"
                      />
                    </div>
                    <span className="text-3xl font-extrabold tracking-tight text-foreground">
                      {item.stat}
                    </span>
                  </div>
                  <h3 className="text-base font-semibold text-foreground mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
