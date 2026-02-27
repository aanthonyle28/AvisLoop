'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FadeIn } from '@/components/ui/fade-in';
import { AnimatedProductDemo } from './animated-demo';

export function HeroV2() {
  return (
    <section className="py-24 md:py-32">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-16 lg:grid-cols-[1fr_1fr] lg:gap-20">
          {/* Left column */}
          <FadeIn direction="up">
            <div>
              {/* Section label */}
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent mb-6">
                Managed Reputation Service for Home Services
              </p>

              {/* Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight !leading-[1.3] text-foreground">
                They&apos;re getting
                <br />
                reviews. <span className="text-accent">Are you?</span>
              </h1>

              {/* Subtitle */}
              <p className="mt-6 text-lg text-muted-foreground max-w-md leading-relaxed">
                We manage your entire Google review strategy for $149/mo.
                You fill out a 10-second form after each job. We handle
                the rest.
              </p>

              {/* CTA buttons */}
              <div className="mt-10 flex flex-col sm:flex-row gap-3">
                <Button
                  asChild
                  size="lg"
                  className="bg-accent hover:bg-accent/90 text-white"
                >
                  <Link href="/#pricing">Book Your Free Reputation Audit</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                >
                  <Link href="#how-it-works">See How It Works</Link>
                </Button>
              </div>

              {/* Trust line */}
              <p className="mt-5 text-xs text-muted-foreground/70 tracking-wide">
                No software to learn &middot; Setup in 24 hours &middot; Cancel
                anytime
              </p>
            </div>
          </FadeIn>

          {/* Right column */}
          <FadeIn direction="up" delay={200}>
            <AnimatedProductDemo />
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
