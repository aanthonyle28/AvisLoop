'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, Star } from '@phosphor-icons/react';
import { GeometricMarker } from '@/components/ui/geometric-marker';

const STEPS = [
  { id: 1, label: 'Complete Job' },
  { id: 2, label: 'Auto-Enroll' },
  { id: 3, label: 'Reviews Roll In' },
];

export function AnimatedProductDemo() {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % STEPS.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative">
      {/* Main demo card */}
      <div className="rounded-2xl border border-border/50 bg-card shadow-2xl shadow-primary/5 p-6">
        {/* Browser chrome */}
        <div className="mb-4 flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-red-400" />
            <div className="h-3 w-3 rounded-full bg-yellow-400" />
            <div className="h-3 w-3 rounded-full bg-green-400" />
          </div>
        </div>

        {/* Header bar */}
        <div className="mb-6 flex items-center justify-between border-b border-border pb-3">
          <span className="text-sm font-medium text-muted-foreground">
            {STEPS[currentStep].label}
          </span>
          <span className="text-xs font-semibold text-foreground">AvisLoop</span>
        </div>

        {/* Step content area */}
        <div className="relative min-h-[200px]">
          {/* Step 1: Complete Job */}
          <div
            className={`motion-safe:transition-opacity motion-safe:duration-300 ${
              currentStep === 0 ? 'opacity-100' : 'absolute opacity-0'
            }`}
          >
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-lg border border-primary bg-primary/10 p-3">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary">
                  <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">James Cooper — AC Repair</p>
                  <p className="text-xs text-muted-foreground">HVAC • Completed just now</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted p-3">
                <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">Maria Garcia — Drain Repair</p>
                  <p className="text-xs text-muted-foreground">Plumbing • Scheduled</p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border border-border/50 bg-muted p-3">
                <div className="flex h-5 w-5 items-center justify-center rounded-full border-2 border-muted-foreground" />
                <div>
                  <p className="text-sm font-medium text-foreground">Sarah Mitchell — Panel Upgrade</p>
                  <p className="text-xs text-muted-foreground">Electrical • Scheduled</p>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Auto-Enroll */}
          <div
            className={`motion-safe:transition-opacity motion-safe:duration-300 ${
              currentStep === 1 ? 'opacity-100' : 'absolute opacity-0'
            }`}
          >
            <div className="space-y-4">
              <div className="rounded-lg border border-green-500/30 bg-green-500/5 p-3">
                <p className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">Campaign Enrolled</p>
                <p className="text-sm text-foreground font-medium">HVAC Follow-Up Campaign</p>
                <p className="text-xs text-muted-foreground mt-1">3 touches over 5 days</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-muted-foreground">Touch 1: Email in 24 hours</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                  <span className="text-muted-foreground">Touch 2: SMS in 3 days</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="h-2 w-2 rounded-full bg-muted-foreground/30" />
                  <span className="text-muted-foreground">Touch 3: Email in 5 days</span>
                </div>
              </div>
            </div>
          </div>

          {/* Step 3: Reviews Roll In */}
          <div
            className={`motion-safe:transition-opacity motion-safe:duration-300 ${
              currentStep === 2 ? 'opacity-100' : 'absolute opacity-0'
            }`}
          >
            <div className="flex flex-col items-center justify-center py-8">
              <CheckCircle size={64} className="text-green-500 mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">New Google Review!</h3>
              <div className="flex gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={16} weight="fill" className="text-yellow-400" />
                ))}
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-green-500/10 px-4 py-1.5 border border-green-500/20">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  5-star review posted
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-6 flex gap-2">
          {STEPS.map((step, index) => (
            <div
              key={step.id}
              className={`h-1.5 flex-1 rounded-full motion-safe:transition-colors motion-safe:duration-300 ${
                index === currentStep ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Floating stat card - top right */}
      <div className="absolute -top-4 -right-4 md:right-0 motion-safe:transform motion-safe:-rotate-3 motion-safe:hover:rotate-0 motion-safe:transition-transform motion-safe:duration-300 rounded-xl border border-border/50 bg-card shadow-lg p-4">
        <div className="flex items-center gap-2">
          <GeometricMarker variant="triangle" color="lime" size="md" />
          <div>
            <p className="text-2xl font-bold text-foreground">+47%</p>
            <p className="text-xs text-muted-foreground">More reviews</p>
          </div>
        </div>
      </div>

      {/* Floating review card - bottom left */}
      <div className="absolute -bottom-4 -left-4 md:left-0 motion-safe:transform motion-safe:rotate-2 motion-safe:hover:rotate-0 motion-safe:transition-transform motion-safe:duration-300 rounded-xl border border-border/50 bg-card shadow-lg p-4">
        <div className="flex gap-1 mb-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star key={star} size={16} weight="fill" className="text-yellow-400" />
          ))}
        </div>
        <p className="text-sm font-medium text-foreground mb-1">Excellent service!</p>
        <p className="text-xs text-muted-foreground">-- Sarah M.</p>
      </div>
    </div>
  );
}
