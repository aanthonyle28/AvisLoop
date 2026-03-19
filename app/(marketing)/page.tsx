import type { Metadata } from "next";
import { HeroWebDesign } from "@/components/marketing/v3/hero-webdesign";
import { ServicesWebDesign } from "@/components/marketing/v3/services-webdesign";
import { ProcessSection } from "@/components/marketing/v3/process-section";
import { Testimonials } from "@/components/marketing/testimonials";
import { PricingWebDesign } from "@/components/marketing/v3/pricing-webdesign";
import { FAQWebDesign } from "@/components/marketing/v3/faq-webdesign";
import { CTASection } from "@/components/marketing/cta-section";

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  title: "AvisLoop — Web Design for Home Service Businesses | HVAC, Plumbing, Electrical",
  description:
    "Professional websites for HVAC, plumbing, electrical, and home service businesses. Starting at $199/month. No upfront cost, no contracts. Includes ongoing maintenance and a client portal for revision requests.",
  keywords: [
    "web design for home services",
    "HVAC website design",
    "plumbing company website",
    "electrician website",
    "home service website",
    "managed web design",
    "Austin web design agency",
  ],
  openGraph: {
    title: "AvisLoop — Web Design for Home Service Businesses | HVAC, Plumbing, Electrical",
    description:
      "Professional websites for HVAC, plumbing, electrical, and home service businesses. Starting at $199/month. No upfront cost, no contracts. Includes ongoing maintenance and a client portal for revision requests.",
    url: baseUrl,
    siteName: "AvisLoop",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AvisLoop — Web Design for Home Service Businesses | HVAC, Plumbing, Electrical",
    description:
      "Professional websites for HVAC, plumbing, electrical, and home service businesses. Starting at $199/month. No upfront cost, no contracts. Includes ongoing maintenance and a client portal for revision requests.",
  },
};

const webDesignFaqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Do I need to manage the website myself?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "No, we handle everything. You submit revision requests via your client portal and we implement them. You never touch hosting, code, or settings. Our entire job is to keep your site current so yours never has to be.",
      },
    },
    {
      "@type": "Question",
      name: "What if I need to make changes?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "You get a dedicated client portal at a permanent URL. Submit your revision request — title, description, optional screenshot — and we complete it within 48 hours. Basic plan includes 2 revisions per month, Advanced includes 4.",
      },
    },
    {
      "@type": "Question",
      name: "How is this different from paying a web designer once?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "One-time web design typically costs $3,000–$15,000 upfront. Our subscription model spreads the cost into manageable monthly payments and includes ongoing maintenance — so your site stays current without any additional invoices. You also get revision requests included every month.",
      },
    },
    {
      "@type": "Question",
      name: "What if I need more changes than my plan allows?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Additional revision requests beyond your monthly limit are available at $50 each, confirmed before submission so there are no surprise charges. You can also upgrade to Advanced any time to get 4 revisions per month.",
      },
    },
    {
      "@type": "Question",
      name: "Do I own my website?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Your domain, your content. We handle the technical side, but you own the assets. If you ever cancel, we provide an export of your site files so you are never locked in.",
      },
    },
    {
      "@type": "Question",
      name: "What types of home service businesses do you work with?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "HVAC, plumbing, electrical, roofing, painting, cleaning, handyman, and general contracting. Our templates and copy frameworks are built specifically for home service businesses — not generic small business. We know how homeowners search for contractors and build sites accordingly.",
      },
    },
    {
      "@type": "Question",
      name: "What is the Review Add-On?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "An optional $99/month add-on that plugs in automated review management. You get multi-touch email and SMS campaigns after each job, a smart review funnel (routes 4–5 star ratings to Google, keeps 1–3 star ratings private), and AI-generated responses posted to your Google profile.",
      },
    },
    {
      "@type": "Question",
      name: "Can I cancel anytime?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. No contracts, no cancellation fees. We keep it simple because we would rather earn your business every month with results than lock you into anything.",
      },
    },
  ],
};

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webDesignFaqSchema) }}
      />
      <HeroWebDesign />
      <ServicesWebDesign />
      <ProcessSection />
      <Testimonials />
      <PricingWebDesign />
      <FAQWebDesign />
      <CTASection />
    </>
  );
}
