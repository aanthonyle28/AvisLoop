import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FadeIn } from '@/components/ui/fade-in';
import { Check, ShieldCheck } from '@phosphor-icons/react/dist/ssr';

const CALENDLY_URL =
  'https://calendly.com/anthony-le-avisloop/avisloop-demo-onboarding-call';

const basicFeatures = [
  '1–4 page professional website',
  'Mobile-optimized responsive design',
  'On-page SEO setup (meta tags, schema, sitemap)',
  'Google Business Profile optimization',
  '2 revision requests per month',
  'Client portal access',
  'Ongoing hosting and maintenance',
  'SSL certificate included',
  'Domain setup included',
];

const advancedFeatures = [
  '4–10 page professional website',
  'Mobile-optimized responsive design',
  'Full SEO setup (on-page, local SEO, Google Maps)',
  'Google Business Profile optimization',
  '4 revision requests per month',
  'Client portal access',
  'Ongoing hosting and maintenance',
  'SSL certificate included',
  'Domain setup included',
  'Contact form and lead capture',
  'Priority support',
];

const addonFeatures = [
  'Automated multi-touch review campaigns',
  'AI-personalized messages (email + SMS)',
  'Smart review funnel (4–5 stars → Google, 1–3 stays private)',
  'AI-written responses posted to Google',
  'Monthly performance reports',
  'Competitor tracking',
];

function FeatureList({ features }: { features: string[] }) {
  return (
    <ul className="space-y-3 flex-1">
      {features.map((feature) => (
        <li key={feature} className="flex items-start gap-3">
          <Check
            weight="bold"
            size={15}
            className="text-accent shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <span className="text-sm text-foreground leading-snug">{feature}</span>
        </li>
      ))}
    </ul>
  );
}

export function PricingWebDesign() {
  return (
    <section id="pricing" className="py-24 md:py-32 scroll-mt-20 bg-muted/30 border-y border-border/30">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <FadeIn direction="up">
          <div className="text-center max-w-xl mx-auto mb-14">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent mb-4">
              Pricing
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              Simple Monthly Pricing
            </h2>
            <p className="mt-3 text-muted-foreground">
              No setup fees. No contracts. Cancel anytime.
            </p>
          </div>
        </FadeIn>

        {/* Cards grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          {/* Card 1 — Basic */}
          <FadeIn direction="up" delay={80}>
            <div className="rounded-2xl border border-border/50 bg-card p-8 flex flex-col h-full">
              {/* Badge */}
              <div className="mb-6">
                <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                  Basic
                </span>
              </div>

              {/* Price */}
              <div className="mb-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-extrabold tracking-tight text-foreground">
                    $199
                  </span>
                  <span className="text-base text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  For small service businesses
                </p>
              </div>

              <div className="my-6 border-t border-border/30" />

              <FeatureList features={basicFeatures} />

              <div className="mt-8">
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="w-full"
                >
                  <Link
                    href={CALENDLY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Book a Call
                  </Link>
                </Button>
              </div>
            </div>
          </FadeIn>

          {/* Card 2 — Advanced (highlighted) */}
          <FadeIn direction="up" delay={160}>
            <div className="relative rounded-2xl border-2 border-accent bg-card p-8 flex flex-col h-full shadow-[0_4px_20px_rgba(217,119,6,0.12)]">
              {/* Best Value pill */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="inline-flex items-center rounded-full bg-accent px-4 py-1 text-xs font-semibold text-white shadow-sm">
                  Most Popular
                </span>
              </div>

              {/* Badge */}
              <div className="mb-6">
                <span className="inline-flex items-center rounded-full bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
                  Advanced
                </span>
              </div>

              {/* Price */}
              <div className="mb-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-extrabold tracking-tight text-foreground">
                    $299
                  </span>
                  <span className="text-base text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  For growing home service companies
                </p>
              </div>

              <div className="my-6 border-t border-border/30" />

              <FeatureList features={advancedFeatures} />

              <div className="mt-8">
                <Button
                  asChild
                  size="lg"
                  className="w-full bg-accent hover:bg-accent/90 text-white"
                >
                  <Link
                    href={CALENDLY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Book a Call
                  </Link>
                </Button>
              </div>
            </div>
          </FadeIn>

          {/* Card 3 — Review Add-On */}
          <FadeIn direction="up" delay={240}>
            <div className="rounded-2xl border border-border/50 bg-card p-8 flex flex-col h-full">
              {/* Badge */}
              <div className="mb-6">
                <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                  Add-On
                </span>
              </div>

              {/* Price */}
              <div className="mb-2">
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-extrabold tracking-tight text-foreground">
                    $99
                  </span>
                  <span className="text-base text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  Add to any plan
                </p>
              </div>

              <p className="text-sm text-foreground/80 mt-1 mb-2 leading-snug">
                Add Google review automation to your plan
              </p>

              <div className="my-6 border-t border-border/30" />

              <FeatureList features={addonFeatures} />

              <div className="mt-8 flex flex-col gap-3">
                <Button asChild size="lg" variant="outline" className="w-full">
                  <Link href="/reputation">Learn More</Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  className="w-full bg-accent hover:bg-accent/90 text-white"
                >
                  <Link
                    href={CALENDLY_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Book a Call
                  </Link>
                </Button>
              </div>
            </div>
          </FadeIn>
        </div>

        {/* Risk reversal */}
        <FadeIn direction="up" delay={320}>
          <div className="mt-10 flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck
              weight="fill"
              size={16}
              className="text-accent/60"
              aria-hidden="true"
            />
            <span>
              Free 15-minute call &middot; No commitment required &middot; Cancel
              anytime
            </span>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
