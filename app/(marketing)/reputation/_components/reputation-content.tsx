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
      className="relative min-h-svh flex items-end overflow-hidden pb-20 pt-32"
    >
      <FloatingShapes />

      <motion.div
        style={{ opacity }}
        className="max-w-7xl mx-auto w-full px-6 lg:px-10"
      >
        <div className="grid lg:grid-cols-2 gap-16 items-end">
          {/* Left — headline */}
          <div>
            <AccentBar
              delay={0.3}
              className="mb-8"
            />

            <h1 className="text-[clamp(2.8rem,7vw,6.5rem)] font-black leading-[0.92] tracking-[-0.03em]">
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
          </div>

          {/* Right — description + CTA */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="lg:pb-4"
          >
            <p className="text-lg md:text-xl text-muted-foreground leading-relaxed max-w-md">
              Automated follow-ups, AI review responses, and a smart review
              funnel that protects your Google rating — all fully managed for
              HVAC, plumbing, electrical, and home service businesses.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href={CALENDLY}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-3 rounded-full bg-foreground text-background px-7 py-4 text-base font-semibold hover:bg-foreground/90 transition-colors"
              >
                Book a Call
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-accent text-white">
                  <ArrowRight
                    size={14}
                    className="group-hover:translate-x-0.5 transition-transform"
                  />
                </span>
              </a>
              <a
                href="#pricing"
                className="inline-flex items-center gap-2 rounded-full border border-border px-7 py-4 text-base font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
              >
                See Pricing
              </a>
            </div>

            <div className="mt-8 flex gap-6 text-xs text-muted-foreground/60">
              <span>$99/mo add-on</span>
              <span>No contracts</span>
              <span>Cancel anytime</span>
            </div>
          </motion.div>
        </div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8, duration: 0.8 }}
          className="mt-16 flex items-center gap-3"
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
