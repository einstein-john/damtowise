/**
 * Shared FYI UI primitives.
 *
 * Everything here is presentational: no data fetching, no business rules, no
 * knowledge of the API. The screens compose these, which is what keeps the
 * design system honest — a status pill looks the same on the blog, in the post
 * registry and in the editor's sidebar because it is the same component.
 *
 * The visual language comes from the exported Stitch designs
 * (`fyi_terminal_editorial/DESIGN.md`): obsidian surfaces, 1px strokes,
 * JetBrains Mono for anything the machine says, Inter for anything a human
 * wrote, thermal orange reserved for state rather than decoration.
 */

import React from 'react';
import { AlertTriangle, CheckCircle2, Info, Loader2, Search, type LucideIcon } from 'lucide-react';

/** Tiny class-name joiner: `cx('a', cond && 'b')`. */
export const cx = (...parts: Array<string | false | null | undefined>): string =>
  parts.filter(Boolean).join(' ');

/* ── Surfaces ─────────────────────────────────────────────────────────────── */

/** Standard card: `#0D0D0D` fill, 1px stroke, 8px radius, hover border glow. */
export function SurfaceCard({
  as: Tag = 'div',
  className,
  interactive = true,
  children,
  ...rest
}: {
  as?: 'div' | 'article' | 'section' | 'li' | 'aside';
  className?: string;
  interactive?: boolean;
  children: React.ReactNode;
} & React.HTMLAttributes<HTMLElement>) {
  return (
    <Tag
      className={cx(
        'rounded-lg border border-fyi-stroke bg-fyi-surface',
        interactive && 'transition-colors duration-200 hover:border-fyi-flame/50',
        className,
      )}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/**
 * The ambient backdrop: a warm halo behind the hero plus the design system's
 * halftone dot grid, masked so it fades out instead of ending.
 */
export function FyiBackdrop() {
  return (
    <div className="pointer-events-none absolute inset-x-0 -top-16 h-[580px] overflow-hidden opacity-25 [mask-image:radial-gradient(ellipse_60%_50%_at_50%_30%,#000_70%,transparent_100%)]">
      <svg className="h-full w-full text-fyi-flame" aria-hidden="true">
        <defs>
          <pattern id="fyi-halftone-dots" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="1.2" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#fyi-halftone-dots)" />
      </svg>
    </div>
  );
}

/** 1px directional gradient rule. Never a solid line — per the design system. */
export function HorizonRule({ className }: { className?: string }) {
  return (
    <div
      className={cx(
        'h-px w-full bg-gradient-to-r from-transparent via-fyi-flame/40 to-transparent',
        className,
      )}
      aria-hidden="true"
    />
  );
}

/**
 * macOS-style window chrome. Purely decorative, but it is the single most
 * recognisable element of the FYI look, so every terminal-looking surface uses
 * this one component.
 */
export function ChromeWindow({
  title,
  right,
  bodyClassName,
  children,
  className,
}: {
  title: React.ReactNode;
  right?: React.ReactNode;
  bodyClassName?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx('overflow-hidden rounded-lg border border-fyi-stroke bg-fyi-canvas', className)}
    >
      <div className="flex h-9 items-center justify-between border-b border-fyi-stroke bg-fyi-surface-low px-4">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#FF5F56]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#FFBD2E]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#27C93F]" />
        </div>
        <span className="truncate font-label text-label-sm text-fyi-ink-faint tracking-wide">
          {title}
        </span>
        <div className="flex min-w-10 items-center justify-end font-label text-label-sm text-fyi-ink-faint">
          {right}
        </div>
      </div>
      <div className={cx('p-4 font-code text-code-md leading-relaxed', bodyClassName)}>
        {children}
      </div>
    </div>
  );
}

/** A line of code with a gutter number, as the mockups render it. */
export function CodeLine({
  number,
  children,
  indent = 0,
  tone = 'default',
}: {
  number?: number;
  children: React.ReactNode;
  indent?: number;
  tone?: 'default' | 'accent' | 'muted' | 'value';
}) {
  const toneClass =
    tone === 'accent'
      ? 'text-fyi-flame'
      : tone === 'muted'
        ? 'text-fyi-ink-faint italic'
        : tone === 'value'
          ? 'text-fyi-flame-soft'
          : 'text-fyi-ink-dim';

  return (
    <div className="flex">
      {number !== undefined && (
        <span className="w-7 shrink-0 select-none pr-4 text-right text-fyi-ink-faint">
          {number}
        </span>
      )}
      <span
        className={cx('min-w-0', toneClass)}
        style={{ paddingLeft: indent ? `${indent}ch` : 0 }}
      >
        {children}
      </span>
    </div>
  );
}

/* ── Status ───────────────────────────────────────────────────────────────── */

/** Small pill. `tone` maps to the design system's three states. */
export function Pill({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: 'neutral' | 'flame' | 'muted';
  children: React.ReactNode;
  className?: string;
}) {
  const tones = {
    neutral: 'bg-fyi-surface-container text-fyi-ink-dim',
    flame: 'bg-fyi-flame/10 text-fyi-flame',
    muted: 'bg-fyi-well text-fyi-ink-faint',
  } as const;

  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 font-label text-label-sm',
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Live indicator: a pulsing dot plus a label. Used for system state only. */
export function LiveBadge({ label, className }: { label: React.ReactNode; className?: string }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-space-xs rounded-full border border-fyi-flame/30 bg-fyi-flame/10 px-3 py-1 text-fyi-flame',
        className,
      )}
    >
      <span className="fyi-pulse-dot h-1.5 w-1.5 rounded-full bg-fyi-flame" aria-hidden="true" />
      <span className="font-label text-label-sm uppercase tracking-wider">{label}</span>
    </span>
  );
}

