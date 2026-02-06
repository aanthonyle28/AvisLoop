'use client';

import { FadeIn } from '@/components/ui/fade-in';
import { ThumbsUp, Clock, Heart } from '@phosphor-icons/react';

const outcomes = [
  {
    icon: ThumbsUp,
    outcome: 'Get 3x More Reviews',
    benefit: 'Multi-touch campaigns automatically follow up 2-3 times until customers respond. Most people ignore the first ask—automation ensures you never give up.',
    proof: 'Average 3x more reviews in first month',
    color: 'lime' as const,
  },
  {
    icon: Clock,
    outcome: 'Never Miss a Follow-Up',
    benefit: 'Complete a job in 10 seconds. System handles timing, reminders, and sequences. Works while you\'re on the next call.',
    proof: '10 seconds per job entry',
    color: 'coral' as const,
  },
  {
    icon: Heart,
    outcome: 'Protect Your Reputation',
    benefit: 'Review funnel routes 4-5 stars to Google, 1-3 stars to private feedback. Only satisfied customers leave public reviews.',
    proof: 'Zero bad reviews from funnel users',
    color: 'lime' as const,
  },
];

export function OutcomeCardsSection() {
  return (
    <section className="py-20 md:py-28 bg-muted/30">
      <div className="container mx-auto max-w-5xl px-4">
        {/* Header */}
        <FadeIn direction="up">
          <h2 className="text-3xl md:text-4xl font-bold text-balance text-center">
            What You Get
          </h2>
        </FadeIn>

        {/* Cards grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-12">
          {outcomes.map((item, i) => {
            const Icon = item.icon;
            return (
              <FadeIn key={item.outcome} direction="up" delay={i * 150}>
                <div className="bg-card border border-border rounded-xl p-8 hover:shadow-lg motion-safe:transition-shadow">
                  {/* Icon wrapper */}
                  <div
                    className={`inline-flex items-center justify-center w-12 h-12 rounded-lg mb-4 ${
                      item.color === 'lime' ? 'bg-lime/10' : 'bg-coral/10'
                    }`}
                  >
                    <Icon
                      weight="duotone"
                      className={`w-6 h-6 ${
                        item.color === 'lime' ? 'text-lime' : 'text-coral'
                      }`}
                    />
                  </div>

                  {/* Outcome heading */}
                  <h3 className="text-xl font-bold mb-3 text-foreground">
                    {item.outcome}
                  </h3>

                  {/* Benefit copy */}
                  <p className="text-muted-foreground mb-4">{item.benefit}</p>

                  {/* Proof point */}
                  <p className="text-sm font-medium text-foreground">
                    {item.proof}
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
