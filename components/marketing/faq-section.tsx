"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const faqs = [
  {
    question: "How is AvisLoop different from other review platforms?",
    answer:
      "Most review platforms are built for marketing teams with time to spare. AvisLoop is built for busy business owners who need to request reviews quickly and move on. One contact, one click, done.",
  },
  {
    question: "What's included in the free tier?",
    answer:
      "You get 25 review request emails per month, contact management, a customizable email template, and full delivery tracking. No credit card required to start.",
  },
  {
    question: "Can I customize the review request email?",
    answer:
      "Yes! You can personalize the email subject, body text, and include your business name. The email is sent from our professional infrastructure to ensure high deliverability.",
  },
  {
    question: "Which review platforms can I link to?",
    answer:
      "You can link to any review platform — Google Business, Yelp, Facebook, TripAdvisor, industry-specific sites, or even your own website. Just add your review URL in settings.",
  },
  {
    question: "How do you prevent customers from being spammed?",
    answer:
      "We have built-in cooldown periods. Once you send a review request to a customer, you can't send another one for a set number of days. This protects your customer relationships.",
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
        <ChevronDown
          className={cn(
            "h-5 w-5 flex-shrink-0 text-muted-foreground transition-transform duration-200",
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