const STATUS_TONES: Record<string, string> = {
  published: 'border-fyi-flame/30 bg-fyi-flame/10 text-fyi-flame',
  draft: 'border-fyi-stroke-strong bg-fyi-well text-fyi-ink-faint',
  scheduled: 'border-fyi-flame-soft/30 bg-fyi-flame-soft/10 text-fyi-flame-soft',
};

/** Draft / published / scheduled, with a leading dot in the same colour. */
export function StatusTag({ status }: { status: string }) {
  const tone = STATUS_TONES[status] ?? STATUS_TONES.draft;

  return (
    <span
      className={cx(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-label text-label-sm font-semibold capitalize',
        tone,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" aria-hidden="true" />
      {status}
    </span>
  );
}

/** Metric tile used by the admin registry header. */
export function StatTile({
  label,
  value,
  hint,
  delta,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  hint?: React.ReactNode;
  delta?: React.ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <SurfaceCard className="flex flex-col justify-between gap-space-md p-space-md">
      <div className="flex items-start justify-between gap-space-sm">
        <span className="font-label text-label-sm uppercase tracking-wider text-fyi-ink-faint">
          {label}
        </span>
        {Icon && (
          <span className="rounded bg-fyi-flame/10 p-1 text-fyi-flame">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
        )}
      </div>
      <div>
        <div className="font-display text-headline-lg font-bold text-fyi-ink">{value}</div>
        {(hint || delta) && (
          <div className="mt-space-xs flex items-center justify-between font-label text-label-sm text-fyi-ink-faint">
            <span>{hint}</span>
            <span className="text-fyi-flame">{delta}</span>
          </div>
        )}
      </div>
    </SurfaceCard>
  );
}

/* ── Controls ─────────────────────────────────────────────────────────────── */

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary:
    'bg-fyi-flame text-fyi-flame-deep hover:brightness-110 shadow-[0_0_16px_rgba(255,106,0,0.35)] font-semibold',
  secondary: 'bg-fyi-surface-high text-fyi-ink hover:bg-fyi-surface-highest',
  ghost: 'border border-fyi-stroke text-fyi-ink hover:border-fyi-flame hover:bg-fyi-flame/5',
  danger: 'border border-red-500/30 text-red-300 hover:bg-red-500/10',
};

export function FyiButton({
  variant = 'secondary',
  size = 'md',
  icon: Icon,
  className,
  children,
  ...rest
}: {
  variant?: ButtonVariant;
  size?: 'sm' | 'md';
  icon?: LucideIcon;
  children: React.ReactNode;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cx(
        'inline-flex items-center justify-center gap-space-xs rounded font-label text-label-md transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-40',
        size === 'sm' ? 'px-space-sm py-1' : 'px-space-md py-space-sm',
        BUTTON_VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      {Icon && <Icon className="h-4 w-4" aria-hidden="true" />}
      {children}
    </button>
  );
}

/** Renders as an anchor when `href` is set, so it stays a real link. */
export function FyiLinkButton({
  href,
  variant = 'secondary',
  className,
  children,
  ...rest
}: {
  href: string;
  variant?: ButtonVariant;
  children: React.ReactNode;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      href={href}
      className={cx(
        'inline-flex items-center justify-center gap-space-xs rounded font-label text-label-md transition-all duration-150',
        'px-space-md py-space-sm',
        BUTTON_VARIANTS[variant],
        className,
      )}
      {...rest}
    >
      {children}
    </a>
  );
}

export function FyiInput({ className, ...rest }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cx(
        'w-full rounded border border-fyi-stroke bg-fyi-well px-space-md py-space-sm font-body text-body-md text-fyi-ink',
        'placeholder:text-fyi-ink-faint focus:border-fyi-flame focus:outline-none focus:ring-2 focus:ring-fyi-flame/20',
        className,
      )}
      {...rest}
    />
  );
}

