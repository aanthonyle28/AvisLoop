import type { Metadata } from "next";
import { HeroV2 } from "@/components/marketing/v2/hero-v2";
import { SocialProofStrip } from "@/components/marketing/v2/social-proof-strip";
import { WhyAvisLoop } from "@/components/marketing/v2/features-bento";
import { ServicesSection } from "@/components/marketing/v2/services-section";
import { HowItWorksSection } from "@/components/marketing/v2/how-it-works";
import { AnimatedStatsSection } from "@/components/marketing/v2/animated-stats";
import { Testimonials } from "@/components/marketing/testimonials";
import { PricingSection } from "@/components/marketing/v2/pricing-section";
import { FAQSection } from "@/components/marketing/faq-section";
import { CTASection } from "@/components/marketing/cta-section";

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  title: "AvisLoop — Managed Google Review Service for Home Service Businesses",
  description:
    "AvisLoop manages your entire Google review strategy for $149/mo. Automated follow-ups, AI review responses, and review funnel protection. Built for HVAC, plumbing, electrical, and home service businesses in Austin.",
  keywords: [
    "google review management",
    "reputation management for contractors",
    "HVAC review service",
    "plumbing review management",
    "home service reviews",
    "google review automation",
    "review funnel",
    "Austin reputation management",
  ],
  openGraph: {
    title: "AvisLoop — Managed Google Review Service for Home Service Businesses",
    description:
      "We manage your entire Google review strategy. Automated follow-ups, AI responses, review funnel protection. 3x more reviews in 90 days for HVAC, plumbing, electrical, and home services.",
    url: baseUrl,
    siteName: "AvisLoop",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AvisLoop — Managed Google Review Service for Home Service Businesses",
    description:
      "We manage your entire Google review strategy. Automated follow-ups, AI responses, review funnel protection. 3x more reviews in 90 days for HVAC, plumbing, electrical, and home services.",
  },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "How does AvisLoop's managed review service work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We handle everything. After your free audit, we connect your Google Business Profile, build your review campaigns, and map your competitors. You just submit a quick form after each job — name, contact info, service type. We take it from there: automated follow-ups, AI review responses, and monthly performance reports.",
      },
    },
    {
      "@type": "Question",
      name: "What do I actually need to do as a business owner?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "One thing: fill out a short form after each job. It takes about ten seconds. That's your only involvement. We handle the campaigns, the timing, the follow-ups, and the review responses. You focus on running your business.",
      },
    },
    {
      "@type": "Question",
      name: "How does the review funnel protect my Google rating?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "When a customer clicks the review link, they rate their experience privately first. If they give 4-5 stars, they're redirected to leave a public Google review. If they give 1-3 stars, they see a private feedback form instead — so you can address the issue before it goes public. Only your best reviews make it to Google.",
      },
    },
    {
      "@type": "Question",
      name: "How many Google reviews can I expect?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Most businesses see new Google reviews within the first week. Our multi-touch campaigns follow up 2-3 times over several days, so response rates are significantly higher than a single ask. On average, clients triple their review count within 90 days.",
      },
    },
    {
      "@type": "Question",
      name: "Do you respond to Google reviews on my behalf?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Every review — positive or negative — gets a personalized, on-brand response drafted by AI and posted to your profile. Responding to reviews signals to Google that your business is active, which helps with local search rankings.",
      },
    },
    {
      "@type": "Question",
      name: "How is this different from other review management tools?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Most review tools are software you have to learn and run yourself. AvisLoop is a fully managed service — we set up your campaigns, configure your review funnel, track your competitors, and respond to every Google review. You never log into a dashboard or manage templates. We do it all for $149/month.",
      },
    },
    {
      "@type": "Question",
      name: "What types of home service businesses do you work with?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We work with HVAC companies, plumbers, electricians, roofers, painters, cleaning services, and general handyman businesses. Our campaigns and timing are configured specifically for each service type because a plumbing emergency and a routine AC maintenance need different follow-up strategies.",
      },
    },
    {
      "@type": "Question",
      name: "Can I cancel anytime?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. No contracts, no commitments. It's $149/month and you can cancel whenever you want. We keep it simple because we'd rather earn your business every month with results than lock you into an agreement.",
      },
    },
  ],
};

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
      <HeroV2 />
      <SocialProofStrip />
      <ServicesSection />
      <HowItWorksSection />
      <WhyAvisLoop />
      <AnimatedStatsSection />
      <Testimonials />
      <PricingSection />
      <FAQSection />
      <CTASection />
    </>
  );
}
