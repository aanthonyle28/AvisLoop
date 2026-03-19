'use client';

import { useState } from 'react';
import { CaretDown } from '@phosphor-icons/react';
import { cn } from '@/lib/utils';

const faqs = [
  {
    question: 'Do I need to manage the website myself?',
    answer:
      'No, we handle everything. You submit revision requests via your client portal and we implement them. You never touch hosting, code, or settings. Our entire job is to keep your site current so yours never has to be.',
  },
  {
    question: 'What if I need to make changes?',
    answer:
      'You get a dedicated client portal at a permanent URL. Submit your revision request — title, description, optional screenshot — and we complete it within 48 hours. Basic plan includes 2 revisions per month, Advanced includes 4.',
  },
  {
    question: 'How is this different from paying a web designer once?',
    answer:
      "One-time web design typically costs $3,000–$15,000 upfront. Our subscription model spreads the cost into manageable monthly payments and includes ongoing maintenance — so your site stays current without any additional invoices. You also get revision requests included every month.",
  },
  {
    question: 'What if I need more changes than my plan allows?',
    answer:
      'Additional revision requests beyond your monthly limit are available at $50 each, confirmed before submission so there are no surprise charges. You can also upgrade to Advanced any time to get 4 revisions per month.',
  },
  {
    question: 'Do I own my website?',
    answer:
      'Yes. Your domain, your content. We handle the technical side, but you own the assets. If you ever cancel, we provide an export of your site files so you are never locked in.',
  },
  {
    question: 'What types of home service businesses do you work with?',
    answer:
      'HVAC, plumbing, electrical, roofing, painting, cleaning, handyman, and general contracting. Our templates and copy frameworks are built specifically for home service businesses — not generic small business. We know how homeowners search for contractors and build sites accordingly.',
  },
  {
    question: 'What is the Review Add-On?',
    answer:
      'An optional $99/month add-on that plugs in automated review management. You get multi-touch email and SMS campaigns after each job, a smart review funnel (routes 4–5 star ratings to Google, keeps 1–3 star ratings private), and AI-generated responses posted to your Google profile.',
  },
  {
    question: 'Can I cancel anytime?',
    answer:
      'Yes. No contracts, no cancellation fees. We keep it simple because we would rather earn your business every month with results than lock you into anything.',
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
            'flex-shrink-0 text-muted-foreground transition-transform duration-200',
            isOpen && 'rotate-180'
          )}
          aria-hidden="true"
        />
      </button>
      <div
        className={cn(
          'overflow-hidden transition-all duration-300 ease-in-out',
          isOpen ? 'max-h-96 pb-6' : 'max-h-0'
        )}
      >
        <p className="text-muted-foreground leading-relaxed pr-8">{answer}</p>
      </div>
    </div>
  );
}

export function FAQWebDesign() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 md:py-28 scroll-mt-20">
      <div className="container mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent mb-4">
            FAQ
          </p>
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground text-balance">
            Common questions
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Everything you need to know before booking a call.
          </p>
        </div>

        <div className="divide-y divide-border/30">
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onToggle={() =>
                setOpenIndex(openIndex === index ? null : index)
              }
            />
          ))}
        </div>
      </div>
    </section>
  );
}
