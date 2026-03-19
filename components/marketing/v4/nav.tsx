'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  motion,
  AnimatePresence,
  useScroll,
  useMotionValueEvent,
} from 'framer-motion';
import { ArrowRight, List, X } from '@phosphor-icons/react';

const DEFAULT_CALENDLY =
  'https://calendly.com/anthony-le-avisloop/avisloop-demo-onboarding-call';

const ACCENT = 'hsl(21 58% 53%)';

const DEFAULT_LINKS = [
  { label: 'Services', href: '#services' },
  { label: 'Process', href: '#process' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Reviews', href: '/reputation' },
  { label: 'FAQ', href: '#faq' },
];

interface NavProps {
  links?: { label: string; href: string }[];
  calendlyUrl?: string;
}

export function V4Nav({ links = DEFAULT_LINKS, calendlyUrl = DEFAULT_CALENDLY }: NavProps) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, 'change', (v) => setScrolled(v > 40));

  return (
    <>
      <motion.nav
        className="fixed top-0 inset-x-0 z-50 transition-colors duration-300"
        style={{
          backgroundColor: scrolled
            ? 'hsl(var(--background) / 0.85)'
            : 'transparent',
          backdropFilter: scrolled ? 'blur(16px)' : 'none',
          borderBottom: scrolled
            ? '1px solid hsl(var(--border) / 0.3)'
            : '1px solid transparent',
        }}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-6 lg:px-10">
          {/* Logo */}
          <Link href="/new" className="flex items-center gap-2.5">
            <svg viewBox="0 0 28 28" fill="none" className="w-6 h-6" aria-hidden="true">
              <path
                d="M13.9614 13.9428C13.9614 13.9428 15.6661 8.28761 13.1687 5.6657C9.39938 1.70861 2.46616 5.36825 1.25864 10.7178C1.06397 11.5803 0.964999 12.4675 1.01126 13.3511C1.39358 20.6533 9.24432 25.3666 16.2932 23.6446C17.7686 23.2841 19.1513 22.7512 20.2657 21.9762C27.8097 16.7301 26.9724 8.28761 26.9724 8.28761"
                stroke={ACCENT}
                strokeWidth="2"
              />
            </svg>
            <span className="text-lg font-bold tracking-tight">AvisLoop</span>
          </Link>

          {/* Desktop links */}
          <div className="hidden md:flex items-center gap-8">
            {links.map((l) => (
              <a
                key={l.label}
                href={l.href}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {l.label}
              </a>
            ))}
            <a
              href={calendlyUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-foreground text-background px-5 py-2 text-sm font-medium hover:bg-foreground/90 transition-colors"
            >
              Book a Call
              <ArrowRight size={14} />
            </a>
          </div>

          {/* Mobile toggle */}
          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden p-2 -mr-2"
            aria-label="Open menu"
          >
            <List size={22} />
          </button>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] bg-background flex flex-col"
          >
            <div className="flex items-center justify-between h-16 px-6">
              <span className="text-lg font-bold">AvisLoop</span>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-2 -mr-2"
                aria-label="Close menu"
              >
                <X size={22} />
              </button>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center gap-8">
              {links.map((l) => (
                <a
                  key={l.label}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className="text-3xl font-bold hover:text-accent transition-colors"
                >
                  {l.label}
                </a>
              ))}
              <a
                href={calendlyUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileOpen(false)}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-foreground text-background px-8 py-3 text-lg font-medium"
              >
                Book a Call <ArrowRight size={18} />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
