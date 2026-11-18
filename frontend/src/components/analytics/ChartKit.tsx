/**
 * Shared building blocks for the /trust analytics dashboard.
 *
 * Everything here keeps the editorial register of the rest of the site:
 * hairline rules instead of card shadows, tabular mono figures, oversized
 * display numerals and a near-monochrome chart palette with a single cyan
 * accent.
 */

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { animate, motion, useInView, useReducedMotion } from 'framer-motion';

/* ------------------------------------------------------------------ *
 * Palette — matches the site tokens in index.css
 * ------------------------------------------------------------------ */

export const HL = {
  paper: '#F3F0E9',
  ink: '#111110',
  inkMuted: 'rgba(17,17,16,0.55)',
  line: 'rgba(17,17,16,0.14)',
  lineSoft: 'rgba(17,17,16,0.08)',
  sunken: '#e8e7e1',
  /** Requested dashboard cyan. */
  cyan: '#A8DDE0',
  /** Existing site cyan, used for emphasis and interactive accents. */
  cyanDeep: '#14bfb9',
} as const;

/**
 * Near-monochrome ramp: ink through neutral greys into the cyan accent.
 * Keeps multi-category charts from looking like a rainbow SaaS palette.
 */
export const RAMP = [
  '#111110',
  '#3a3a37',
  '#5f5f5a',
  '#87877f',
  '#A8DDE0',
  '#14bfb9',
  '#cfe9e9',
] as const;

export function rampColor(index: number): string {
  return RAMP[index % RAMP.length];
}

/** Bezier used by the site's hero animation. */
export const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* ------------------------------------------------------------------ *
 * Axis / grid defaults
 * ------------------------------------------------------------------ */

export const AXIS_TICK = { fill: 'rgba(17,17,16,0.55)', fontSize: 11 };

export const GRID_STROKE = 'rgba(17,17,16,0.08)';

/* ------------------------------------------------------------------ *
 * Formatters
 * ------------------------------------------------------------------ */

const groupFormatter = new Intl.NumberFormat('en-US');

export function fullNumber(value: number): string {
  return groupFormatter.format(Math.round(value));
}

