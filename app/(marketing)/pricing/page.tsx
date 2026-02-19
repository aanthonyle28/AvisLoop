import type { Metadata } from "next";
import { PricingTable } from "@/components/marketing/pricing-table";

export const metadata: Metadata = {
  title: "Pricing - AvisLoop",
  description:
    "Simple, transparent pricing. Start with 25 free sends, upgrade as you grow. No hidden fees.",
  openGraph: {
    title: "Pricing - AvisLoop",
    description:
      "Simple, transparent pricing. Start with 25 free sends, upgrade as you grow.",
  },
};

export default function PricingPage() {
  return (
    <div className="container mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16">
      {/* Header */}
      <header className="text-center mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight mb-4">
          Simple, Transparent Pricing
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Start free, upgrade as you grow. No hidden fees.
        </p>
      </header>

      {/* Pricing table */}
      <PricingTable />

      {/* FAQ Section */}
      <section className="mt-20">
        <h2 className="text-2xl font-bold text-center mb-8">
          Frequently Asked Questions
        </h2>
        <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
          <div className="space-y-2">
            <h3 className="font-semibold">Can I switch plans?</h3>
            <p className="text-sm text-muted-foreground">
              Yes, you can upgrade or downgrade anytime. Changes take effect
              immediately and are prorated.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">What happens when my trial ends?</h3>
            <p className="text-sm text-muted-foreground">
              Your account remains active with all your data intact. You just
              cannot send more campaign touches until you subscribe.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">Do unused sends roll over?</h3>
            <p className="text-sm text-muted-foreground">
              No, send limits reset each month. This keeps pricing simple and
              predictable.
            </p>
          </div>
          <div className="space-y-2">
            <h3 className="font-semibold">Is there a contract?</h3>
            <p className="text-sm text-muted-foreground">
              No long-term contracts. All plans are month-to-month and you can
              cancel anytime.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
