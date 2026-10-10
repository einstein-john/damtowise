import React from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, Clock, Mail, Terminal } from 'lucide-react';
import { Breadcrumbs } from '@/app/components/Breadcrumbs';
import { ROUTES } from '@/app/data/routes';
import { jsonLdFor } from '@/app/data/json-ld';
import { ADMIN_HOTKEY_LABEL } from '@/app/lib/fyi/config';
import { formatReadTime, formatShortDate } from '@/app/lib/fyi/format';
import { upsertJsonLd } from '@/app/lib/head-tags';
import { useFyiCatalog } from '@/app/lib/fyi/store';
import {
  ChromeWindow,
  CodeLine,
  EmptyState,
  FyiBackdrop,
  FyiButton,
  HorizonRule,
  LiveBadge,
  Loading,
  Notice,
  Pill,
  SearchField,
  SurfaceCard,
  cx,
} from '@/app/components/fyi/primitives';
import type { FyiPostSummary } from '@/app/lib/fyi/types';

/**
 * FYI — the blog index.
 *
 * A single page that reads three public endpoints (`/posts`, `/tags`,
 * `/worklog`) and renders the whole exported Stitch screen: hero, search +
 * tag filters, the featured deep dive, the recent-writing grid and the work-log
 * gallery. Search and filtering are local, because the whole catalogue
 * already fits in one payload — there is no reason to spend a round trip per
 * keystroke against a free-tier database.
 *
 * The page is prerendered at build time from the same API the client reads, so
 * `curl` gets real article titles and the hydration matches.
 */

const TOPICS = [
  {
    title: 'API design',
    body: 'REST and OpenAPI contracts, versioning, pagination, and the error shapes that keep clients from breaking.',
  },
  {
    title: 'Node.js services',
    body: 'Streaming, queues, backpressure and the observability work that decides whether a service survives production traffic.',
  },
  {
    title: 'n8n automation',
    body: 'Treating workflows as production code — versioned, retried, observable — instead of one-off glue.',
  },
  {
    title: 'TypeScript practice',
    body: 'Strictness, generics and the type-level techniques that catch real bugs before they reach a runtime.',
  },
];

/** Shown when the API is unreachable or has nothing published yet. */
function NoPosts() {
  return (
    <EmptyState
      title="Nothing published yet"
      action={
        <a
          href="/"
          className="mt-space-sm inline-flex items-center gap-space-xs font-label text-label-md text-fyi-flame hover:text-fyi-flame-soft"
        >
          Back to the portfolio
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </a>
      }
    >
      The first posts are being written up now. Until then, here is what the blog is going to cover
      — and the API behind it is already live.
    </EmptyState>
  );
}

function ArticleCard({ post, featured = false }: { post: FyiPostSummary; featured?: boolean }) {
  const href = `/fyi/${post.slug}/`;

  return (
    <article
      className={cx(
        'group flex flex-col justify-between gap-space-sm rounded-lg border border-fyi-stroke bg-fyi-canvas p-6 transition-colors duration-200 hover:border-fyi-flame/50 hover:bg-fyi-surface',
        featured && 'lg:p-8',
      )}
    >
      <div className="flex flex-col gap-space-sm">
        <div className="flex flex-wrap items-center justify-between gap-space-sm">
          <div className="flex flex-wrap items-center gap-1.5">
            {post.tags.slice(0, featured ? 3 : 2).map((tag) => (
              <Pill key={tag.id}>{tag.name}</Pill>
            ))}
          </div>
          <span className="font-label text-label-sm text-fyi-ink-faint">
            {formatShortDate(post.publishedAt)}
          </span>
        </div>

        <h3
          className={cx(
            'text-fyi-ink transition-colors group-hover:text-fyi-flame-soft',
            featured ? 'font-display text-headline-lg' : 'font-display text-headline-sm',
          )}
        >
          <a href={href}>{post.title}</a>
        </h3>

        {post.excerpt && (
          <p
            className={cx(
              'font-body text-fyi-ink-dim',
              featured ? 'text-body-lg' : 'text-body-sm',
              'line-clamp-3 leading-relaxed',
            )}
          >
            {post.excerpt}
          </p>
        )}
      </div>

      <div
        className={cx(
          'flex items-center justify-between font-label text-label-sm text-fyi-ink-faint',
          featured && 'pt-space-sm',
        )}
      >
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" aria-hidden="true" />
          {formatReadTime(post.readTime)}
        </span>
        <span className="inline-flex items-center gap-space-xs font-display text-headline-sm text-fyi-flame transition-transform group-hover:translate-x-1">
          Read
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </span>
      </div>
    </article>
  );
}

