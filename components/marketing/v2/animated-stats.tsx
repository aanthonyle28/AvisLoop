'use client';

import CountUp from 'react-countup';
import { FadeIn } from '@/components/ui/fade-in';
import { GeometricMarker } from '@/components/ui/geometric-marker';

const stats = [
  {
    end: 12500,
    suffix: '+',
    label: 'Reviews Collected',
    color: 'lime' as const,
    duration: 2.5,
  },
  {
    end: 500,
    suffix: '+',
    label: 'Home Service Businesses',
    color: 'coral' as const,
    duration: 2,
  },
  {
    end: 47,
    suffix: '%',
    label: 'Average Response Rate',
    color: 'lime' as const,
    duration: 2.2,
  },
  {
    end: 10,
    suffix: 's',
    label: 'Per Job Entry',
    color: 'coral' as const,
    duration: 2.3,
  },
];

export function AnimatedStatsSection() {
  return (
    <section className="py-20 md:py-28 border-y border-border/30">
      <div className="container mx-auto max-w-5xl px-4">
        {/* Header */}
        <FadeIn direction="up">
          <h2 className="text-3xl md:text-4xl font-bold text-balance text-center mb-12">
            Built for Home Service Businesses
          </h2>
        </FadeIn>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <FadeIn key={stat.label} direction="up" delay={i * 100}>
              <div className="text-center">
                {/* Number row */}
                <div className="flex items-center justify-center gap-2 mb-2">
                  <GeometricMarker variant="triangle" color={stat.color} size="md" />
                  <div className="text-4xl md:text-5xl font-bold text-foreground">
                    <CountUp
                      end={stat.end}
                      suffix={stat.suffix}
                      duration={stat.duration}
                      enableScrollSpy
                      scrollSpyOnce
                      useEasing
                    />
                  </div>
                </div>

                {/* Label */}
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
