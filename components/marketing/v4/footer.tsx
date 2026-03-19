'use client';

import Link from 'next/link';

const DEFAULT_LINKS = [
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Reviews', href: '/reputation' },
  { label: 'Client Portal', href: '/client-portal' },
];

interface FooterProps {
  links?: { label: string; href: string }[];
}

export function V4Footer({ links = DEFAULT_LINKS }: FooterProps) {
  return (
    <footer className="border-t border-border/20 py-12">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2.5">
          <svg viewBox="0 0 28 28" fill="none" className="w-5 h-5" aria-hidden="true">
            <path
              d="M13.9614 13.9428C13.9614 13.9428 15.6661 8.28761 13.1687 5.6657C9.39938 1.70861 2.46616 5.36825 1.25864 10.7178C1.06397 11.5803 0.964999 12.4675 1.01126 13.3511C1.39358 20.6533 9.24432 25.3666 16.2932 23.6446C17.7686 23.2841 19.1513 22.7512 20.2657 21.9762C27.8097 16.7301 26.9724 8.28761 26.9724 8.28761"
              stroke="currentColor"
              strokeWidth="2"
              className="text-muted-foreground/40"
            />
          </svg>
          <span className="text-sm text-muted-foreground/60">&copy; 2026 AvisLoop</span>
        </div>
        <div className="flex gap-6 text-sm text-muted-foreground/40">
          {links.map((l) => (
            <Link
              key={l.label}
              href={l.href}
              className="hover:text-foreground transition-colors"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </div>
    </footer>
  );
}
