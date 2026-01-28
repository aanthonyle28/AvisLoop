import Link from "next/link";
import { Button } from "@/components/ui/button";

export function CTASection() {
  return (
    <section className="py-20">
      <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="bg-primary/5 rounded-2xl p-8 md:p-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold">
            Ready to get more reviews?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground max-w-xl mx-auto">
            Start with 25 free sends. No credit card required.
          </p>
          <div className="mt-8">
            <Button size="lg" asChild>
              <Link href="/auth/sign-up">Start Free Trial</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
