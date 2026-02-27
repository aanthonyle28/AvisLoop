"use client";

import { useState } from "react";
import { CaretDown } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    question: "How does AvisLoop's managed review service work?",
    answer:
      "We handle everything. After your free audit, we connect your Google Business Profile, build your review campaigns, and map your competitors. You just submit a quick form after each job — name, contact info, service type. We take it from there: automated follow-ups, AI review responses, and monthly performance reports.",
  },
  {
    question: "What do I actually need to do as a business owner?",
    answer:
      "One thing: fill out a short form after each job. It takes about ten seconds. That's your only involvement. We handle the campaigns, the timing, the follow-ups, and the review responses. You focus on running your business.",
  },
  {
    question: "How does the review funnel protect my Google rating?",
    answer:
      "When a customer clicks the review link, they rate their experience privately first. If they give 4-5 stars, they're redirected to leave a public Google review. If they give 1-3 stars, they see a private feedback form instead — so you can address the issue before it goes public. Only your best reviews make it to Google.",
  },
  {
    question: "How many Google reviews can I expect?",
    answer:
      "Most businesses see new Google reviews within the first week. Our multi-touch campaigns follow up 2-3 times over several days, so response rates are significantly higher than a single ask. On average, clients triple their review count within 90 days.",
  },
  {
    question: "Do you respond to Google reviews on my behalf?",
    answer:
      "Yes. Every review — positive or negative — gets a personalized, on-brand response drafted by AI and posted to your profile. Responding to reviews signals to Google that your business is active, which helps with local search rankings.",
  },
  {
    question: "How is this different from other review management tools?",
    answer:
      "Most review tools are software you have to learn and run yourself. AvisLoop is a fully managed service — we set up your campaigns, configure your review funnel, track your competitors, and respond to every Google review. You never log into a dashboard or manage templates. We do it all for $149/month.",
  },
  {
    question: "What types of home service businesses do you work with?",
    answer:
      "We work with HVAC companies, plumbers, electricians, roofers, painters, cleaning services, and general handyman businesses. Our campaigns and timing are configured specifically for each service type because a plumbing emergency and a routine AC maintenance need different follow-up strategies.",
  },
  {
    question: "Can I cancel anytime?",
    answer:
      "Yes. No contracts, no commitments. It's $149/month and you can cancel whenever you want. We keep it simple because we'd rather earn your business every month with results than lock you into an agreement.",
  },
];

function FAQItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-border/30 last:border-b-0">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-6 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-lg"
        aria-expanded={isOpen}
      >
        <span className="font-medium pr-4">{question}</span>
        <CaretDown
          size={20}
          weight="bold"
          className={cn(
            "flex-shrink-0 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>
      <div
        className={cn(
          "overflow-hidden transition-all duration-300 ease-in-out",
          isOpen ? "max-h-96 pb-6" : "max-h-0"
        )}
      >
        <p className="text-muted-foreground leading-relaxed pr-8">{answer}</p>
      </div>
    </div>
  );
}

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 md:py-28 scroll-mt-20">
      <div className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-balance">
            Common questions
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Everything you need to know about AvisLoop.
          </p>
        </div>

        <div className="divide-y divide-border/30">
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onToggle={() => setOpenIndex(openIndex === index ? null : index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
