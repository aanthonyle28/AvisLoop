'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FadeIn } from '@/components/ui/fade-in';
import {
  CheckCircle,
  CalendarCheck,
  ArrowRight,
  Desktop,
} from '@phosphor-icons/react';

const CALENDLY_URL =
  'https://calendly.com/anthony-le-avisloop/avisloop-demo-onboarding-call';

const trustPoints = [
  'No upfront cost',
  'Cancel anytime',
  'Includes ongoing maintenance',
];

const mockStats = [
  { label: 'Live for', value: '127 days' },
  { label: 'Revisions completed', value: '4' },
  { label: 'Next billing', value: 'Apr 15' },
];

function MockWebsiteCard() {
  return (
    <div className="relative rounded-2xl border border-border/50 bg-card p-6 shadow-[0_4px_24px_rgba(0,0,0,0.06)]">
      {/* Browser chrome strip */}
      <div className="flex items-center gap-1.5 mb-5 pb-4 border-b border-border/30">
        <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/20" />
        <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/20" />
        <span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/20" />
        <div className="ml-3 flex-1 rounded-md bg-muted/60 h-5 px-3 flex items-center">
          <span className="text-[10px] text-muted-foreground/60 font-mono">
            austinplumbing.com
          </span>
        </div>
      </div>

      {/* Hero block mockup */}
      <div className="rounded-xl bg-accent/8 border border-accent/20 p-4 mb-4">
        <div className="h-3 w-3/4 rounded bg-foreground/15 mb-2" />
        <div className="h-2.5 w-1/2 rounded bg-foreground/10 mb-3" />
        <div className="h-7 w-28 rounded-lg bg-accent/70" />
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {mockStats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg bg-muted/50 p-3 text-center"
          >
            <p className="text-xs font-semibold text-foreground">{stat.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">
              {stat.label}
            </p>
          </div>
        ))}
      </div>

      {/* Portal prompt */}
      <div className="flex items-center gap-2 rounded-lg border border-border/40 bg-muted/30 px-3 py-2.5">
        <CalendarCheck size={14} weight="fill" className="text-accent shrink-0" />
        <p className="text-xs text-muted-foreground">
          Revision request received —{' '}
          <span className="text-foreground font-medium">
            completing within 48 hrs
          </span>
        </p>
      </div>

      {/* Floating badge */}
      <div className="absolute -top-3 -right-3 rounded-full bg-accent px-3 py-1 shadow-md">
        <span className="text-[11px] font-semibold text-white tracking-wide">
          LIVE
        </span>
      </div>
    </div>
  );
}

export function HeroWebDesign() {
  return (
    <section className="py-24 md:py-32 overflow-hidden">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-[1fr_1fr] lg:gap-20">
          {/* Left column — text */}
          <FadeIn direction="up">
            <div>
              {/* Section label */}
              <div className="inline-flex items-center gap-2 mb-6">
                <Desktop
                  size={14}
                  weight="fill"
                  className="text-accent"
                  aria-hidden="true"
                />
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">
                  Web Design for Home Service Businesses
                </p>
              </div>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-[3.25rem] font-bold tracking-tight leading-[1.15] text-foreground">
                Your Website Should Be{' '}
                <span className="text-accent">Working</span> While You&apos;re
                On The Job
              </h1>

              {/* Subtitle */}
              <p className="mt-6 text-lg text-muted-foreground max-w-md leading-relaxed">
                We build and maintain professional websites for HVAC, plumbing,
                electrical, and roofing companies. Starting at $199/month — no
                upfront cost, no contracts, no technical knowledge needed.
              </p>

              {/* CTA buttons */}
              <div className="mt-10 flex flex-col sm:flex-row gap-3">
                <Button
                  asChild
                  size="lg"
                  className="bg-accent hover:bg-accent/90 text-white group"
                >
                  <Link
                    href={CALENDLY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Book a Free Call
                    <ArrowRight
                      size={16}
                      className="ml-1.5 group-hover:translate-x-0.5 transition-transform"
                      aria-hidden="true"
                    />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link href="#pricing">See Pricing</Link>
                </Button>
              </div>

              {/* Trust line */}
              <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2">
                {trustPoints.map((point) => (
                  <span
                    key={point}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground/80"
                  >
                    <CheckCircle
                      size={13}
                      weight="fill"
                      className="text-accent/70"
                      aria-hidden="true"
                    />
                    {point}
                  </span>
                ))}
              </div>
            </div>
          </FadeIn>

          {/* Right column — mock product card */}
          <FadeIn direction="up" delay={200}>
            <div className="relative">
              {/* Background glow */}
              <div
                className="absolute inset-0 -z-10 rounded-3xl bg-accent/5 blur-3xl scale-110"
                aria-hidden="true"
              />
              <MockWebsiteCard />
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
