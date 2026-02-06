'use client';

import { FadeIn } from '@/components/ui/fade-in';
import { GeometricMarker } from '@/components/ui/geometric-marker';

const steps = [
  {
    number: 1,
    title: 'Complete a Job',
    description: 'Enter customer name, phone, and service type. Takes 10 seconds—do it right after the call.',
    color: 'lime' as const,
  },
  {
    number: 2,
    title: 'System Auto-Enrolls',
    description: 'AvisLoop creates the customer record, finds the matching campaign for that service type, and schedules 3 follow-up touches.',
    color: 'coral' as const,
  },
  {
    number: 3,
    title: 'Automation Runs',
    description: 'Multi-touch sequence sends over 3-5 days. Customer rates experience. 4-5 stars go to Google. 1-3 stars go to private feedback. Campaign stops automatically.',
    color: 'lime' as const,
  },
];

export function HowItWorksSection() {
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto max-w-5xl px-4">
        {/* Header */}
        <FadeIn direction="up">
          <h2 className="text-3xl md:text-4xl font-bold text-balance text-center mb-4 text-foreground">
            How It Works
          </h2>
          <p className="text-lg text-muted-foreground text-center">
            One action. Complete automation. More reviews.
          </p>
        </FadeIn>

        {/* Steps */}
        <div className="space-y-16 md:space-y-24 mt-16">
          {steps.map((step, i) => {
            const isOdd = i % 2 === 1;
            return (
              <FadeIn key={step.number} direction="up" delay={i * 200}>
                <div
                  className={`grid md:grid-cols-2 gap-8 items-center ${
                    isOdd ? 'md:grid-flow-dense' : ''
                  }`}
                >
                  {/* Text content */}
                  <div className={isOdd ? 'md:col-start-2' : ''}>
                    {/* Step indicator */}
                    <div className="flex items-center gap-3 mb-4">
                      <GeometricMarker
                        variant="circle"
                        color={step.color}
                        size="md"
                      />
                      <span className="text-5xl font-bold text-muted-foreground/20">
                        {step.number}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-2xl font-bold mb-3 text-foreground">
                      {step.title}
                    </h3>

                    {/* Description */}
                    <p className="text-lg text-muted-foreground">
                      {step.description}
                    </p>
                  </div>

                  {/* Screenshot placeholder */}
                  <div
                    className={
                      isOdd ? 'md:col-start-1 md:row-start-1' : ''
                    }
                  >
                    <div className="rounded-xl border border-border/50 bg-card shadow-lg overflow-hidden">
                      <div className="relative aspect-[4/3] bg-muted/30">
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm text-muted-foreground">
                            Screenshot: {step.title}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
