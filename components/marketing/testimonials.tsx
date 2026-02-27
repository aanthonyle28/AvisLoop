'use client';

import { Star } from '@phosphor-icons/react';
import { FadeIn } from '@/components/ui/fade-in';

const testimonials = [
  {
    quote:
      'I used to forget to ask for reviews all the time. Now I just fill out a quick form after each job and AvisLoop takes care of the rest. We picked up 35 new reviews in like 6 weeks without me thinking about it.',
    name: 'Mike Rodriguez',
    business: 'Rodriguez HVAC',
  },
  {
    quote:
      'Had a customer who was upset about a warranty thing and they would have left us a 2 star review for sure. Instead it went to private feedback and we actually fixed the issue. Our Google rating has been sitting at 4.8 since we started.',
    name: 'Sarah Chen',
    business: 'Premier Plumbing',
  },
  {
    quote:
      'Honestly I was paying for another review tool before this and never used it because it was too much work. This one just runs in the background. My guys finish a job, I log it real quick, and reviews start coming in a few days later.',
    name: 'James Thompson',
    business: 'Thompson Electric',
  },
];

export function Testimonials() {
  return (
    <section id="testimonials" className="py-24 md:py-32 scroll-mt-20">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <FadeIn direction="up">
          <div className="text-center mb-16">
            <p className="text-xs font-medium uppercase tracking-wide text-accent mb-4">
              Testimonials
            </p>
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Trusted by Austin&apos;s best contractors.
            </h2>
          </div>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t, i) => (
            <FadeIn key={t.name} direction="up" delay={i * 100}>
              <blockquote className="rounded-2xl border border-border/40 bg-card p-8 h-full flex flex-col">
                <div className="flex gap-0.5 mb-5">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <Star
                      key={j}
                      weight="fill"
                      size={16}
                      className="text-accent"
                    />
                  ))}
                </div>

                <p className="text-sm leading-relaxed text-foreground flex-1">
                  &ldquo;{t.quote}&rdquo;
                </p>

                <div className="border-t border-border/30 mt-6 pt-4">
                  <p className="text-sm font-semibold text-foreground">
                    {t.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{t.business}</p>
                </div>
              </blockquote>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
