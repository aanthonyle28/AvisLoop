'use client';

import { useRef } from 'react';
import {
  motion,
  useScroll,
  useTransform,
} from 'framer-motion';
import {
  ArrowRight,
  ArrowDown,
  Check,
} from '@phosphor-icons/react';

import { V4Nav } from '@/components/marketing/v4/nav';
import { V4Footer } from '@/components/marketing/v4/footer';
import { FloatingShapes, MarqueeRow, AccentBar, SectionDivider } from '@/components/marketing/v4/shared';
import { V4Stats, V4Testimonials, V4FAQ } from '@/components/marketing/v4/sections';
import { ThemeSwitcher } from '@/components/theme-switcher';

/* ─── Constants ────────────────────────────────────────── */

const CALENDLY =
  'https://calendly.com/anthony-le-avisloop/avisloop-demo-onboarding-call';

/* ─── Page-specific Nav links ──────────────────────────── */

const NAV_LINKS = [
  { label: 'Services', href: '#services' },
  { label: 'Process', href: '#process' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Reviews', href: '/reputation' },
  { label: 'FAQ', href: '#faq' },
];

/* ─── Hero ─────────────────────────────────────────────── */

function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  });
  const opacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  return (
    <section ref={ref} className="relative min-h-svh flex items-end overflow-hidden pb-20 pt-32">
      <FloatingShapes />

      <motion.div style={{ opacity }} className="max-w-7xl mx-auto w-full px-6 lg:px-10">
        <div className="grid lg:grid-cols-2 gap-16 items-end">
          {/* Left — headline */}
          <div>
            <AccentBar delay={0.3} className="mb-8" />

            <h1 className="text-[clamp(2.8rem,7vw,6.5rem)] font-black leading-[0.92] tracking-[-0.03em]">
              <motion.span
                className="block"
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                We build
              </motion.span>
              <motion.span
                className="block text-accent"
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.55, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                websites
              </motion.span>
              <motion.span
                className="block"
                initial={{ opacity: 0, y: 60 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                that book jobs.
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
              Design, hosting, maintenance, and revisions for HVAC, plumbing,
              electrical, and roofing companies. One monthly fee. We handle
              everything.
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              <a
                href={CALENDLY}
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-3 rounded-full bg-foreground text-background px-7 py-4 text-base font-semibold hover:bg-foreground/90 transition-colors"
              >
                Get Started
                <span className="flex items-center justify-center w-6 h-6 rounded-full bg-accent text-white">
                  <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </span>
              </a>
              <a
                href="#pricing"
                className="inline-flex items-center gap-2 rounded-full border border-border px-7 py-4 text-base font-medium text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
              >
                View Pricing
              </a>
            </div>

            <div className="mt-8 flex gap-6 text-xs text-muted-foreground/60">
              <span>From $149/mo</span>
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

/* ─── Marquee Social Proof ─────────────────────────────── */

const trades = [
  'HVAC', 'Plumbing', 'Electrical', 'Roofing',
  'Painting', 'Cleaning', 'Handyman', 'General Contracting',
  'Solar', 'Landscaping', 'Pest Control', 'Garage Doors',
];

const proofPoints = [
  'Austin, TX', 'Round Rock', 'Cedar Park', 'Georgetown',
  'San Marcos', 'Kyle', 'Pflugerville', 'Leander',
];

function Marquee() {
  return (
    <section className="py-10 overflow-hidden border-y border-border/20">
      <div className="space-y-3">
        <MarqueeRow items={trades} accent />
        <MarqueeRow items={proofPoints} reverse />
      </div>
    </section>
  );
}

/* ─── Services ─────────────────────────────────────────── */

const services = [
  {
    num: '01',
    title: 'Custom Design',
    desc: 'Mobile-first sites built for your trade and service area. No templates. Conversion-optimized from day one.',
  },
  {
    num: '02',
    title: 'Hosting & Maintenance',
    desc: 'SSL, uptime monitoring, security patches, software updates. All included. You never think about it.',
  },
  {
    num: '03',
    title: 'Revision Portal',
    desc: 'Your own URL. Submit changes, attach screenshots, track status. Done within 48 hours.',
  },
  {
    num: '04',
    title: 'SEO & Local Search',
    desc: 'Schema markup, Google Maps, meta tags, sitemap. We build you to rank in your service area.',
  },
  {
    num: '05',
    title: 'Review Automation',
    desc: 'Optional add-on: automated Google review campaigns, AI-personalized messages, smart review funnel.',
  },
];

function Services() {
  return (
    <section id="services" className="py-32 md:py-44 bg-foreground text-background overflow-hidden">
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
              Everything.
              <br />
              <span className="text-background/30">Managed.</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="mt-6 text-background/50 max-w-sm leading-relaxed"
            >
              One subscription replaces your web designer, hosting provider,
              and IT support. You focus on running jobs.
            </motion.p>
          </div>

          {/* Right — service rows */}
          <div className="space-y-0">
            {services.map((s, i) => (
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

/* ─── Stats data ────────────────────────────────────────── */

const pageStats = [
  { value: '$0', label: 'Upfront cost', detail: 'No deposits, no hidden fees' },
  { value: '48', suffix: 'hr', label: 'Turnaround', detail: 'Revisions completed fast' },
  { value: '99.9', suffix: '%', label: 'Uptime', detail: 'Your site stays online' },
  { value: '0', label: 'Lock-in contracts', detail: 'Cancel anytime, no penalties' },
];

/* ─── Process ──────────────────────────────────────────── */

const processSteps = [
  { title: 'Call', desc: '15 min. We learn your business, goals, and service area.' },
  { title: 'Design', desc: 'We build a custom site. You review and approve before launch.' },
  { title: 'Launch', desc: 'DNS, hosting, SSL — all handled. Your portal link is ready.' },
  { title: 'Revise', desc: 'Need changes? Submit via portal. Done within 48 hours.' },
];

function Process() {
  return (
    <section id="process" className="py-32 md:py-44 scroll-mt-20">
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <SectionDivider label="How It Works" className="mb-20" />

        <div className="grid md:grid-cols-4 gap-px bg-border/40 rounded-2xl overflow-hidden">
          {processSteps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="bg-background p-10 md:p-8 lg:p-10 group"
            >
              <span className="block text-[8rem] md:text-[6rem] lg:text-[8rem] font-black leading-none text-foreground/[0.04] select-none -mb-8 md:-mb-6 lg:-mb-8">
                {String(i + 1).padStart(2, '0')}
              </span>
              <h3 className="text-xl font-bold group-hover:text-accent transition-colors duration-300">
                {step.title}
              </h3>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                {step.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── Testimonials data ─────────────────────────────────── */

const pageTestimonials = [
  {
    quote: 'We picked up 35 new reviews in 6 weeks without me thinking about it. I just fill out a quick form after each job and AvisLoop handles the rest.',
    name: 'Mike Rodriguez',
    title: 'Rodriguez HVAC — Austin, TX',
  },
  {
    quote: 'A customer was about to leave a 2-star review. Instead it went to private feedback and we fixed the issue. Our Google rating has been 4.8 since we started.',
    name: 'Sarah Chen',
    title: 'Premier Plumbing — Round Rock, TX',
  },
  {
    quote: 'I was paying for another tool and never used it because it was too much work. This one runs in the background. Finish a job, log it, reviews come in.',
    name: 'James Thompson',
    title: 'Thompson Electric — Cedar Park, TX',
  },
];

/* ─── Pricing ──────────────────────────────────────────── */

const plans = [
  {
    name: 'Basic',
    price: '199',
    desc: 'Small service businesses',
    features: [
      '1–4 page custom website',
      'Mobile-optimized',
      'On-page SEO',
      '2 revisions / month',
      'Client portal',
      'Hosting & SSL included',
    ],
    dark: false,
    cta: 'Get Started',
  },
  {
    name: 'Advanced',
    price: '299',
    desc: 'Growing companies',
    features: [
      '4–10 page custom website',
      'Mobile-optimized',
      'Full SEO + local + Maps',
      '4 revisions / month',
      'Client portal',
      'Hosting & SSL included',
      'Lead capture forms',
      'Priority support',
    ],
    dark: true,
    cta: 'Get Started',
  },
  {
    name: 'Reviews',
    price: '99',
    desc: 'Add to any plan',
    features: [
      'Automated review campaigns',
      'AI-personalized messages',
      'Email + SMS',
      'Smart review funnel',
      'Competitor tracking',
    ],
    dark: false,
    cta: 'Learn More',
  },
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
            Simple
            <br />
            <span className="text-muted-foreground">pricing.</span>
          </h2>
        </motion.div>

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
              {plan.dark && (
                <span className="absolute -top-3 right-8 text-[10px] tracking-[0.2em] uppercase bg-accent text-white px-4 py-1 rounded-full font-semibold">
                  Popular
                </span>
              )}

              <span className={`text-xs tracking-[0.2em] uppercase font-medium ${plan.dark ? 'text-accent' : 'text-muted-foreground'}`}>
                {plan.name}
              </span>

              <div className="mt-4 mb-1">
                <span className="text-5xl font-black tracking-tight">${plan.price}</span>
                <span className={`text-base ml-1 ${plan.dark ? 'text-background/40' : 'text-muted-foreground'}`}>/mo</span>
              </div>
              <p className={`text-sm mb-8 ${plan.dark ? 'text-background/40' : 'text-muted-foreground'}`}>{plan.desc}</p>

              <ul className="space-y-3 flex-1">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-3">
                    <Check weight="bold" size={14} className="text-accent shrink-0 mt-0.5" />
                    <span className={`text-sm ${plan.dark ? 'text-background/70' : ''}`}>{f}</span>
                  </li>
                ))}
              </ul>

              <a
                href={plan.name === 'Reviews' ? '/reputation' : CALENDLY}
                target={plan.name === 'Reviews' ? undefined : '_blank'}
                rel={plan.name === 'Reviews' ? undefined : 'noopener noreferrer'}
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
      </div>
    </section>
  );
}

/* ─── FAQ data ──────────────────────────────────────────── */

const pageFaqs: [string, string][] = [
  ['Do I manage the website myself?', 'No. We handle hosting, updates, security, and content changes. You submit requests through your portal. We do everything else.'],
  ['How is this different from a one-time designer?', 'One-time design costs $3K–$15K upfront and goes stale immediately. We keep your site current every month for a flat fee.'],
  ['What if I need more revisions?', 'Additional revisions are $50 each, confirmed before we start. Or upgrade to Advanced for 4/month.'],
  ['Do I own my website?', 'Yes. Your domain, your content. If you cancel, we export everything.'],
  ['What businesses do you work with?', 'HVAC, plumbing, electrical, roofing, painting, cleaning, handyman, and general contracting.'],
  ['Can I cancel anytime?', 'Yes. No contracts, no fees. We earn your business every month.'],
];

/* ─── Final CTA ────────────────────────────────────────── */

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
          Let&apos;s build
          <br />
          <span className="text-accent">something.</span>
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
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
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
          15 min &middot; no commitment &middot; $0 upfront
        </motion.p>
      </div>
    </section>
  );
}

/* ─── Page ─────────────────────────────────────────────── */

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <V4Nav links={NAV_LINKS} calendlyUrl={CALENDLY} rightSlot={<ThemeSwitcher />} />
      <Hero />
      <Marquee />
      <Services />
      <V4Stats stats={pageStats} />
      <Process />
      <V4Testimonials testimonials={pageTestimonials} />
      <Pricing />
      <V4FAQ faqs={pageFaqs} />
      <FinalCTA />
      <V4Footer />
    </div>
  );
}