export function FyiPage() {
  const route = ROUTES.find((entry) => entry.path === '/fyi/');
  const { posts, tags, worklog, state, error, reload } = useFyiCatalog();

  const [query, setQuery] = React.useState('');
  const [activeTag, setActiveTag] = React.useState<string | null>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);

  // ⌘K focuses search, matching the behaviour the exported screen ships with.
  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const usedTags = React.useMemo(() => {
    const counts = new Map<string, number>();
    for (const post of posts)
      for (const tag of post.tags) counts.set(tag.slug, (counts.get(tag.slug) ?? 0) + 1);
    return tags
      .filter((tag) => counts.has(tag.slug))
      .map((tag) => ({ ...tag, count: counts.get(tag.slug) ?? 0 }));
  }, [posts, tags]);

  /**
   * Structured data for the listing.
   *
   * The prerendered document already carries a `Blog` + `ItemList` describing
   * every post the build resolved. After an in-app navigation, or once a live
   * fetch has replaced the embedded catalogue, this rewrites the same graph so
   * the live document never describes an archive the reader is not looking at.
   */
  React.useEffect(() => {
    if (posts.length === 0) return;
    const meta = ROUTES.find((entry) => entry.path === '/fyi/');
    if (meta) upsertJsonLd(jsonLdFor(meta, posts));
  }, [posts]);

  const visible = React.useMemo(() => {
    const needle = query.trim().toLowerCase();

    return posts.filter((post) => {
      const matchesTag = !activeTag || post.tags.some((tag) => tag.slug === activeTag);
      const matchesQuery =
        !needle ||
        post.title.toLowerCase().includes(needle) ||
        (post.excerpt ?? '').toLowerCase().includes(needle) ||
        post.tags.some((tag) => tag.name.toLowerCase().includes(needle));
      return matchesTag && matchesQuery;
    });
  }, [posts, query, activeTag]);

  const [featured, ...rest] = visible;
  const loading = state === 'loading' || state === 'idle';

  return (
    <>
      {route?.breadcrumb && <Breadcrumbs crumbs={route.breadcrumb} />}

      <section className="relative px-6 pt-16 pb-space-xl" aria-labelledby="fyi-title">
        <FyiBackdrop />

        <div className="relative mx-auto grid max-w-[1100px] grid-cols-1 items-center gap-space-xl lg:grid-cols-12">
          <div className="flex flex-col items-start gap-space-md lg:col-span-7">
            <LiveBadge label="FYI // developer notes" />

            <h1 id="fyi-title" className="font-display text-display text-fyi-ink">
              FYI: Notes &amp; <span className="text-fyi-flame">Build Logs</span>
            </h1>

            <p className="max-w-xl font-body text-body-lg leading-relaxed text-fyi-ink-dim">
              Technical deep dives, architecture decisions, and workflow automation experiments
              harvested directly from production systems.
            </p>

            <div className="flex flex-wrap items-center gap-space-md pt-space-xs font-code text-code-md text-fyi-ink-dim">
              <span className="flex items-center gap-1.5">
                <span className="text-fyi-flame">#</span> total_records: {posts.length}
              </span>
              <span className="text-fyi-surface-highest">•</span>
              <span className="flex items-center gap-1.5">
                <span className="text-fyi-flame">#</span> cadence: bi-weekly
              </span>
              <span className="text-fyi-surface-highest">•</span>
              <span className="flex items-center gap-1.5 text-fyi-flame">
                <Terminal className="h-4 w-4" aria-hidden="true" /> live kernel
              </span>
            </div>
          </div>

          <div className="relative lg:col-span-5">
            <div
              className="absolute -inset-2 rounded-xl bg-fyi-flame/15 blur-2xl"
              aria-hidden="true"
            />
            <ChromeWindow title="fyi-manifest.ts" right="api.damtowise.xyz">
              <CodeLine number={1} tone="muted">
                <span className="text-fyi-flame">interface</span>{' '}
                <span className="font-medium text-fyi-ink">BuildLog</span> {'{'}
              </CodeLine>
              <CodeLine number={2} indent={1}>
                topic: <span className="font-mono text-fyi-flame-soft">'automation'</span> |{' '}
                <span className="font-mono text-fyi-flame-soft">'backend'</span>;
              </CodeLine>
              <CodeLine number={3} indent={1}>
                runtime: <span className="font-mono text-fyi-flame-soft">'node@20-lts'</span>;
              </CodeLine>
              <CodeLine number={4} indent={1}>
                stack: [<span className="font-mono text-fyi-flame-soft">'Hono'</span>,{' '}
                <span className="font-mono text-fyi-flame-soft">'Drizzle'</span>,{' '}
                <span className="font-mono text-fyi-flame-soft">'Neon'</span>];
              </CodeLine>
              <CodeLine number={5} indent={1} tone="accent">
                guarantee: <span className="text-fyi-ink">"idempotent"</span>;
              </CodeLine>
              <CodeLine number={6}>{'}'}</CodeLine>
            </ChromeWindow>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1100px] px-6">
        <HorizonRule className="my-space-lg" />
      </div>

      <section className="mx-auto flex max-w-[1100px] flex-col gap-space-md px-6 py-space-md md:flex-row md:items-center md:justify-between">
        <div className="w-full md:w-96">
          <SearchField
            label="Search articles"
            value={query}
            onChange={setQuery}
            placeholder="Search articles, tags, workflows…"
            inputRef={searchRef}
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setActiveTag(null)}
            aria-pressed={activeTag === null}
            className={cx(
              'rounded-full px-3 py-1.5 font-label text-label-sm transition-all',
              activeTag === null
                ? 'bg-fyi-flame font-semibold text-fyi-flame-deep shadow-[0_0_10px_rgba(255,106,0,0.3)]'
                : 'bg-fyi-surface-low text-fyi-ink-dim hover:bg-fyi-surface-container hover:text-fyi-ink',
            )}
          >
            All
          </button>
          {usedTags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => setActiveTag(tag.slug === activeTag ? null : tag.slug)}
              aria-pressed={activeTag === tag.slug}
              className={cx(
                'whitespace-nowrap rounded-full px-3 py-1.5 font-label text-label-sm transition-all',
                activeTag === tag.slug
                  ? 'bg-fyi-flame font-semibold text-fyi-flame-deep shadow-[0_0_10px_rgba(255,106,0,0.3)]'
                  : 'bg-fyi-surface-low text-fyi-ink-dim hover:bg-fyi-surface-container hover:text-fyi-ink',
              )}
            >
              {tag.name}
            </button>
          ))}
        </div>
      </section>

      {error && state === 'error' && posts.length === 0 ? (
        <section className="mx-auto max-w-[1100px] px-6">
          <Notice
            tone="info"
            title="The blog API is not answering"
            action={
              <FyiButton size="sm" onClick={reload}>
                Retry
              </FyiButton>
            }
          >
            {error}
          </Notice>
        </section>
      ) : null}

      {loading ? (
        <section className="mx-auto max-w-[1100px] px-6 py-space-xl">
          <Loading label="Fetching published posts" />
        </section>
      ) : visible.length === 0 ? (
        <section className="mx-auto max-w-[1100px] px-6 py-space-xl">
          {posts.length === 0 ? (
            <NoPosts />
          ) : (
            <EmptyState title="No articles match that filter">
              Try a different tag, or clear the search box.
            </EmptyState>
          )}
        </section>
      ) : (
        <>
          {featured && (
            <section className="mx-auto mt-space-lg max-w-[1100px] px-6">
              <div className="relative overflow-hidden rounded-lg border border-fyi-stroke bg-fyi-canvas p-6 lg:p-8">
                <div
                  className="pointer-events-none absolute -bottom-24 -right-24 h-80 w-80 rounded-full bg-fyi-flame/10 blur-3xl"
                  aria-hidden="true"
                />
                <div className="relative grid grid-cols-1 items-center gap-space-lg lg:grid-cols-12">
                  <div className="lg:col-span-5">
                    {featured.coverImageUrl ? (
                      <img
                        src={featured.coverImageUrl}
                        alt={featured.title}
                        loading="lazy"
                        className="aspect-[3/2] w-full rounded-lg border border-fyi-stroke object-cover"
                      />
                    ) : (
                      <ChromeWindow
                        title="probe-validator.worker.ts"
                        right={<span className="text-fyi-flame">RUNNING</span>}
                      >
                        <p className="text-fyi-ink-dim">
                          <span className="text-fyi-flame">&gt;</span> scanner.init({' '}
                          <span className="font-mono text-fyi-flame-soft">'v2/contracts'</span> )
                        </p>
                        <p className="mt-1 text-fyi-ink-faint">✔ Schema verified</p>
                        <p className="text-fyi-ink-faint">✔ Latency p99: 41ms</p>
                      </ChromeWindow>
                    )}
                  </div>

                  <div className="flex flex-col items-start gap-space-sm lg:col-span-7">
                    <div className="flex flex-wrap items-center gap-2">
                      {featured.tags.map((tag) => (
                        <Pill key={tag.id}>{tag.name}</Pill>
                      ))}
                      <span className="ml-2 font-label text-label-sm font-semibold tracking-wider text-fyi-flame">
                        FEATURED DEEP DIVE
                      </span>
                    </div>
                    <h2 className="font-display text-headline-lg text-fyi-ink">
                      <a href={`/fyi/${featured.slug}/`} className="hover:text-fyi-flame-soft">
                        {featured.title}
                      </a>
                    </h2>
                    {featured.excerpt && (
                      <p className="font-body text-body-md leading-relaxed text-fyi-ink-dim">
                        {featured.excerpt}
                      </p>
                    )}
                    <div className="flex w-full flex-wrap items-center justify-between gap-space-sm pt-space-sm">
                      <div className="flex items-center gap-space-sm font-label text-label-md text-fyi-ink-faint">
                        <span className="flex items-center gap-1">
                          <CalendarDays className="h-4 w-4" aria-hidden="true" />
                          {formatShortDate(featured.publishedAt)}
                        </span>
                        <span aria-hidden="true">•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" aria-hidden="true" />
                          {formatReadTime(featured.readTime)}
                        </span>
                      </div>
                      <a
                        href={`/fyi/${featured.slug}/`}
                        className="inline-flex items-center gap-1.5 font-display text-headline-sm text-fyi-flame hover:text-fyi-flame-soft"
                      >
                        Read article
                        <ArrowRight className="h-4 w-4" aria-hidden="true" />
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          <section className="mx-auto mt-space-2xl max-w-[1100px] px-6">
            <div className="flex flex-col items-center gap-space-xs text-center">
              <h2 className="font-display text-headline-lg text-fyi-ink">
                Recent <span className="text-fyi-flame">Writing</span>
              </h2>
              <p className="max-w-lg font-body text-body-md text-fyi-ink-dim">
                Backend services, tooling, and pipeline architecture teardowns.
              </p>
            </div>

            <div className="mt-space-lg grid grid-cols-1 gap-space-md md:grid-cols-2 lg:grid-cols-3">
              {rest.map((post) => (
                <ArticleCard key={post.id} post={post} />
              ))}
            </div>
          </section>
        </>
      )}

      {worklog.length > 0 && (
        <section className="mx-auto mt-space-2xl flex max-w-[1100px] flex-col gap-space-lg px-6">
          <div className="flex flex-col gap-space-sm md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="font-display text-headline-lg text-fyi-ink">
                Work <span className="text-fyi-flame">Log</span>
              </h2>
              <p className="font-body text-body-md text-fyi-ink-dim">
                Production screenshots, workflow canvases and terminal benchmarks.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-space-md md:grid-cols-3">
            {worklog.slice(0, 3).map((item) => (
              <figure
                key={item.id}
                className="overflow-hidden rounded-lg border border-fyi-stroke bg-fyi-canvas transition-colors hover:border-fyi-flame/50"
              >
                {item.imageUrl ? (
                  <div className="h-48 overflow-hidden bg-fyi-surface-low">
                    <img
                      src={item.imageUrl}
                      alt={item.imageAlt ?? item.title}
                      loading="lazy"
                      width={item.imageWidth ?? undefined}
                      height={item.imageHeight ?? undefined}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-48 items-center justify-center bg-fyi-surface-low font-code text-code-md text-fyi-ink-faint">
                    no capture
                  </div>
                )}
                <figcaption className="flex flex-col gap-1 p-4">
                  <span className="font-display text-headline-sm text-fyi-ink">{item.title}</span>
                  {item.caption && (
                    <p className="font-body text-body-sm text-fyi-ink-dim">{item.caption}</p>
                  )}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto mt-space-2xl max-w-[1100px] px-6">
        <div className="relative overflow-hidden rounded-lg border border-fyi-stroke bg-fyi-canvas p-8">
          <div
            className="pointer-events-none absolute -top-12 right-12 h-32 w-96 bg-fyi-flame/10 blur-3xl"
            aria-hidden="true"
          />
          <div className="relative flex flex-col items-center justify-between gap-space-lg lg:flex-row">
            <div className="flex max-w-xl flex-col gap-space-xs">
              <div className="flex items-center gap-space-xs">
                <Mail className="h-5 w-5 text-fyi-flame" aria-hidden="true" />
                <h2 className="font-display text-headline-sm text-fyi-ink">
                  What FYI <span className="text-fyi-flame">will cover</span>
                </h2>
              </div>
              <ul className="grid gap-space-sm sm:grid-cols-2">
                {TOPICS.map((topic) => (
                  <li key={topic.title} className="font-body text-body-sm text-fyi-ink-dim">
                    <span className="text-fyi-flame">{topic.title}</span> — {topic.body}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Deliberately plain: the admin entry point is a chord, not a link. */}
      <p className="mx-auto mt-space-xl max-w-[1100px] px-6 text-center font-label text-label-sm text-fyi-ink-faint">
        Press{' '}
        <kbd className="rounded border border-fyi-stroke bg-fyi-well px-1.5 py-0.5 font-code text-label-sm text-fyi-ink-dim">
          {ADMIN_HOTKEY_LABEL}
        </kbd>{' '}
        anywhere on this site to open the writing console.{' '}
        <a
          href="/"
          className="inline-flex items-center gap-1 text-fyi-flame hover:text-fyi-flame-soft"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          Back to the portfolio
        </a>
      </p>
    </>
  );
}
