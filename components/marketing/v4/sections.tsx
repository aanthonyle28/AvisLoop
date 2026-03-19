'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Plus } from '@phosphor-icons/react';
import { AnimatedNumber, AccentBar } from './shared';

/* ─── V4Stats ───────────────────────────────────────────── */

interface StatItem {
  value: string;
  suffix?: string;
  label: string;
  detail: string;
}

interface V4StatsProps {
  stats: StatItem[];
  heading?: string;
  subheading?: string;
}

export function V4Stats({
  stats,
  heading = 'Built for reliability.',
  subheading = 'By the numbers',
}: V4StatsProps) {
  return (
    <section className="relative overflow-hidden bg-foreground text-background">
      {/* Subtle accent glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] rounded-full bg-accent/[0.06] blur-[120px] pointer-events-none"
        aria-hidden="true"
      />

      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-24 md:py-32 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-xs tracking-[0.3em] uppercase text-accent font-medium">
            {subheading}
          </span>
          <h2 className="mt-4 text-3xl md:text-4xl font-black tracking-tight">
            {heading}
          </h2>
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-10 md:gap-6">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-center"
            >
              <span className="block text-5xl md:text-6xl font-black tracking-tight leading-none">
                <AnimatedNumber value={s.value} suffix={s.suffix} />
              </span>
              <span className="block mt-3 text-sm font-semibold text-background/80">
                {s.label}
              </span>
              <span className="block mt-1 text-xs text-background/35">
                {s.detail}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── V4Testimonials ────────────────────────────────────── */

interface TestimonialItem {
  quote: string;
  name: string;
  title: string;
}

interface V4TestimonialsProps {
  testimonials: TestimonialItem[];
}

export function V4Testimonials({ testimonials }: V4TestimonialsProps) {
  const [idx, setIdx] = useState(0);
  const [dir, setDir] = useState(1);

  const go = useCallback(
    (n: number) => {
      setDir(n > idx ? 1 : -1);
      setIdx(n);
    },
    [idx]
  );

  const next = useCallback(() => {
    setDir(1);
    setIdx((c) => (c + 1) % testimonials.length);
  }, [testimonials.length]);

  useEffect(() => {
    const t = setInterval(next, 7000);
    return () => clearInterval(t);
  }, [next]);

  const t = testimonials[idx];

  return (
    <section className="py-32 md:py-44 bg-muted/30">
      <div className="max-w-5xl mx-auto px-6 lg:px-10 text-center">
        <div className="flex justify-center gap-1 mb-10">
          {[...Array(5)].map((_, i) => (
            <Star key={i} weight="fill" size={16} className="text-accent" />
          ))}
        </div>

        <div className="relative min-h-[200px]">
          <AnimatePresence mode="wait" custom={dir}>
            <motion.blockquote
              key={idx}
              custom={dir}
              initial={{ opacity: 0, y: dir * 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: dir * -20 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="text-2xl md:text-3xl lg:text-4xl font-light leading-snug tracking-tight max-w-3xl mx-auto">
                &ldquo;{t.quote}&rdquo;
              </p>
              <footer className="mt-8">
                <span className="block text-sm font-semibold">{t.name}</span>
                <span className="block text-xs text-muted-foreground mt-1">{t.title}</span>
              </footer>
            </motion.blockquote>
          </AnimatePresence>
        </div>

        {/* Progress dots */}
        <div className="mt-12 flex justify-center gap-3">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              className="relative h-1.5 rounded-full overflow-hidden bg-border/40"
              style={{ width: i === idx ? 40 : 16 }}
              aria-label={`Testimonial ${i + 1}`}
            >
              {i === idx && (
                <motion.div
                  layoutId="tDot"
                  className="absolute inset-0 bg-accent rounded-full"
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── V4FAQ ─────────────────────────────────────────────── */

interface V4FAQProps {
  faqs: [string, string][];
}

export function V4FAQ({ faqs }: V4FAQProps) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section id="faq" className="py-32 md:py-44 scroll-mt-20 bg-foreground text-background">
      <div className="max-w-3xl mx-auto px-6 lg:px-10">
        <AccentBar className="mb-8" />
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-4xl md:text-5xl font-black tracking-tight mb-16"
        >
          Questions
        </motion.h2>

        <div>
          {faqs.map(([q, a], i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.04, duration: 0.4 }}
              className="border-b border-background/10"
            >
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between py-7 text-left group"
                aria-expanded={open === i}
              >
                <span className="font-medium pr-4 group-hover:text-accent transition-colors duration-200">
                  {q}
                </span>
                <motion.span
                  animate={{ rotate: open === i ? 45 : 0 }}
                  transition={{ duration: 0.2 }}
                  className="shrink-0"
                >
                  <Plus size={16} weight="bold" className="text-background/40" />
                </motion.span>
              </button>
              <AnimatePresence initial={false}>
                {open === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden"
                  >
                    <p className="text-background/50 leading-relaxed pb-7 pr-12">
                      {a}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