/** 1_161_340 → `1.2M`, 98_400 → `98.4K`, 812 → `812`. */
export function compactNumber(value: number): string {
  const abs = Math.abs(value);

  if (abs >= 1_000_000) {
    const short = (value / 1_000_000).toFixed(1);
    return `${short.endsWith('.0') ? short.slice(0, -2) : short}M`;
  }

  if (abs >= 10_000) {
    return `${Math.round(value / 1_000)}K`;
  }

  if (abs >= 1_000) {
    return `${(value / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  }

  return groupFormatter.format(Math.round(value));
}

/** 152 → `2m 32s`. */
export function durationLabel(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainder = Math.round(seconds % 60);
  return `${minutes}m ${String(remainder).padStart(2, '0')}s`;
}

export function percentLabel(value: number, digits = 1): string {
  return `${value.toFixed(digits)}%`;
}

/* ------------------------------------------------------------------ *
 * Motion
 * ------------------------------------------------------------------ */

export function useCountUp(target: number, active: boolean, duration = 1.1) {
  const [value, setValue] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!active) return;

    if (reduceMotion) {
      setValue(target);
      return;
    }

    const controls = animate(0, target, {
      duration,
      ease: EASE,
      onUpdate: (latest: number) => setValue(latest),
    });

    return () => controls.stop();
  }, [active, target, duration, reduceMotion]);

  return value;
}

/** Fades and lifts its children into place the first time they scroll in. */
export function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.12 });
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      className={className}
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 22 }}
      animate={
        inView
          ? { opacity: 1, y: 0 }
          : { opacity: reduceMotion ? 1 : 0, y: reduceMotion ? 0 : 22 }
      }
      transition={{ duration: 0.7, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ *
 * Data provenance
 * ------------------------------------------------------------------ */

export function DataSourceTag({
  source,
  className = '',
}: {
  source: 'database' | 'demo';
  className?: string;
}) {
  const isDemo = source === 'demo';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-mono-hl text-[10px] uppercase tracking-wider ${
        isDemo ? 'text-[#111110]/65' : 'text-[#14bfb9]'
      } ${className}`}
      title={
        isDemo
          ? 'Placeholder figures — not yet connected to a live integration.'
          : 'Live figures aggregated from the portfolio database.'
      }
    >
      <span
        aria-hidden="true"
        className={`h-1.5 w-1.5 rounded-full ${
          isDemo ? 'bg-[#A8DDE0]' : 'bg-[#14bfb9]'
        }`}
      />
      {isDemo ? 'demo' : 'live db'}
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * Layout primitives
 * ------------------------------------------------------------------ */

/** A ruled block with a mono heading and an optional right-hand meta line. */
export function Panel({
  title,
  meta,
  source,
  children,
  className = '',
}: {
  title: string;
  meta?: string;
  source?: 'database' | 'demo';
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`border-t border-[#111110]/14 pt-6 ${className}`}>
      <div className="mb-6 flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h3 className="font-mono-hl text-[11px] uppercase tracking-wider text-[#111110]/70">
          {title}
        </h3>
        <div className="flex items-center gap-4">
          {meta ? (
            <span className="font-mono-hl text-[11px] text-[#111110]/65">{meta}</span>
          ) : null}
          {source ? <DataSourceTag source={source} /> : null}
        </div>
      </div>
      {children}
    </section>
  );
}

/** Oversized figure used across the KPI rows. */
export function Stat({
  label,
  value,
  hint,
  source,
  emphasis = false,
}: {
  label: string;
  value: string;
  hint?: string;
  source?: 'database' | 'demo';
  emphasis?: boolean;
}) {
  return (
    <div className="flex flex-col gap-3 py-6">
      <div className="flex items-center justify-between gap-3">
        <span className="font-mono-hl text-[10px] uppercase tracking-wider text-[#111110]/65">
          {label}
        </span>
        {source ? <DataSourceTag source={source} /> : null}
      </div>
      <span
        className={`font-display font-light leading-[0.9] tracking-[-0.05em] tabular-nums ${
          emphasis
            ? 'text-[clamp(38px,4.4vw,62px)]'
            : 'text-[clamp(30px,3.2vw,46px)]'
        }`}
      >
        {value}
      </span>
      {hint ? (
        <span className="font-mono-hl text-[11px] text-[#111110]/65">{hint}</span>
      ) : null}
    </div>
  );
}

/** Thin bar used inside list-style breakdowns. */
export function MeterBar({
  ratio,
  color = HL.ink,
  className = '',
}: {
  ratio: number;
  color?: string;
  className?: string;
}) {
  const width = Math.max(0, Math.min(1, ratio)) * 100;

  return (
    <span
      aria-hidden="true"
      className={`relative block h-[3px] w-full overflow-hidden bg-[#111110]/10 ${className}`}
    >
      <span
        className="absolute inset-y-0 left-0 block transition-[width] duration-700 ease-out"
        style={{ width: `${width}%`, backgroundColor: color }}
      />
    </span>
  );
}

/** Cell wrapper for `gap-px` hairline grids. */
export function StatCell({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`bg-[#F3F0E9] px-4 sm:px-5 ${className}`}>{children}</div>;
}

/** `gap-px` grid that renders uniform hairlines between cells. */
export function StatGrid({
  children,
  columnsClass = 'grid-cols-2 lg:grid-cols-4',
}: {
  children: ReactNode;
  columnsClass?: string;
}) {
  return (
    <div className={`grid gap-px bg-[#111110]/14 ${columnsClass}`}>{children}</div>
  );
}

/** A stat that counts up from zero the first time it scrolls into view. */
export function CountStat({
  label,
  value,
  format = fullNumber,
  hint,
  source,
  emphasis = false,
}: {
  label: string;
  value: number;
  format?: (value: number) => string;
  hint?: string;
  source?: 'database' | 'demo';
  emphasis?: boolean;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const animated = useCountUp(value, inView);

  return (
    <div ref={ref}>
      <Stat
        label={label}
        value={format(animated)}
        hint={hint}
        source={source}
        emphasis={emphasis}
      />
    </div>
  );
}

/** Numbered section masthead, matching the site's editorial numbering. */
export function SectionHeading({
  index,
  title,
  caption,
  source,
}: {
  index: string;
  title: string;
  caption?: string;
  source?: 'database' | 'demo';
}) {
  return (
    <div className="mb-12">
      <div className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-3">
        <div className="flex items-baseline gap-4 sm:gap-6">
          <span className="font-mono-hl text-xs text-[#14bfb9]">({index})</span>
          <h2 className="font-display text-[clamp(30px,4.4vw,62px)] font-light uppercase leading-[0.94] tracking-[-0.05em]">
            {title}
          </h2>
        </div>
        {source ? <DataSourceTag source={source} /> : null}
      </div>
      {caption ? (
        <p className="mt-3 font-mono-hl text-[11px] uppercase tracking-wider text-[#111110]/60">
          {caption}
        </p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Chart tooltip
 * ------------------------------------------------------------------ */

export interface TooltipRow {
  name?: string | number;
  value?: number | string;
  dataKey?: string | number;
  color?: string;
}

/**
 * Editorial tooltip: flat paper, hairline border, no shadow or radius.
 * Passed to Recharts via `content={<ChartTooltip />}`.
 */
export function ChartTooltip({
  active,
  payload,
  label,
  formatValue,
  formatLabel,
}: {
  active?: boolean;
  payload?: TooltipRow[];
  label?: string | number;
  formatValue?: (value: number, dataKey: string) => string;
  formatLabel?: (label: string | number) => string;
}) {
  if (!active || !payload || payload.length === 0) return null;

  return (
    <div className="border border-[#111110]/20 bg-[#F3F0E9] px-3 py-2.5">
      {label !== undefined ? (
        <p className="font-mono-hl text-[10px] uppercase tracking-wider text-[#111110]/65">
          {formatLabel ? formatLabel(label) : label}
        </p>
      ) : null}
      <ul className="mt-2 space-y-1">
        {payload.map((row) => {
          const numeric = typeof row.value === 'number' ? row.value : Number(row.value ?? 0);
          const key = String(row.dataKey ?? row.name ?? '');

          return (
            <li
              key={key}
              className="flex items-center justify-between gap-5 text-[11px] text-[#111110]/80"
            >
              <span className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className="h-1.5 w-1.5 rounded-full"
                  style={{ backgroundColor: row.color ?? HL.ink }}
                />
                {row.name ?? key}
              </span>
              <span className="font-mono-hl tabular-nums text-[#111110]">
                {formatValue ? formatValue(numeric, key) : fullNumber(numeric)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
