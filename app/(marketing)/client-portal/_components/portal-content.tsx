'use client';

import { motion } from 'framer-motion';
import { PencilSimple, ClockCounterClockwise, ListChecks } from '@phosphor-icons/react';
import { FloatingShapes, AccentBar } from '@/components/marketing/v4/shared';
import { ClientPortalLookup } from '@/components/marketing/v3/client-portal-lookup';

/* ─── Info blocks ───────────────────────────────────────── */

const infoBlocks = [
  {
    icon: PencilSimple,
    title: 'Submit Revisions',
    desc: 'Send your revision request with a title, description, and optional screenshot. We turn it around within 48 hours.',
  },
  {
    icon: ClockCounterClockwise,
    title: 'Track Progress',
    desc: 'See the status of every open request in real time — from submitted to in-progress to complete.',
  },
  {
    icon: ListChecks,
    title: 'View History',
    desc: 'Browse all past revision requests and our responses. A full record of your project collaboration.',
  },
];

/* ─── Root export ───────────────────────────────────────── */

export function PortalContent() {
  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden">
      <FloatingShapes />

      <div className="relative z-10 max-w-xl mx-auto px-6 py-24 md:py-36">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="mb-12"
        >
          <AccentBar className="mb-8" />
          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-[0.95] mb-4">
            Client Portal
          </h1>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
            Access your project, submit revision requests, and track progress.
          </p>
        </motion.div>

        {/* Lookup form */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <ClientPortalLookup />
        </motion.div>

        {/* Info blocks */}
        <div className="mt-16 grid gap-6">
          {infoBlocks.map((block, i) => {
            const Icon = block.icon;
            return (
              <motion.div
                key={block.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.6 + i * 0.1,
                  duration: 0.5,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="flex items-start gap-4"
              >
                <div className="shrink-0 flex items-center justify-center w-9 h-9 rounded-lg border border-border/40 bg-muted/40">
                  <Icon size={16} weight="duotone" className="text-accent" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold mb-1">{block.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {block.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Help text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="mt-12 text-center text-xs text-muted-foreground/60"
        >
          Don&apos;t have an account?{' '}
          <a
            href="mailto:anthony@avisloop.com"
            className="text-foreground/70 underline underline-offset-2 hover:text-foreground transition-colors"
          >
            Contact us
          </a>
        </motion.p>
      </div>
    </div>
  );
}
