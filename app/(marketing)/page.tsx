import type { Metadata } from "next";
import { HeroV2 } from "@/components/marketing/v2/hero-v2";
import { SocialProofStrip } from "@/components/marketing/v2/social-proof-strip";
import { StatsSection } from "@/components/marketing/stats-section";
import { Features } from "@/components/marketing/features";
import { Testimonials } from "@/components/marketing/testimonials";
import { FAQSection } from "@/components/marketing/faq-section";
import { CTASection } from "@/components/marketing/cta-section";

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  title: "AvisLoop - Get 3× More Reviews Without Chasing Customers",
  description:
    "Send review requests in under 30 seconds. No complex campaigns, no forgotten follow-ups. Just simple requests that actually get sent. Start free today.",
  openGraph: {
    title: "AvisLoop - Get 3× More Reviews Without Chasing Customers",
    description:
      "Send review requests in under 30 seconds. No complex campaigns, no forgotten follow-ups. Just simple requests that actually get sent.",
    url: baseUrl,
    siteName: "AvisLoop",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AvisLoop - Get 3× More Reviews Without Chasing Customers",
    description:
      "Send review requests in under 30 seconds. No complex campaigns, no forgotten follow-ups. Just simple requests that actually get sent.",
  },
};

export default function LandingPage() {
  return (
    <>
      <HeroV2 />
      <SocialProofStrip />
      <Features />
      <StatsSection />
      <Testimonials />
      <FAQSection />
      <CTASection />
    </>
  );
}
