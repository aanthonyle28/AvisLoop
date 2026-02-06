import type { Metadata } from "next";
import { HeroV2 } from "@/components/marketing/v2/hero-v2";
import { SocialProofStrip } from "@/components/marketing/v2/social-proof-strip";
import { ProblemSolutionSection } from "@/components/marketing/v2/problem-solution";
import { HowItWorksSection } from "@/components/marketing/v2/how-it-works";
import { OutcomeCardsSection } from "@/components/marketing/v2/outcome-cards";
import { AnimatedStatsSection } from "@/components/marketing/v2/animated-stats";
import { Testimonials } from "@/components/marketing/testimonials";
import { FAQSection } from "@/components/marketing/faq-section";
import { CTASection } from "@/components/marketing/cta-section";

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  title: "AvisLoop - Turn Completed Jobs Into Google Reviews Automatically",
  description:
    "Complete a job in 10 seconds. AvisLoop handles multi-touch follow-ups, review funnels, and timing optimization automatically. 3x more reviews for home service businesses.",
  openGraph: {
    title: "AvisLoop - Turn Completed Jobs Into Google Reviews Automatically",
    description:
      "Complete a job in 10 seconds. AvisLoop handles multi-touch follow-ups, review funnels, and timing automatically. Built for HVAC, plumbing, electrical, and home services.",
    url: baseUrl,
    siteName: "AvisLoop",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AvisLoop - Turn Completed Jobs Into Google Reviews Automatically",
    description:
      "Complete a job in 10 seconds. AvisLoop handles multi-touch follow-ups, review funnels, and timing automatically. Built for HVAC, plumbing, electrical, and home services.",
  },
};

export default function LandingPage() {
  return (
    <>
      <HeroV2 />
      <SocialProofStrip />
      <ProblemSolutionSection />
      <HowItWorksSection />
      <OutcomeCardsSection />
      <AnimatedStatsSection />
      <Testimonials />
      <FAQSection />
      <CTASection />
    </>
  );
}
