'use client';

import { FadeIn } from '@/components/ui/fade-in';
import { GeometricMarker } from '@/components/ui/geometric-marker';

const steps = [
  {
    number: 1,
    title: 'Add Contact',
    description: 'Import your customer list or add one contact. Takes 10 seconds.',
    color: 'lime' as const,
  },
  {
    number: 2,
    title: 'Write Message',
    description: 'Use our template or write your own. We pre-fill the contact\'s name.',
    color: 'coral' as const,
  },
  {
    number: 3,
    title: 'Send',
    description: 'Click send. That\'s it. We track delivery, opens, and clicks for you.',
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
            Three steps. Two minutes. Zero complexity.
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
