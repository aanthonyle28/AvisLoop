'use client';

import { FadeIn } from '@/components/ui/fade-in';
import { CalendarX, Megaphone, Wrench } from '@phosphor-icons/react';

const painPoints = [
  {
    icon: CalendarX,
    problem: 'Forgetting to Ask',
    agitation: 'You finish a great service, the customer leaves happy, and then... nothing. You meant to follow up but got busy. Another review opportunity lost.',
    color: 'lime' as const,
  },
  {
    icon: Megaphone,
    problem: 'Awkward Asks',
    agitation: 'Asking for reviews in person feels pushy. You don\'t want to pressure customers, so you say nothing and hope they remember on their own.',
    color: 'coral' as const,
  },
  {
    icon: Wrench,
    problem: 'Complex Tools',
    agitation: 'Marketing platforms promise automation but require campaigns, workflows, and hours of setup. You just want to send one message.',
    color: 'lime' as const,
  },
];

export function ProblemSolutionSection() {
  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container mx-auto max-w-5xl px-4">
        {/* Header */}
        <FadeIn direction="up">
          <h2 className="text-3xl md:text-4xl font-bold text-balance text-center mb-4 text-foreground">
            Stop Losing Reviews to Forgotten Follow-Ups
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-center">
            You&apos;re not alone. Every business struggles with the same review request challenges.
          </p>
        </FadeIn>

        {/* Pain point cards */}
        <div className="grid md:grid-cols-3 gap-8 mt-12">
          {painPoints.map((point, i) => {
            const Icon = point.icon;
            return (
              <FadeIn key={point.problem} direction="up" delay={i * 150}>
                <div className="bg-card border border-border rounded-xl p-6 hover:shadow-lg motion-safe:transition-shadow">
                  {/* Icon */}
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${
                      point.color === 'lime' ? 'bg-lime/10' : 'bg-coral/10'
                    }`}
                  >
                    <Icon
                      weight="duotone"
                      className={`w-6 h-6 ${
                        point.color === 'lime' ? 'text-lime' : 'text-coral'
                      }`}
                    />
                  </div>

                  {/* Problem heading */}
                  <h3 className="text-xl font-semibold mb-3 text-foreground">
                    {point.problem}
                  </h3>

                  {/* Agitation copy */}
                  <p className="text-muted-foreground">{point.agitation}</p>
                </div>
              </FadeIn>
            );
          })}
        </div>

        {/* Solution bridge */}
        <FadeIn direction="up" delay={450}>
          <div className="mt-12 text-center">
            <p className="text-lg font-medium text-foreground mb-2">
              AvisLoop fixes all three problems.
            </p>
            <p className="text-muted-foreground">Here&apos;s how it works:</p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
