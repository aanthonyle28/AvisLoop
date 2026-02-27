'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { FadeIn } from '@/components/ui/fade-in';
import { cn } from '@/lib/utils';
import {
  ChatCircle,
  ChatText,
  ShieldCheck,
  ChartLineUp,
  Star,
  ArrowDown,
  CheckCircle,
  EnvelopeSimple,
  ArrowRight,
} from '@phosphor-icons/react';

/* ------------------------------------------------------------------ */
/*  Service definitions                                                */
/* ------------------------------------------------------------------ */

const services = [
  {
    icon: ChatCircle,
    title: 'Automated Campaigns',
    description:
      'Multi-touch SMS and email sequences timed for each service type. Every message is AI-personalized based on the job details and your notes.',
  },
  {
    icon: ChatText,
    title: 'AI Review Responses',
    description:
      'Every Google review gets a personalized, on-brand reply within hours. Your profile stays active and engaged.',
  },
  {
    icon: ShieldCheck,
    title: 'Review Protection',
    description:
      'Smart funnel routes happy customers to Google and keeps negative feedback private — before it goes public.',
  },
  {
    icon: ChartLineUp,
    title: 'Competitive Intelligence',
    description:
      'Track your review count and rating against local competitors. See where you stand and what it takes to close the gap.',
  },
];

/* ------------------------------------------------------------------ */
/*  Mockup mini-components                                             */
/* ------------------------------------------------------------------ */

function CampaignMockup() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3">
        <CheckCircle weight="light" className="h-5 w-5 shrink-0 text-accent" />
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">
            AC Repair — James Cooper
          </p>
          <p className="text-xs text-muted-foreground">Submitted just now</p>
        </div>
      </div>

      <div className="rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-3.5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-green-600 dark:text-green-400">
          Auto-Enrolled
        </p>
        <p className="mt-1 text-sm font-medium text-foreground">
          HVAC Follow-Up Campaign
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          3 AI-personalized touches over 5 days
        </p>
      </div>

      <div className="space-y-2.5 pl-1">
        <div className="flex items-center gap-3 text-sm">
          <EnvelopeSimple
            weight="light"
            className="h-4 w-4 shrink-0 text-accent"
          />
          <span className="text-muted-foreground">
            Touch 1: Email in 24 hours
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <ChatCircle
            weight="light"
            className="h-4 w-4 shrink-0 text-muted-foreground/40"
          />
          <span className="text-muted-foreground/60">
            Touch 2: SMS in 3 days
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <EnvelopeSimple
            weight="light"
            className="h-4 w-4 shrink-0 text-muted-foreground/40"
          />
          <span className="text-muted-foreground/60">
            Touch 3: Email in 5 days
          </span>
        </div>
      </div>
    </div>
  );
}

function ReviewResponseMockup() {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border/40 bg-card p-4 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-7 w-7 rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground">
            JD
          </div>
          <span className="text-sm font-medium text-foreground">John D.</span>
          <div className="flex gap-0.5 ml-auto">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                weight="fill"
                className="h-3.5 w-3.5 text-accent"
              />
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          &ldquo;Incredible service. They fixed my AC in under an hour and were
          so professional.&rdquo;
        </p>
      </div>

      <div className="rounded-xl border border-accent/20 bg-accent/5 p-4">
        <div className="flex items-center gap-2 mb-2">
          <ChatText weight="light" className="h-4 w-4 text-accent" />
          <span className="text-xs font-medium text-accent">
            AI-drafted response
          </span>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          &ldquo;Thank you John! We&apos;re glad we could get your AC running
          quickly. We appreciate you trusting us with your home
          comfort.&rdquo;
        </p>
      </div>
    </div>
  );
}

function FunnelMockup() {
  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border/40 bg-card p-4 text-center">
        <p className="text-sm font-medium text-foreground">
          Customer clicks review link
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Private rating screen appears
        </p>
      </div>

      <div className="flex justify-center">
        <ArrowDown
          weight="light"
          className="h-5 w-5 text-muted-foreground/40"
        />
      </div>

      <div className="rounded-xl border border-border/40 bg-card p-4 text-center">
        <p className="text-xs text-muted-foreground mb-2">
          How was your experience?
        </p>
        <div className="flex justify-center gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              weight="fill"
              className={cn(
                'h-5 w-5',
                s <= 3 ? 'text-muted-foreground/30' : 'text-accent'
              )}
            />
          ))}
        </div>
      </div>

      <div className="flex justify-center">
        <ArrowDown
          weight="light"
          className="h-5 w-5 text-muted-foreground/40"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-4 text-center">
          <p className="text-xs font-semibold text-green-600 dark:text-green-400">
            4-5 Stars
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">
            Google Review
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Goes public
          </p>
        </div>
        <div className="rounded-xl border border-amber-500/30 bg-amber-500/5 p-4 text-center">
          <p className="text-xs font-semibold text-amber-600 dark:text-amber-400">
            1-3 Stars
          </p>
          <p className="mt-1 text-sm font-medium text-foreground">
            Private Feedback
          </p>
          <p className="mt-0.5 text-[11px] text-muted-foreground">
            Stays between you
          </p>
        </div>
      </div>
    </div>
  );
}

