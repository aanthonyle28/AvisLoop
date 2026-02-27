'use client';

import {
  Wrench,
  ClipboardText,
  RocketLaunch,
} from '@phosphor-icons/react';
import { FadeIn } from '@/components/ui/fade-in';

const steps = [
  {
    icon: Wrench,
    step: '01',
    title: 'We Set Everything Up',
    description:
      'Book your free audit. We connect your Google profile, configure your campaigns, and map your competitors.',
  },
  {
    icon: ClipboardText,
    step: '02',
    title: 'You Submit a Quick Form',
    description:
      'Finish a job? Fill out a short form with the customer\'s name and contact info. Takes ten seconds. That\'s it.',
  },
  {
    icon: RocketLaunch,
    step: '03',
    title: 'We Handle the Rest',
    description:
      'Review requests go out automatically. AI responds to every review. Monthly report lands in your inbox.',
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="py-24 md:py-32 scroll-mt-20">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section label */}
        <FadeIn direction="up">
          <p className="text-center text-xs font-medium uppercase tracking-widest text-accent mb-4">
            How It Works
          </p>
        </FadeIn>

        {/* Headline */}
        <FadeIn direction="up" delay={80}>
          <h2 className="text-center text-4xl md:text-5xl font-extrabold tracking-tight text-foreground text-balance">
            Three steps. Five minutes a week.
          </h2>
        </FadeIn>

        {/* Subtitle */}
        <FadeIn direction="up" delay={160}>
          <p className="mt-4 text-center text-lg text-muted-foreground max-w-xl mx-auto">
            We designed this to take almost none of your time.
          </p>
        </FadeIn>

        {/* Steps */}
        <div className="mt-16 relative">
          {/* Connecting line (desktop only) */}
          <div className="hidden md:block absolute top-8 left-[16.67%] right-[16.67%] h-px bg-border/60" />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <FadeIn key={step.step} direction="up" delay={240 + i * 120}>
                  <div className="text-center">
                    {/* Icon */}
                    <div className="inline-flex flex-col items-center">
                      <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl bg-card border border-border/40 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                        <Icon weight="light" className="h-7 w-7 text-accent" />
                      </div>
                    </div>

                    {/* Step label */}
                    <p className="mt-4 text-xs font-semibold uppercase tracking-widest text-accent">
                      Step {step.step}
                    </p>

                    {/* Title */}
                    <h3 className="mt-3 text-base font-semibold text-foreground">
                      {step.title}
                    </h3>

                    {/* Description */}
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-xs mx-auto">
                      {step.description}
                    </p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
