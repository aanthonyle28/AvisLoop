'use client';

import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';

/* ─── FloatingShapes ────────────────────────────────────── */

interface FloatingShapesProps {
  className?: string;
}

export function FloatingShapes({ className }: FloatingShapesProps) {
  return (
    <div
      className={`absolute inset-0 overflow-hidden pointer-events-none motion-reduce:hidden ${className ?? ''}`}
      aria-hidden="true"
    >
      {/* Gradient orbs — background layer (static, keep on all devices) */}
      <div className="absolute top-[8%] right-[5%] w-[45vw] h-[45vw] max-w-[650px] max-h-[650px] rounded-full bg-[hsl(21_58%_53%/0.12)] blur-[120px]" />
      <div className="absolute bottom-[0%] left-[0%] w-[35vw] h-[35vw] max-w-[500px] max-h-[500px] rounded-full bg-[hsl(38_85%_60%/0.08)] blur-[90px]" />

      {/* Animated shapes — hidden on mobile for performance */}
      <div className="hidden md:contents">
        {/* Large ring — top right */}
        <motion.div
          className="absolute top-[12%] right-[8%] w-44 h-44 rounded-full border-[2.5px] border-accent/25"
          animate={{
            y: [0, -25, 0],
            rotate: [0, 120, 0],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Filled accent circle */}
        <motion.div
          className="absolute top-[28%] right-[25%] w-5 h-5 rounded-full bg-accent/30"
          animate={{
            y: [0, 35, 0],
            x: [0, -20, 0],
          }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Tilting card shape */}
        <motion.div
          className="absolute bottom-[22%] right-[14%] w-32 h-32 rounded-2xl border-[2.5px] border-accent/15 bg-accent/[0.04]"
          animate={{
            y: [0, 18, 0],
            rotate: [15, -8, 15],
          }}
          transition={{ duration: 16, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Dot cluster — right */}
        <motion.div
          className="absolute top-[50%] right-[6%] flex gap-2.5"
          animate={{
            y: [0, -16, 0],
            opacity: [0.4, 0.8, 0.4],
          }}
          transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="w-2.5 h-2.5 rounded-full bg-accent/40" />
          <div className="w-2.5 h-2.5 rounded-full bg-accent/25" />
          <div className="w-2.5 h-2.5 rounded-full bg-accent/15" />
        </motion.div>

        {/* Large ring — bottom left */}
        <motion.div
          className="absolute bottom-[8%] left-[6%] w-56 h-56 rounded-full border-[2px] border-border/20"
          animate={{
            y: [0, 30, 0],
            rotate: [0, -80, 0],
            scale: [1, 1.06, 1],
          }}
          transition={{ duration: 24, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Diamond — upper left */}
        <motion.div
          className="absolute top-[20%] left-[12%] w-8 h-8 border-[2px] border-accent/30 bg-accent/[0.06]"
          style={{ borderRadius: 5 }}
          animate={{
            y: [0, -22, 0],
            rotate: [45, 135, 45],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Horizontal bar — mid left */}
        <motion.div
          className="absolute top-[42%] left-[4%] w-20 h-[3px] rounded-full bg-accent/25 origin-left"
          animate={{
            scaleX: [0.4, 1, 0.4],
            opacity: [0.3, 0.7, 0.3],
          }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Small circle — mid left */}
        <motion.div
          className="absolute top-[60%] left-[18%] w-3 h-3 rounded-full bg-accent/20"
          animate={{
            y: [0, 20, 0],
            x: [0, 10, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />

        {/* Cross / plus shape — right */}
        <motion.div
          className="absolute top-[38%] right-[16%]"
          animate={{
            rotate: [0, 180, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="relative w-6 h-6">
            <div className="absolute top-1/2 left-0 w-full h-[2.5px] -translate-y-1/2 bg-accent/30 rounded-full" />
            <div className="absolute left-1/2 top-0 h-full w-[2.5px] -translate-x-1/2 bg-accent/30 rounded-full" />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ─── AnimatedNumber ────────────────────────────────────── */

interface AnimatedNumberProps {
  value: string;
  suffix?: string;
}

export function AnimatedNumber({ value, suffix }: AnimatedNumberProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const [visible, setVisible] = useState(false);
  const [display, setDisplay] = useState(0);
  const numericPart = parseFloat(value.replace('$', ''));
  const hasPrefix = value.startsWith('$');

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    const end = numericPart;
    const duration = 1400;
    const start = performance.now();
    function tick(now: number) {
      const p = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Number((eased * end).toFixed(end % 1 !== 0 ? 1 : 0)));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [visible, numericPart]);

  return (
    <span ref={ref} className="tabular-nums">
      {hasPrefix && '$'}
      {visible ? (numericPart % 1 !== 0 ? display.toFixed(1) : display) : '0'}
      {suffix && <span className="text-accent">{suffix}</span>}
    </span>
  );
}

/* ─── MarqueeRow ────────────────────────────────────────── */

interface MarqueeRowProps {
  items: string[];
  reverse?: boolean;
  accent?: boolean;
}

export function MarqueeRow({ items, reverse = false, accent = false }: MarqueeRowProps) {
  // Triple the items so the strip is wide enough that the 50% translate produces a seamless loop
  const tripled = [...items, ...items, ...items];
  return (
    <div className="flex overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)] motion-reduce:overflow-x-auto">
      <motion.div
        className="flex shrink-0 gap-3 motion-reduce:animate-none"
        animate={{ x: reverse ? ['0%', '-33.333%'] : ['-33.333%', '0%'] }}
        transition={{ x: { duration: 60, repeat: Infinity, ease: 'linear' } }}
      >
        {tripled.map((item, i) => (
          <span
            key={`${item}-${i}`}
            className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-medium whitespace-nowrap transition-colors duration-300 ${
              accent
                ? 'border border-accent/25 text-accent/80 hover:bg-accent/10 hover:text-accent'
                : 'border border-border/30 text-muted-foreground/70 hover:border-accent/40 hover:text-accent'
            }`}
          >
            {item}
          </span>
        ))}
      </motion.div>
    </div>
  );
}

/* ─── AccentBar ─────────────────────────────────────────── */

interface AccentBarProps {
  delay?: number;
  className?: string;
}

export function AccentBar({ delay = 0, className }: AccentBarProps) {
  return (
    <motion.div
      initial={{ width: 0 }}
      whileInView={{ width: 48 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className={`h-[3px] bg-accent ${className ?? ''}`}
    />
  );
}

/* ─── SectionDivider ────────────────────────────────────── */

interface SectionDividerProps {
  label: string;
  className?: string;
}

export function SectionDivider({ label, className }: SectionDividerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6 }}
      className={`flex items-center gap-4 ${className ?? ''}`}
    >
      <div className="h-px flex-1 bg-border" />
      <span className="text-xs tracking-[0.3em] uppercase text-muted-foreground">
        {label}
      </span>
      <div className="h-px flex-1 bg-border" />
    </motion.div>
  );
}
