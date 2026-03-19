'use client';

import { useRef } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, ArrowDown, Check, Star } from '@phosphor-icons/react';
import {
  FloatingShapes,
  MarqueeRow,
  AccentBar,
  SectionDivider,
} from '@/components/marketing/v4/shared';
import {
  V4Stats,
  V4Testimonials,
  V4FAQ,
} from '@/components/marketing/v4/sections';

/* ─── Constants ─────────────────────────────────────────── */

const CALENDLY =
  'https://calendly.com/anthony-le-avisloop/avisloop-demo-onboarding-call';

/* ─── Review Funnel Graphic ─────────────────────────────── */

function ReviewFunnelGraphic() {
  const ACCENT_COLOR = 'hsl(21 58% 53%)';

  return (
    <div className="relative w-full max-w-md mx-auto">
      {/* Subtle glow behind the card */}
      <div className="absolute -inset-4 bg-accent/5 rounded-3xl blur-2xl" />

      <div className="relative bg-card/80 backdrop-blur-sm border border-border/40 rounded-2xl p-6 shadow-xl">
        {/* Header bar */}
        <div className="flex items-center gap-2 mb-5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
          <span className="ml-2 text-[10px] text-muted-foreground/40 font-mono">AvisLoop Review Funnel</span>
        </div>

        {/* Step 1: Job completed */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.2, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-3 mb-3"
        >
          <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
            <Check weight="bold" size={14} style={{ color: ACCENT_COLOR }} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold truncate">Job Completed — AC Repair</p>
            <p className="text-[10px] text-muted-foreground">Patricia Johnson • HVAC</p>
          </div>
          <span className="text-[9px] text-muted-foreground/40 shrink-0">10s ago</span>
        </motion.div>

        {/* Step 2: Follow-ups sent */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 1.6, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="ml-4 border-l-2 border-border/30 pl-5 py-2 mb-3"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span className="text-[10px] text-muted-foreground">Touch 1 — Email sent</span>
            <span className="text-[9px] text-green-500 font-medium ml-auto">Delivered</span>
          </div>
          <div className="flex items-center gap-2 mb-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-accent" />
            <span className="text-[10px] text-muted-foreground">Touch 2 — SMS sent</span>
            <span className="text-[9px] text-green-500 font-medium ml-auto">Delivered</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30" />
            <span className="text-[10px] text-muted-foreground/40">Touch 3 — Scheduled</span>
            <span className="text-[9px] text-muted-foreground/30 ml-auto">In 48h</span>
          </div>
        </motion.div>

        {/* Step 3: Rating received */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 2.0, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center gap-3 mb-3"
        >
          <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center shrink-0">
            <Star weight="fill" size={14} className="text-yellow-500" />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold">Customer rated: 5 stars</p>
            <div className="flex gap-0.5 mt-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} weight="fill" size={10} className="text-yellow-500" />
              ))}
            </div>
          </div>
        </motion.div>

        {/* Step 4: Routed to Google */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 2.4, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="bg-green-500/5 border border-green-500/20 rounded-xl p-3 flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0">
            <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-green-700 dark:text-green-400">Redirected to Google Reviews</p>
            <p className="text-[10px] text-green-600/60 dark:text-green-400/60">5-star review → public review page</p>
          </div>
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ delay: 2.8, duration: 0.6 }}
          >
            <Check weight="bold" size={16} className="text-green-500" />
          </motion.div>
        </motion.div>

        {/* Divider with "or" */}
        <div className="flex items-center gap-3 my-3">
          <div className="flex-1 h-px bg-border/30" />
          <span className="text-[9px] text-muted-foreground/30 uppercase tracking-widest">if 1–3 stars</span>
          <div className="flex-1 h-px bg-border/30" />
        </div>

        {/* Alternative: Private feedback */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 2.6, duration: 0.5 }}
          className="bg-muted/30 border border-border/20 rounded-xl p-3 flex items-center gap-3"
        >
          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <svg viewBox="0 0 256 256" className="w-4 h-4 text-muted-foreground/60" fill="currentColor" aria-hidden="true">
              <path d="M232,96a8,8,0,0,0-8,8v88a8,8,0,0,1-8,8H40a8,8,0,0,1-8-8V104a8,8,0,0,0-16,0v88a24,24,0,0,0,24,24H216a24,24,0,0,0,24-24V104A8,8,0,0,0,232,96ZM80.34,69.66a8,8,0,0,1,0-11.32l40-40a8,8,0,0,1,11.32,0l40,40a8,8,0,0,1-11.32,11.32L136,45.66V136a8,8,0,0,1-16,0V45.66L93.66,69.66A8,8,0,0,1,80.34,69.66Z" />
            </svg>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground/60">Redirected to Private Feedback</p>
            <p className="text-[10px] text-muted-foreground/30">Negative reviews stay off Google</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ─── Hero ──────────────────────────────────────────────── */

