import { FadeIn } from '@/components/ui/fade-in';
import {
  Globe,
  Wrench,
  ArrowsCounterClockwise,
  Star,
  Layout,
  CurrencyDollarSimple,
} from '@phosphor-icons/react/dist/ssr';

const services = [
  {
    icon: Globe,
    title: 'Professional Website',
    description:
      'Custom-designed, mobile-optimized site built for your service area and built to convert visitors into calls. No generic templates.',
  },
  {
    icon: ArrowsCounterClockwise,
    title: 'Monthly Revision Requests',
    description:
      'Submit change requests through your client portal. Basic plans include 2 revisions per month; Advanced plans include 4. We turn them around within 48 hours.',
  },
  {
    icon: Wrench,
    title: 'Ongoing Maintenance',
    description:
      'Hosting, software updates, security patches, and technical management are all included in your monthly fee. Set it and forget it.',
  },
  {
    icon: Star,
    title: 'Review Automation Add-On',
    description:
      'Optional $99/month add-on: automated Google review campaigns, AI-personalized messages (email + SMS), and a smart review funnel that keeps negative feedback private.',
  },
  {
    icon: Layout,
    title: 'Client Portal',
    description:
      'Your own bookmarkable URL to submit revision requests, track ticket status, and see a record of everything we have completed for your site.',
  },
  {
    icon: CurrencyDollarSimple,
    title: 'No Upfront Cost',
    description:
      'No one-time design fees, no deposits, no surprise invoices. Your monthly subscription covers everything from initial build to ongoing maintenance.',
  },
];

export function ServicesWebDesign() {
  return (
    <section
      id="features"
      className="py-24 md:py-32 scroll-mt-20 bg-muted/30 border-y border-border/30"
    >
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <FadeIn direction="up">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent mb-4">
              What&apos;s Included
            </p>
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
              Everything Your Website Needs, Managed For You
            </h2>
            <p className="mt-4 text-muted-foreground leading-relaxed">
              One monthly subscription covers design, hosting, maintenance, and
              revisions — so you can focus on running jobs, not managing a
              website.
            </p>
          </div>
        </FadeIn>

        {/* Feature grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <FadeIn key={service.title} direction="up" delay={index * 60}>
                <div className="rounded-xl border border-border/40 bg-card p-6 h-full flex flex-col gap-4 hover:border-accent/30 hover:shadow-sm transition-all duration-200">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-accent/10 shrink-0">
                    <Icon
                      size={20}
                      weight="duotone"
                      className="text-accent"
                      aria-hidden="true"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1.5">
                      {service.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {service.description}
                    </p>
                  </div>
                </div>
              </FadeIn>
            );
          })}
        </div>
      </div>
    </section>
  );
}
