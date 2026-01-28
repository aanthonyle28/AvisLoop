import type { Metadata } from "next";
import { Hero } from "@/components/marketing/hero";
import { Features } from "@/components/marketing/features";
import { CTASection } from "@/components/marketing/cta-section";

const baseUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata: Metadata = {
  title: "AvisLoop - Simple Review Requests for Busy Businesses",
  description:
    "Request reviews with one click. No complex campaigns, no forgotten follow-ups. Just simple review requests that actually get sent.",
  openGraph: {
    title: "AvisLoop - Simple Review Requests for Busy Businesses",
    description:
      "Request reviews with one click. No complex campaigns, no forgotten follow-ups. Just simple review requests that actually get sent.",
    url: baseUrl,
    siteName: "AvisLoop",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AvisLoop - Simple Review Requests for Busy Businesses",
    description:
      "Request reviews with one click. No complex campaigns, no forgotten follow-ups. Just simple review requests that actually get sent.",
  },
};

export default function LandingPage() {
  return (
    <>
      <Hero />
      <Features />
      <CTASection />
    </>
  );
}