function CompetitorMockup() {
  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-medium text-foreground">
            Your Business
          </span>
          <span className="text-sm font-semibold text-foreground">
            47 reviews
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-accent"
            style={{ width: '32%' }}
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm text-muted-foreground">Top Competitor</span>
          <span className="text-sm font-semibold text-muted-foreground">
            147 reviews
          </span>
        </div>
        <div className="h-2.5 rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-muted-foreground/30"
            style={{ width: '100%' }}
          />
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-lg bg-accent/5 px-3 py-2">
        <ArrowRight
          weight="light"
          className="h-4 w-4 text-accent shrink-0"
        />
        <span className="text-xs text-muted-foreground">
          Close the gap in{' '}
          <span className="font-semibold text-foreground">90 days</span> with
          AvisLoop
        </span>
      </div>
    </div>
  );
}

const mockups = [
  CampaignMockup,
  ReviewResponseMockup,
  FunnelMockup,
  CompetitorMockup,
];

/* ------------------------------------------------------------------ */
/*  Main export                                                       */
/* ------------------------------------------------------------------ */

export function ServicesSection() {
  const [active, setActive] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAutoPlay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setActive((prev) => (prev + 1) % services.length);
    }, 5000);
  }, []);

  const handleSelect = useCallback(
    (index: number) => {
      setActive(index);
      startAutoPlay();
    },
    [startAutoPlay]
  );

  useEffect(() => {
    startAutoPlay();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startAutoPlay]);

  const ActiveMockup = mockups[active];

  return (
    <section id="features" className="py-24 md:py-32 bg-accent/[0.06] scroll-mt-20">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <FadeIn direction="up">
          <p className="text-center text-xs font-medium uppercase tracking-widest text-accent mb-4">
            Our Services
          </p>
        </FadeIn>
        <FadeIn direction="up" delay={80}>
          <h2 className="text-center text-4xl md:text-5xl font-extrabold tracking-tight text-foreground text-balance max-w-2xl mx-auto">
            What we do for you.
          </h2>
        </FadeIn>
        <FadeIn direction="up" delay={160}>
          <p className="text-center mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Four services, fully managed. You submit jobs — we handle
            everything else.
          </p>
        </FadeIn>

        {/* Interactive layout */}
        <FadeIn direction="up" delay={240}>
          <div className="mt-14 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-start">
            {/* Service tabs */}
            <div className="space-y-2" role="tablist" aria-label="Services">
              {services.map((service, i) => {
                const Icon = service.icon;
                const isActive = active === i;
                return (
                  <button
                    key={service.title}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => handleSelect(i)}
                    className={cn(
                      'w-full text-left rounded-xl px-5 py-4 transition-all duration-200',
                      isActive
                        ? 'bg-card border border-border/40 shadow-[0_1px_3px_rgba(0,0,0,0.03)]'
                        : 'hover:bg-card/50 border border-transparent'
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          'flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors',
                          isActive ? 'bg-accent/10' : 'bg-transparent'
                        )}
                      >
                        <Icon
                          weight={isActive ? 'regular' : 'light'}
                          className={cn(
                            'h-5 w-5 transition-colors',
                            isActive
                              ? 'text-accent'
                              : 'text-muted-foreground'
                          )}
                        />
                      </div>
                      <div className="min-w-0">
                        <p
                          className={cn(
                            'text-sm font-semibold transition-colors',
                            isActive
                              ? 'text-foreground'
                              : 'text-muted-foreground'
                          )}
                        >
                          {service.title}
                        </p>

                        {/* Animated description */}
                        <div
                          className={cn(
                            'grid transition-[grid-template-rows] duration-300 ease-out',
                            isActive
                              ? 'grid-rows-[1fr]'
                              : 'grid-rows-[0fr]'
                          )}
                        >
                          <div className="overflow-hidden">
                            <p className="pt-1.5 text-sm leading-relaxed text-muted-foreground">
                              {service.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Mockup panel */}
            <div
              role="tabpanel"
              className="rounded-2xl border border-border/40 bg-card p-6 md:p-8 shadow-[0_1px_3px_rgba(0,0,0,0.03)] h-[400px] flex flex-col justify-center overflow-hidden"
            >
              <div
                key={active}
                className="animate-in fade-in duration-300"
              >
                <ActiveMockup />
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