function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative min-h-svh flex items-center overflow-hidden pt-24 pb-16 lg:pb-20"
    >
      <FloatingShapes />

      <motion.div
        style={{ opacity }}
        className="max-w-7xl mx-auto w-full px-6 lg:px-10"
      >
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — headline + CTA */}
          <div>
            <AccentBar delay={0.3} className="mb-8" />

            <h1 className="text-[clamp(2.4rem,6vw,5.5rem)] font-black leading-[0.92] tracking-[-0.03em]">
              <motion.span
                className="block"
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                We manage your
              </motion.span>
              <motion.span
                className="block text-accent"
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                Google reviews.
              </motion.span>
              <motion.span
                className="block"
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                You run jobs.
              </motion.span>
            </h1>

            <motion.p
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 text-lg md:text-xl text-muted-foreground leading-relaxed max-w-md"
            >
              Automated follow-ups, AI review responses, and a smart review
              funnel that protects your Google rating.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 flex flex-wrap gap-4"
            >
              <a
                href={CALENDLY}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-3 rounded-full bg-foreground text-background px-7 py-4 text-base font-semibold hover:bg-foreground/90 transition-colors"
              >
                Book a Call
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-accent text-white">
                  <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </span>
              </a>
              <a
                href="#pricing"
                className="inline-flex items-center gap-2 rounded-full border border-border px-7 py-4 text-base font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
              >
                See Pricing
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3, duration: 0.5 }}
              className="mt-6 flex gap-6 text-xs text-muted-foreground/60"
            >
              <span>$99/mo add-on</span>
              <span>No contracts</span>
              <span>Cancel anytime</span>
            </motion.div>
          </div>

          {/* Right — Review Funnel UI Mockup */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="hidden lg:block"
          >
            <ReviewFunnelGraphic />
          </motion.div>
        </div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.5, duration: 0.8 }}
          className="mt-12 flex items-center gap-3"
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <ArrowDown size={14} className="text-muted-foreground/40" />
          </motion.div>
          <span className="text-[11px] tracking-[0.25em] uppercase text-muted-foreground/40">
            Scroll to explore
          </span>
        </motion.div>
      </motion.div>
    </section>
  );
}

/* ─── Marquee Social Proof ──────────────────────────────── */

const reviewTerms = [
  'Google Reviews',
  '4.8 Average Rating',
  'Multi-Touch Campaigns',
  'AI Responses',
  'Review Funnel',
  'Competitor Tracking',
  'Private Feedback',
  'Automated Follow-Ups',
];

const tradeTerms = [
  'HVAC',
  'Plumbing',
  'Electrical',
  'Roofing',
  'Painting',
  'Cleaning',
  'Handyman',
  'General Contracting',
];

function Marquee() {
  return (
    <section className="py-10 overflow-hidden border-y border-border/20">
      <div className="space-y-3">
        <MarqueeRow items={reviewTerms} accent />
        <MarqueeRow items={tradeTerms} reverse />
      </div>
    </section>
  );
}

/* ─── How It Works ──────────────────────────────────────── */

const steps = [
  {
    num: '01',
    title: 'Complete a job',
    desc: 'Fill out a quick 10-second form — customer name, contact info, service type. That\'s the only thing you do.',
  },
  {
    num: '02',
    title: 'Automated follow-ups sent',
    desc: 'We send 2–3 personalized follow-up messages over several days via email and SMS. Timing is optimized per service type.',
  },
  {
    num: '03',
    title: 'Customer rates their experience',
    desc: 'Customers click your review link and privately rate 1–5 stars before being directed anywhere.',
  },
  {
    num: '04',
    title: '4–5 stars go to Google. 1–3 stay private.',
    desc: 'Happy customers land on Google. Unhappy customers see a private feedback form — so you can fix the issue before it goes public.',
  },
  {
    num: '05',
    title: 'AI responds to every review',
    desc: 'We draft and post personalized, on-brand responses to every Google review. Active response signals boost your local search ranking.',
  },
];

