import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FadeIn } from '@/components/ui/fade-in';
import { ArrowRight } from '@phosphor-icons/react/dist/ssr';

const CALENDLY_URL =
  'https://calendly.com/anthony-le-avisloop/avisloop-demo-onboarding-call';

const steps = [
  {
    number: 1,
    title: 'Book a Free Strategy Call',
    description:
      "We learn about your business, your service area, and what your current website — or lack of one — is costing you in missed calls and lost jobs.",
  },
  {
    number: 2,
    title: 'We Build Your Site',
    description:
      'Professional design configured for your service types and local market. You review the draft and approve before anything goes live.',
  },
  {
    number: 3,
    title: 'Go Live',
    description:
      'We deploy to your domain and handle all the technical setup — DNS, hosting, SSL. You get your client portal link and your site starts working for you.',
  },
  {
    number: 4,
    title: 'Submit Revisions Anytime',
    description:
      'Need to update hours, add a service, or change pricing? Submit a request through your portal. We handle it within 48 hours — no back-and-forth emails needed.',
  },
];

export function ProcessSection() {
  return (
    <section
      id="process"
      className="py-24 md:py-32 scroll-mt-20"
    >
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <FadeIn direction="up">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent mb-4">
              How It Works
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              Up and Running in Days, Not Months
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              From first call to live website faster than any traditional web
              agency — because we only work with home service businesses and
              know exactly what you need.
            </p>
          </div>
        </FadeIn>

        {/* Steps grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 mb-14">
          {steps.map((step, index) => (
            <FadeIn key={step.number} direction="up" delay={index * 80}>
              <div className="flex gap-5">
                {/* Number badge */}
                <div className="shrink-0">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-accent/10 border border-accent/25">
                    <span className="text-sm font-bold text-accent">
                      {step.number}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="pt-1.5">
                  <h3 className="font-semibold text-foreground mb-2">
                    {step.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* CTA */}
        <FadeIn direction="up" delay={320}>
          <div className="text-center">
            <Button
              asChild
              size="lg"
              className="bg-accent hover:bg-accent/90 text-white group"
            >
              <Link href={CALENDLY_URL} target="_blank" rel="noopener noreferrer">
                Book a Free Strategy Call
                <ArrowRight
                  size={16}
                  className="ml-1.5 group-hover:translate-x-0.5 transition-transform"
                  aria-hidden="true"
                />
              </Link>
            </Button>
            <p className="mt-3 text-xs text-muted-foreground">
              15 minutes &middot; No commitment &middot; Free
            </p>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
