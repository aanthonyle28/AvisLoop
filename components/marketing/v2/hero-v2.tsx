'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FadeIn } from '@/components/ui/fade-in';
import { AnimatedProductDemo } from './animated-demo';

export function HeroV2() {
  return (
    <section className="relative overflow-hidden py-20 md:py-28 lg:py-32">
      {/* Background gradient layer */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-[hsl(var(--accent-lime))/0.05] dark:from-primary/10 dark:via-background dark:to-[hsl(var(--accent-lime))/0.1]" />

      {/* Content container */}
      <div className="container relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-[55%_45%] gap-12 lg:gap-8 items-center">
          {/* Left column */}
          <FadeIn direction="up">
            <div className="text-center lg:text-left">
              {/* Trust badge */}
              <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-card/80 px-4 py-1.5 text-sm font-medium text-muted-foreground backdrop-blur-sm mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
                </span>
                Built for home service businesses
              </div>

              {/* Headline */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-balance text-foreground">
                3× More Reviews
                <br />
                Without Lifting a Finger
              </h1>

              {/* Subheadline */}
              <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-xl mx-auto lg:mx-0">
                Complete jobs in 10 seconds. AvisLoop handles multi-touch follow-ups,
                timing, and review funnels automatically.
              </p>

              {/* CTA buttons */}
              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Button
                  asChild
                  size="lg"
                  className="text-base px-8 bg-foreground text-background hover:bg-foreground/90"
                >
                  <Link href="/auth/sign-up">Start My Free Trial</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="text-base border-border/60 hover:bg-muted/50"
                >
                  <Link href="/pricing">See Pricing</Link>
                </Button>
              </div>

              {/* Trust indicators */}
              <p className="mt-6 text-sm text-muted-foreground">
                10-second job entry • Automated follow-ups • Cancel anytime
              </p>
            </div>
          </FadeIn>

          {/* Right column */}
          <FadeIn direction="up" delay={200}>
            <div className="relative lg:pl-8">
              <AnimatedProductDemo />
            </div>
          </FadeIn>
        </div>
      </div>
    </section>
  );
}
