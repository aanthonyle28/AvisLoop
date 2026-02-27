import Link from 'next/link';
import { Button } from '@/components/ui/button';

export function CTASection() {
  return (
    <section className="py-24 md:py-32">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-primary px-6 py-16 md:px-12 md:py-24 text-center">
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-primary-foreground mb-6">
            Your next customer is reading your reviews right now.
          </h2>

          <p className="text-primary-foreground/60 text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
            In 15 minutes, we&apos;ll audit your Google profile, map your
            top competitors, and show you exactly how many reviews you need
            to close the gap. No pitch, no pressure.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              size="lg"
              className="bg-accent hover:bg-accent/90 text-white motion-safe:hover:-translate-y-0.5"
              asChild
            >
              <Link href="/#pricing">Book Your Free Reputation Audit</Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10 bg-transparent"
              asChild
            >
              <Link href="#pricing">See Pricing</Link>
            </Button>
          </div>

          <p className="text-primary-foreground/40 text-xs mt-8 tracking-wide">
            Takes 15 minutes &middot; No commitment &middot; Cancel anytime
          </p>
        </div>
      </div>
    </section>
  );
}