function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="py-32 md:py-44 bg-foreground text-background overflow-hidden scroll-mt-20"
    >
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="grid lg:grid-cols-[1fr_1.2fr] gap-20">
          {/* Left — sticky header */}
          <div className="lg:sticky lg:top-32 lg:self-start">
            <AccentBar className="mb-8" />
            <motion.h2
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[0.95]"
            >
              How it
              <br />
              <span className="text-background/30">works.</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mt-6 text-background/50 max-w-sm leading-relaxed"
            >
              You do one thing. We handle the rest — campaigns, timing,
              responses, reporting.
            </motion.p>
          </div>

          {/* Right — step rows */}
          <div className="space-y-0">
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                initial={{ opacity: 0, x: 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{
                  delay: i * 0.08,
                  duration: 0.6,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="group py-10 border-b border-background/10 last:border-b-0"
              >
                <div className="flex items-start gap-6">
                  <span className="text-xs text-background/20 font-mono pt-1.5 shrink-0">
                    {s.num}
                  </span>
                  <div>
                    <h3 className="text-xl md:text-2xl font-bold group-hover:text-accent transition-colors duration-300">
                      {s.title}
                    </h3>
                    <p className="mt-2 text-sm text-background/40 leading-relaxed max-w-md">
                      {s.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── Stats ─────────────────────────────────────────────── */

const reviewStats = [
  {
    value: '35',
    suffix: '+',
    label: 'Reviews in 6 weeks',
    detail: 'Average for new clients',
  },
  {
    value: '4.8',
    suffix: '★',
    label: 'Average Google rating',
    detail: 'Across active clients',
  },
  {
    value: '3',
    suffix: 'x',
    label: 'Response rate',
    detail: 'vs. a single-touch ask',
  },
  {
    value: '$0',
    label: 'Per review',
    detail: 'Flat $99/mo, unlimited jobs',
  },
];

/* ─── Features Grid ─────────────────────────────────────── */

const features = [
  {
    title: 'Multi-Touch Campaigns',
    desc: '2–3 personalized follow-ups over several days. We keep trying until they respond, so you never lose a review to silence.',
  },
  {
    title: 'Smart Review Funnel',
    desc: 'Pre-qualify every review privately. 4–5 stars go to Google. 1–3 stars go to private feedback. Your rating is protected.',
  },
  {
    title: 'AI Review Responses',
    desc: 'Every Google review gets a personalized, on-brand response. Active engagement signals boost your local search visibility.',
  },
  {
    title: 'Competitor Tracking',
    desc: 'We monitor your top competitor\'s review count and rating each month — so you always know where you stand.',
  },
];

function Features() {
  return (
    <section className="py-32 md:py-44">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <SectionDivider label="What's Included" className="mb-20" />

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-px bg-border/40 rounded-2xl overflow-hidden">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{
                delay: i * 0.1,
                duration: 0.6,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="bg-background p-10 md:p-8 lg:p-10 group"
            >
              <span className="block text-[8rem] md:text-[6rem] lg:text-[8rem] font-black leading-none text-foreground/[0.04] select-none -mb-8 md:-mb-6 lg:-mb-8">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="text-xl font-bold group-hover:text-accent transition-colors duration-300">
                {f.title}
              </h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                {f.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Testimonials data ─────────────────────────────────── */

const testimonials = [
  {
    quote:
      'We picked up 35 new reviews in 6 weeks without me thinking about it. I just fill out a quick form after each job and AvisLoop handles the rest.',
    name: 'Mike Rodriguez',
    title: 'Rodriguez HVAC — Austin, TX',
  },
  {
    quote:
      'A customer was about to leave a 2-star review. Instead it went to private feedback and we fixed the issue. Our Google rating has been 4.8 since we started.',
    name: 'Sarah Chen',
    title: 'Premier Plumbing — Round Rock, TX',
  },
  {
    quote:
      'I was paying for another tool and never used it because it was too much work. This one runs in the background. Finish a job, log it, reviews come in.',
    name: 'James Thompson',
    title: 'Thompson Electric — Cedar Park, TX',
  },
];

/* ─── Pricing ───────────────────────────────────────────── */

const reviewFeatures = [
  'Automated multi-touch campaigns',
  'Email + SMS follow-ups',
  'AI-personalized messages',
  'Smart review funnel (4–5 → Google, 1–3 → private)',
  'AI responses to every Google review',
  'Monthly competitor tracking report',
  'Private feedback management',
  'Monthly performance report',
];

function Pricing() {
  return (
    <section id="pricing" className="py-32 md:py-44 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-xl mb-16"
        >
          <AccentBar className="mb-8" />
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight leading-[0.95]">
            One price.
            <br />
            <span className="text-muted-foreground">Everything included.</span>
          </h2>
        </motion.div>

        <div className="max-w-lg">
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ delay: 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="relative rounded-2xl p-8 lg:p-10 flex flex-col border border-border/40 hover:-translate-y-1 transition-transform duration-300"
          >
            <span className="text-xs tracking-[0.2em] uppercase font-medium text-muted-foreground">
              Reviews Add-On
            </span>

            <div className="mt-4 mb-1">
              <span className="text-5xl font-black tracking-tight">$99</span>
              <span className="text-base ml-1 text-muted-foreground">/mo</span>
            </div>
            <p className="text-sm mb-2 text-muted-foreground">
              Add to any web design plan
            </p>
            <div className="flex gap-1 mb-8">
              {[...Array(5)].map((_, i) => (
                <Star key={i} weight="fill" size={14} className="text-accent" />
              ))}
            </div>

            <ul className="space-y-3 flex-1">
              {reviewFeatures.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <Check
                    weight="bold"
                    size={14}
                    className="text-accent shrink-0 mt-0.5"
                  />
                  <span className="text-sm">{f}</span>
                </li>
              ))}
            </ul>

            <a
              href={CALENDLY}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-8 flex items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold transition-colors bg-foreground text-background hover:bg-foreground/90"
            >
              Get Started
              <ArrowRight size={14} />
            </a>

            <p className="mt-4 text-center text-xs text-muted-foreground/60">
              No contracts &middot; Cancel anytime &middot; No setup fees
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

/* ─── FAQ data ──────────────────────────────────────────── */

const faqs: [string, string][] = [
  [
    'How does AvisLoop\'s managed review service work?',
    'We handle everything. After a quick onboarding call, we connect your Google Business Profile, build your review campaigns, and map your competitors. You just submit a quick form after each job — name, contact info, service type. We take it from there: automated follow-ups, AI review responses, and monthly performance reports.',
  ],
  [
    'What do I actually need to do as a business owner?',
    'One thing: fill out a short form after each job. It takes about ten seconds. That\'s your only involvement. We handle the campaigns, the timing, the follow-ups, and the review responses. You focus on running your business.',
  ],
  [
    'How does the review funnel protect my Google rating?',
    'When a customer clicks the review link, they rate their experience privately first. If they give 4-5 stars, they\'re redirected to leave a public Google review. If they give 1-3 stars, they see a private feedback form instead — so you can address the issue before it goes public. Only your best reviews make it to Google.',
  ],
  [
    'How many Google reviews can I expect?',
    'Most businesses see new Google reviews within the first week. Our multi-touch campaigns follow up 2-3 times over several days, so response rates are significantly higher than a single ask. On average, clients triple their review count within 90 days.',
  ],
  [
    'Do you respond to Google reviews on my behalf?',
    'Yes. Every review — positive or negative — gets a personalized, on-brand response drafted by AI and posted to your profile. Responding to reviews signals to Google that your business is active, which helps with local search rankings.',
  ],
  [
    'How is this different from other review management tools?',
    'Most review tools are software you have to learn and run yourself. AvisLoop is a fully managed service — we set up your campaigns, configure your review funnel, track your competitors, and respond to every Google review. You never log into a dashboard or manage templates. We do it all for $149/month.',
  ],
  [
    'What types of home service businesses do you work with?',
    'We work with HVAC companies, plumbers, electricians, roofers, painters, cleaning services, and general handyman businesses. Our campaigns and timing are configured specifically for each service type because a plumbing emergency and a routine AC maintenance need different follow-up strategies.',
  ],
  [
    'Can I cancel anytime?',
    'Yes. No contracts, no commitments. It\'s $149/month and you can cancel whenever you want. We keep it simple because we\'d rather earn your business every month with results than lock you into an agreement.',
  ],
];

/* ─── Final CTA ─────────────────────────────────────────── */

function FinalCTA() {
  return (
    <section className="py-32 md:py-44">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 text-center">
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="text-5xl md:text-7xl lg:text-[8rem] font-black tracking-[-0.04em] leading-[0.9]"
        >
          Your next customer is
          <br />
          reading your{' '}
          <span className="text-accent">reviews</span>
          <br />
          right now.
        </motion.h2>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="mt-12"
        >
          <a
            href={CALENDLY}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-3 rounded-full bg-foreground text-background px-10 py-5 text-lg font-semibold hover:bg-foreground/90 transition-colors"
          >
            Book a Free Call
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-accent text-white">
              <ArrowRight
                size={16}
                className="group-hover:translate-x-0.5 transition-transform"
              />
            </span>
          </a>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mt-6 text-xs text-muted-foreground/40 tracking-widest uppercase"
        >
          15 min &middot; no commitment &middot; $99/mo add-on
        </motion.p>
      </div>
    </section>
  );
}

/* ─── Root export ───────────────────────────────────────── */

export function ReputationContent() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Hero />
      <Marquee />
      <HowItWorks />
      <V4Stats
        stats={reviewStats}
        heading="Results that compound."
        subheading="By the numbers"
      />
      <Features />
      <V4Testimonials testimonials={testimonials} />
      <Pricing />
      <V4FAQ faqs={faqs} />
      <FinalCTA />
    </div>
  );
}