export function FyiTextarea({
  className,
  ref,
  ...rest
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { ref?: React.Ref<HTMLTextAreaElement> }) {
  return (
    <textarea
      ref={ref}
      className={cx(
        'w-full rounded border border-fyi-stroke bg-fyi-well px-space-md py-space-sm font-body text-body-md text-fyi-ink',
        'placeholder:text-fyi-ink-faint focus:border-fyi-flame focus:outline-none focus:ring-2 focus:ring-fyi-flame/20',
        className,
      )}
      {...rest}
    />
  );
}

export function FyiSelect({
  className,
  children,
  ...rest
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cx(
        'rounded border border-fyi-stroke bg-fyi-well px-space-sm py-1 font-label text-label-sm text-fyi-ink',
        'focus:border-fyi-flame focus:outline-none',
        className,
      )}
      {...rest}
    >
      {children}
    </select>
  );
}

/** Labelled control with an optional hint and character counter. */
export function FyiField({
  label,
  hint,
  counter,
  htmlFor,
  children,
}: {
  label: string;
  hint?: React.ReactNode;
  counter?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-space-xs">
      <div className="flex items-baseline justify-between gap-space-sm">
        <label
          htmlFor={htmlFor}
          className="font-label text-label-sm uppercase tracking-wider text-fyi-flame"
        >
          {label}
        </label>
        {counter && <span className="font-code text-label-sm text-fyi-ink-faint">{counter}</span>}
      </div>
      {children}
      {hint && <p className="font-body text-body-sm text-fyi-ink-faint">{hint}</p>}
    </div>
  );
}

export function FyiCheckbox({
  id,
  checked,
  onChange,
  label,
}: {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  return (
    <label
      htmlFor={id}
      className="flex items-center gap-space-sm font-label text-label-sm text-fyi-ink-dim"
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="h-4 w-4 rounded border-fyi-stroke bg-fyi-well accent-[#ff6a00]"
      />
      {label}
    </label>
  );
}
export function SearchField({
  value,
  onChange,
  placeholder,
  label,
  hotkeyHint = '⌘K',
  inputRef,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  label: string;
  hotkeyHint?: string | null;
  inputRef?: React.Ref<HTMLInputElement>;
}) {
  return (
    <div className="group relative w-full">
      <Search
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fyi-ink-faint transition-colors group-focus-within:text-fyi-flame"
        aria-hidden="true"
      />
      <label className="sr-only" htmlFor="fyi-search">
        {label}
      </label>
      <input
        id="fyi-search"
        ref={inputRef}
        type="search"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className={cx(
          'w-full rounded border border-fyi-stroke bg-fyi-well py-space-sm pl-9 pr-16 font-body text-body-md text-fyi-ink',
          'placeholder:text-fyi-ink-faint focus:border-fyi-flame focus:outline-none focus:ring-2 focus:ring-fyi-flame/20',
        )}
      />
      {hotkeyHint && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 rounded bg-fyi-surface-high px-1.5 py-0.5 font-label text-label-sm text-fyi-ink-faint">
          {hotkeyHint}
        </span>
      )}
    </div>
  );
}

/* ── Feedback ─────────────────────────────────────────────────────────────── */

export function Notice({
  tone = 'info',
  title,
  children,
  action,
}: {
  tone?: 'info' | 'error' | 'success';
  title?: React.ReactNode;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  const Icon = tone === 'error' ? AlertTriangle : tone === 'success' ? CheckCircle2 : Info;
  const tones = {
    info: 'border-fyi-stroke-strong bg-fyi-well text-fyi-ink-dim',
    error: 'border-red-500/30 bg-red-500/10 text-red-200',
    success: 'border-fyi-flame/30 bg-fyi-flame/10 text-fyi-flame',
  } as const;

  return (
    <div
      className={cx('flex items-start gap-space-sm rounded border p-space-md', tones[tone])}
      role={tone === 'error' ? 'alert' : 'status'}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <div className="flex-1 font-body text-body-sm leading-relaxed">
        {title && <p className="font-label text-label-md text-fyi-ink">{title}</p>}
        {children}
      </div>
      {action}
    </div>
  );
}

export function Loading({ label = 'Loading', className }: { label?: string; className?: string }) {
  return (
    <div className={cx('flex items-center gap-space-sm text-fyi-ink-faint', className)}>
      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
      <span className="font-label text-label-md">{label}</span>
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cx('animate-pulse rounded border border-fyi-stroke bg-fyi-well', className)}
      aria-hidden="true"
    />
  );
}

export function EmptyState({
  title,
  children,
  action,
}: {
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <SurfaceCard className="flex flex-col items-center gap-space-sm p-space-2xl text-center">
      <p className="font-display text-headline-sm text-fyi-ink">{title}</p>
      {children && <p className="max-w-md font-body text-body-md text-fyi-ink-dim">{children}</p>}
      {action}
    </SurfaceCard>
  );
}
