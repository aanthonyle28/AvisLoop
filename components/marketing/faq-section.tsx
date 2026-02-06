"use client";

import { useState } from "react";
import { CaretDown } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    question: "How is AvisLoop different from other review platforms?",
    answer:
      "Other platforms require you to manually send each review request. AvisLoop is automation-first: complete a job, and the system handles everything—multi-touch follow-ups, timing optimization, review funnels. You spend 10 seconds per job, not 10 minutes per customer.",
  },
  {
    question: "What happens after I complete a job?",
    answer:
      "AvisLoop automatically creates a customer record (if new) or links to existing customer, finds the campaign matching your service type (HVAC, plumbing, etc.), and schedules 2-3 follow-up touches over 3-5 days. The first message sends 24-72 hours after job completion (varies by service). You don't do anything else.",
  },
  {
    question: "What's a campaign and do I need to set one up?",
    answer:
      "Campaigns are pre-built multi-touch sequences. During onboarding, you choose a preset (Fast, Standard, or Slow) and AvisLoop creates campaigns for each service type you offer. These run automatically—you never manually trigger a campaign. Just complete jobs.",
  },
  {
    question: "What's the review funnel and why does it matter?",
    answer:
      "The review funnel protects your Google rating. When a customer clicks your review link, they rate their experience 1-5 stars privately first. 4-5 stars redirects to Google for a public review. 1-3 stars shows a private feedback form so you can fix the issue before it goes public.",
  },
  {
    question: "Do I need to import my customer list?",
    answer:
      "No. AvisLoop creates customers automatically when you complete jobs. Most businesses start with zero customers and build their list organically as they work. Customer import is optional—not the primary workflow.",
  },
  {
    question: "Is my customer data safe?",
    answer:
      "Absolutely. All data is encrypted in transit and at rest. We never share or sell your customer information. Your data stays yours.",
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
