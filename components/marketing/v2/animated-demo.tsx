'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import {
  CheckCircle,
  Star,
  Envelope,
  ChatCircle,
} from '@phosphor-icons/react';

const STEPS = [
  { id: 1, label: 'Complete Job' },
  { id: 2, label: 'Auto-Enroll' },
  { id: 3, label: 'Reviews Roll In' },
];

export function AnimatedProductDemo() {
  const [currentStep, setCurrentStep] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startAutoPlay = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % STEPS.length);
    }, 3000);
  }, []);

  const handleStepClick = useCallback(
    (index: number) => {
      setCurrentStep(index);
      startAutoPlay();
    },
    [startAutoPlay]
  );

  useEffect(() => {
    startAutoPlay();
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [startAutoPlay]);

  return (
    <div className="rounded-2xl border border-border/40 bg-card shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
      {/* Browser chrome */}
      <div className="flex items-center gap-1.5 px-5 pt-4 pb-3">
        <div className="h-2.5 w-2.5 rounded-full bg-border" />
        <div className="h-2.5 w-2.5 rounded-full bg-border" />
        <div className="h-2.5 w-2.5 rounded-full bg-border" />
      </div>
      <div className="mx-5 border-t border-border/30" />

      {/* Content */}
      <div className="px-5 pt-5 pb-6">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
            {STEPS[currentStep].label}
          </span>
          <span className="text-xs font-medium text-foreground/60">
            AvisLoop
          </span>
        </div>

        {/* Step content */}
        <div className="relative min-h-[210px]">
          {/* Step 1: Complete Job */}
          <div
            className={`motion-safe:transition-opacity motion-safe:duration-300 ${
              currentStep === 0 ? 'opacity-100' : 'absolute inset-0 opacity-0 pointer-events-none'
            }`}
          >
            <div className="space-y-2.5">
              {/* Active job */}
              <div className="flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3">
                <CheckCircle
                  size={20}
                  weight="light"
                  className="shrink-0 text-accent"
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    James Cooper — AC Repair
                  </p>
                  <p className="text-xs text-muted-foreground">
                    HVAC &middot; Completed just now
                  </p>
                </div>
              </div>

              {/* Pending jobs */}
              <div className="flex items-center gap-3 rounded-xl border border-border/30 bg-surface/50 px-4 py-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground/70">
                    Maria Garcia — Drain Repair
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Plumbing &middot; Scheduled
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-border/30 bg-surface/50 px-4 py-3">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-border" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground/70">
                    Sarah Mitchell — Panel Upgrade
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Electrical &middot; Scheduled
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Auto-Enroll */}
          <div
            className={`motion-safe:transition-opacity motion-safe:duration-300 ${
              currentStep === 1 ? 'opacity-100' : 'absolute inset-0 opacity-0 pointer-events-none'
            }`}
          >
            <div className="space-y-4">
              <div className="rounded-xl border border-green-500/20 bg-green-500/5 px-4 py-3.5">
                <p className="text-[11px] font-semibold uppercase tracking-widest text-green-600 dark:text-green-400">
                  Campaign Enrolled
                </p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  HVAC Follow-Up Campaign
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  3 touches over 5 days
                </p>
              </div>

              <div className="space-y-3 pl-1">
                <div className="flex items-center gap-3 text-sm">
                  <Envelope
                    size={16}
                    weight="light"
                    className="shrink-0 text-accent"
                  />
                  <span className="text-muted-foreground">
                    Touch 1: Email in 24 hours
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <ChatCircle
                    size={16}
                    weight="light"
                    className="shrink-0 text-muted-foreground/40"
                  />
                  <span className="text-muted-foreground/60">
                    Touch 2: SMS in 3 days
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Envelope
                    size={16}
                    weight="light"
                    className="shrink-0 text-muted-foreground/40"
                  />
                  <span className="text-muted-foreground/60">
                    Touch 3: Email in 5 days
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Reviews Roll In */}
          <div
            className={`motion-safe:transition-opacity motion-safe:duration-300 ${
              currentStep === 2 ? 'opacity-100' : 'absolute inset-0 opacity-0 pointer-events-none'
            }`}
          >
            <div className="flex flex-col items-center justify-center py-6">
              <CheckCircle
                size={48}
                weight="light"
                className="text-green-500 mb-4"
              />
              <p className="text-lg font-semibold text-foreground mb-2">
                New Google Review
              </p>
              <div className="flex gap-0.5 mb-3">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={16}
                    weight="fill"
                    className="text-amber-400"
                  />
                ))}
              </div>
              <div className="inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-green-500/5 px-4 py-1.5">
                <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                <span className="text-xs font-medium text-green-600 dark:text-green-400">
                  5-star review posted
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress: dots + labels */}
        <div className="mt-4 flex items-center justify-center gap-8" role="tablist" aria-label="Demo steps">
          {STEPS.map((step, index) => (
            <button
              key={step.id}
              type="button"
              role="tab"
              aria-selected={index === currentStep}
              aria-label={step.label}
              onClick={() => handleStepClick(index)}
              className="group flex flex-col items-center gap-1.5 focus-visible:outline-none"
            >
              <div
                className={`h-2 w-2 rounded-full motion-safe:transition-colors motion-safe:duration-300 focus-visible:ring-2 focus-visible:ring-ring ${
                  index === currentStep
                    ? 'bg-accent'
                    : 'bg-border group-hover:bg-muted-foreground/40'
                }`}
              />
              <span
                className={`text-[10px] tracking-wide motion-safe:transition-colors motion-safe:duration-300 ${
                  index === currentStep
                    ? 'font-medium text-foreground'
                    : 'text-muted-foreground/60'
                }`}
              >
                {step.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
