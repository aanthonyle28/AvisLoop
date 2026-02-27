'use client';

import { useEffect, useRef, useState } from 'react';
import CountUp from 'react-countup';
import { FadeIn } from '@/components/ui/fade-in';

interface Stat {
  /** Value rendered by CountUp (numeric portion). Ignored for text-only stats. */
  end?: number;
  /** Static text displayed instead of CountUp (e.g. "24/7"). */
  text?: string;
  prefix?: string;
  suffix?: string;
  label: string;
  duration: number;
  decimals?: number;
}

const stats: Stat[] = [
  {
    end: 3,
    suffix: 'x',
    label: 'More reviews in 90 days',
    duration: 1.8,
  },
  {
    end: 10,
    suffix: 's',
    label: 'Per job entry',
    duration: 2,
  },
  {
    end: 47,
    suffix: '%',
    label: 'Average response rate',
    duration: 2.2,
  },
  {
    text: '24/7',
    label: 'Automated follow-ups',
    duration: 0,
  },
];

export function AnimatedStatsSection() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [hasScrolledIn, setHasScrolledIn] = useState(false);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setHasScrolledIn(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 md:py-32 bg-stone-900">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section label */}
        <FadeIn direction="up">
          <p className="text-center text-xs font-medium uppercase tracking-widest text-accent mb-4">
            By the Numbers
          </p>
        </FadeIn>

        {/* Headline */}
        <FadeIn direction="up" delay={80}>
          <h2 className="text-center text-4xl md:text-5xl font-extrabold tracking-tight text-stone-50 text-balance">
            Numbers that matter to your bottom line.
          </h2>
        </FadeIn>

        {/* Subtitle */}
        <FadeIn direction="up" delay={160}>
          <p className="mt-4 text-center text-lg text-stone-400 max-w-xl mx-auto">
            More reviews means more trust, higher rankings, and more calls.
          </p>
        </FadeIn>

        {/* Stats grid */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <FadeIn key={stat.label} direction="up" delay={240 + i * 100}>
              <div className="text-center">
                {/* Big number */}
                <div className="text-5xl md:text-6xl font-extrabold tracking-tight text-stone-50">
                  {stat.text ? (
                    /* Static text stat (e.g. "24/7") */
                    <span>{stat.text}</span>
                  ) : hasScrolledIn ? (
                    <CountUp
                      end={stat.end ?? 0}
                      prefix={stat.prefix}
                      suffix={stat.suffix}
                      duration={stat.duration}
                      decimals={stat.decimals ?? 0}
                      useEasing
                    />
                  ) : (
                    /* Placeholder before scroll triggers to prevent layout shift */
                    <span className="invisible">
                      {stat.prefix ?? ''}
                      {stat.end ?? 0}
                      {stat.suffix ?? ''}
                    </span>
                  )}
                </div>

                {/* Label */}
                <p className="mt-2 text-sm text-stone-400">
                  {stat.label}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
