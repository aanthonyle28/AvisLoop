'use client';

import { motion } from 'framer-motion';
import { Check, ArrowRight } from '@phosphor-icons/react';
import { AccentBar } from '@/components/marketing/v4/shared';
import { V4FAQ } from '@/components/marketing/v4/sections';

/* ─── Constants ─────────────────────────────────────────── */

const CALENDLY =
  'https://calendly.com/anthony-le-avisloop/avisloop-demo-onboarding-call';

/* ─── Plans ─────────────────────────────────────────────── */

const plans = [
  {
    name: 'Basic',
    price: '199',
    tagline: 'Small service businesses',
    features: [
      '1–4 page custom website',
      'Mobile-optimized design',
      'On-page SEO',
      '2 revisions / month',
      'Client revision portal',
      'Hosting & SSL included',
    ],
    dark: false,
    popular: false,
    cta: 'Get Started',
    href: CALENDLY,
    external: true,
  },
  {
    name: 'Advanced',
    price: '299',
    tagline: 'Growing companies',
    features: [
      '4–10 page custom website',
      'Mobile-optimized design',
      'Full SEO + local + Maps',
      '4 revisions / month',
      'Client revision portal',
      'Hosting & SSL included',
      'Lead capture forms',
      'Priority support',
    ],
    dark: true,
    popular: true,
    cta: 'Get Started',
    href: CALENDLY,
    external: true,
  },
  {
    name: 'Reviews Add-On',
    price: '99',
    tagline: 'Add to any plan',
    features: [
      'Automated review campaigns',
      'AI-personalized messages',
      'Email + SMS follow-ups',
      'Smart review funnel',
      'Competitor tracking',
    ],
    dark: false,
    popular: false,
    cta: 'Learn More',
    href: '/reputation',
    external: false,
  },
];

/* ─── FAQ data ──────────────────────────────────────────── */

const faqs: [string, string][] = [
  [
    "What's included in the monthly fee?",
    'Your monthly fee covers everything: website hosting, SSL certificate, all code and design updates, and ongoing maintenance. There are no hidden fees, no domain markup, and no surprise invoices. Basic includes 2 revision requests per month; Advanced includes 4.',
  ],
  [
    'What if I need more revisions?',
    'Additional revisions beyond your monthly limit are available at $50 each. We confirm the scope before starting so there are no surprise charges. You can also upgrade to Advanced at any time to get 4 revisions per month.',
  ],
  [
    'Do I own my website?',
    'Yes. Your domain is yours, your content is yours. If you ever cancel, we export everything and hand it over. You are never locked into AvisLoop to keep your website running.',
  ],
  [
    'Can I cancel anytime?',
    'Yes. There are no long-term contracts and no cancellation fees. We operate month-to-month because we prefer to earn your business every month with results rather than lock you into an agreement.',
  ],
  [
    'How is this different from hiring a designer?',
    'A freelance designer charges $3,000–$15,000 upfront for a site that goes stale immediately with no ongoing support. AvisLoop is a managed service — we build it, host it, maintain it, and update it every month for a flat fee. One invoice, everything included.',
  ],
  [
    'What is the Review Add-On?',
    'The Review Add-On ($99/mo) adds automated review management to any web design plan. After each job, you fill out a short form. We send personalized follow-up messages, route happy customers to Google reviews, and keep negative feedback private so you can resolve it first.',
  ],
];

/* ─── Pricing Grid ──────────────────────────────────────── */

function PricingGrid() {
  return (
    <div className="grid lg:grid-cols-3 gap-4">
      {plans.map((plan, i) => (
        <motion.div
          key={plan.name}
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className={`group relative rounded-2xl p-8 lg:p-10 flex flex-col transition-transform duration-300 hover:-translate-y-1 ${
            plan.dark
              ? 'bg-foreground text-background'
              : 'border border-border/40'
          }`}
        >
          {plan.popular && (
            <span className="absolute -top-3 right-8 text-[10px] tracking-[0.2em] uppercase bg-accent text-white px-4 py-1 rounded-full font-semibold">
              Popular
            </span>
          )}

          <span
            className={`text-xs tracking-[0.2em] uppercase font-medium ${
              plan.dark ? 'text-accent' : 'text-muted-foreground'
            }`}
          >
            {plan.name}
          </span>

          <div className="mt-4 mb-1">
            <span className="text-5xl font-black tracking-tight">
              ${plan.price}
            </span>
            <span
              className={`text-base ml-1 ${
                plan.dark ? 'text-background/40' : 'text-muted-foreground'
              }`}
            >
              /mo
            </span>
          </div>
          <p
            className={`text-sm mb-8 ${
              plan.dark ? 'text-background/40' : 'text-muted-foreground'
            }`}
          >
            {plan.tagline}
          </p>

          <ul className="space-y-3 flex-1">
            {plan.features.map((f) => (
              <li key={f} className="flex items-start gap-3">
                <Check
                  weight="bold"
                  size={14}
                  className="text-accent shrink-0 mt-0.5"
                />
                <span
                  className={`text-sm ${plan.dark ? 'text-background/70' : ''}`}
                >
                  {f}
                </span>
              </li>
            ))}
          </ul>

          <a
            href={plan.href}
            target={plan.external ? '_blank' : undefined}
            rel={plan.external ? 'noopener noreferrer' : undefined}
            className={`mt-8 flex items-center justify-center gap-2 rounded-full py-3.5 text-sm font-semibold transition-colors ${
              plan.dark
                ? 'bg-accent text-white hover:bg-accent/90'
                : 'bg-foreground text-background hover:bg-foreground/90'
            }`}
          >
            {plan.cta}
            <ArrowRight size={14} />
          </a>
        </motion.div>
      ))}
    </div>
  );
}

/* ─── Root export ───────────────────────────────────────── */

export function PricingContent() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* ── Hero header ── */}
      <section className="py-24 md:py-36">
        <div className="max-w-7xl mx-auto px-6 lg:px-10">
          <AccentBar className="mb-8" />

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="text-[clamp(2.8rem,7vw,6rem)] font-black leading-[0.92] tracking-[-0.03em] mb-6"
          >
            Simple pricing.
            <br />
            <span className="text-muted-foreground">No surprises.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="text-lg md:text-xl text-muted-foreground max-w-lg leading-relaxed"
          >
            No setup fees. No contracts. Cancel anytime.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-16"
          >
            <PricingGrid />
          </motion.div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <V4FAQ faqs={faqs} />
    </div>
  );
}
