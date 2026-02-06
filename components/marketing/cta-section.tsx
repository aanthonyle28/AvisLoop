import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto max-w-4xl px-4 text-center">
        <div className="border-t border-border/50 pt-20">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Start getting 3x more reviews today
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            10-second job entry. Automated follow-ups. No credit card required.
          </p>
          <Button size="lg" className="text-base px-8" asChild>
            <Link href="/auth/sign-up">
              Start My Free Trial
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
