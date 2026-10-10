import { PERSON } from '@/app/data/site';

/** Formatting helpers shared by the FYI listing, article and admin screens. */

const DAY = 24 * 60 * 60 * 1000;

/** "Oct 24, 2024" — the long form used in article bylines and admin tables. */
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

/** "Oct 24" — the short form used on listing cards. */
export function formatShortDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' });
}

/** "8 min read", matching the `read_time` column the API stores in minutes. */
export function formatReadTime(minutes: number | null | undefined): string {
  if (!minutes || minutes < 1) return '1 min read';
  return `${minutes} min read`;
}

/** "2 hours ago" / "in 3 days" for scheduled and recently saved posts. */
export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '—';

  const delta = date.getTime() - Date.now();
  const absolute = Math.abs(delta);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

  if (absolute < 60_000) return 'just now';
  if (absolute < 60 * 60_000) return rtf.format(Math.round(delta / 60_000), 'minute');
  if (absolute < DAY) return rtf.format(Math.round(delta / (60 * 60_000)), 'hour');
  if (absolute < 30 * DAY) return rtf.format(Math.round(delta / DAY), 'day');
  if (absolute < 365 * DAY) return rtf.format(Math.round(delta / (30 * DAY)), 'month');
  return rtf.format(Math.round(delta / (365 * DAY)), 'year');
}

/** Upload sizes, for the media library. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/** Author line for an article byline. */
export const AUTHOR = {
  name: PERSON.name,
  role: PERSON.jobTitle,
  initials: PERSON.name.slice(0, 1).toUpperCase(),
};

/**
 * Extracts a lead paragraph for excerpt fallbacks. Only used when the API
 * returns a post without an excerpt, which the schema allows to be null.
 */
export function firstSentences(html: string, max = 180): string {
  const text = html
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= max) return text;
  const clipped = text.slice(0, max);
  const lastSpace = clipped.lastIndexOf(' ');
  return `${clipped.slice(0, lastSpace > 40 ? lastSpace : max).trimEnd()}…`;
}
