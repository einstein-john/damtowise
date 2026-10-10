import React from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, Clock, List } from 'lucide-react';
import { AUTHOR, formatDate, formatReadTime } from '@/app/lib/fyi/format';
import { applyRouteHead } from '@/app/lib/head-tags';
import { articleJsonLdFor, articleRouteMeta } from '@/app/data/json-ld';
import { useFyiCatalog, useFyiPost } from '@/app/lib/fyi/store';
import { fyiSlugFromPath } from '@/app/data/routes';
import {
  EmptyState,
  HorizonRule,
  Notice,
  Pill,
  Skeleton,
  SurfaceCard,
} from '@/app/components/fyi/primitives';

/**
 * FYI article page.
 *
 * Renders `/fyi/<slug>/` from the sanitised HTML the API stored at publish
 * time — the site never runs a Markdown renderer in the browser, so what a
 * reader sees is exactly what the publish pipeline sanitised.
 *
 * The document itself is prerendered at build time (one HTML file per
 * published post), and the same payload is embedded in the page so hydration
 * matches on a cold load. Navigating here from the index fetches instead.
 */

/** Sticky table of contents, built from the headings the API extracted. */
function TableOfContents({ toc }: { toc: Array<{ depth: number; slug: string; text: string }> }) {
  if (toc.length === 0) return null;

  return (
    <SurfaceCard as="aside" className="p-space-md">
      <p className="flex items-center gap-space-xs font-label text-label-sm uppercase tracking-wider text-fyi-ink-faint">
        <List className="h-4 w-4 text-fyi-flame" aria-hidden="true" />
        Table of contents
      </p>
      <nav aria-label="Table of contents" className="mt-space-sm">
        <ul className="flex list-none flex-col gap-1.5 p-0">
          {toc.map((entry) => (
            <li
              key={entry.slug}
              style={{ paddingLeft: entry.depth > 2 ? `${(entry.depth - 2) * 12}px` : 0 }}
            >
              <a
                href={`#${entry.slug}`}
                className="font-body text-body-sm text-fyi-ink-dim hover:text-fyi-flame"
              >
                {entry.text}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </SurfaceCard>
  );
}

export function FyiArticlePage({ path }: { path: string }) {
  const slug = fyiSlugFromPath(path);
  const { post, state, error } = useFyiPost(slug);
  const { posts } = useFyiCatalog();

  // Head tags for a route whose metadata only exists once its post loads. The
  // prerenderer wrote the same tags into the static document, so this is a
  // no-op on a cold load and only matters for in-app navigation.
  React.useEffect(() => {
    if (!post) return;
    applyRouteHead(articleRouteMeta(post), articleJsonLdFor(post));
  }, [post]);

  if (state === 'loading') {
    return (
      <div className="mx-auto max-w-[1100px] px-6 py-space-2xl">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="mt-space-md h-12 w-full max-w-2xl" />
        <Skeleton className="mt-space-2xl h-64 w-full" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-space-2xl">
        <Notice tone="error" title="Article unavailable">
          {error ?? 'That article could not be loaded.'}
        </Notice>
        <div className="mt-space-lg">
          <a
            href="/fyi/"
            className="inline-flex items-center gap-space-xs font-label text-label-md text-fyi-flame hover:text-fyi-flame-soft"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to FYI
          </a>
        </div>
      </div>
    );
  }

  const related = posts.filter((entry) => entry.slug !== post.slug).slice(0, 3);

  return (
    <>
      <article className="mx-auto max-w-[1100px] px-6 py-space-xl">
        <div className="mb-space-xl flex flex-col gap-space-md">
          {/* Rendered breadcrumbs, not just a back link: a crawler and a
              screen reader both need the path to the article, and Google shows
              a `BreadcrumbList` trail in the result when the page renders it. */}
          <nav aria-label="Breadcrumb" className="font-label text-label-sm text-fyi-ink-faint">
            <ol className="flex list-none flex-wrap items-center gap-space-xs p-0">
              <li>
                <a href="/" className="transition-colors hover:text-fyi-flame">
                  Home
                </a>
              </li>
              <li aria-hidden="true">/</li>
              <li>
                <a href="/fyi/" className="transition-colors hover:text-fyi-flame">
                  FYI
                </a>
              </li>
              <li aria-hidden="true">/</li>
              <li aria-current="page" className="text-fyi-ink-dim">
                {post.title}
              </li>
            </ol>
          </nav>

          <div className="flex items-center justify-between gap-space-md">
            <a
              href="/fyi/"
              className="group inline-flex items-center gap-space-xs font-code text-code-md text-fyi-ink-dim transition-colors hover:text-fyi-flame"
            >
              <span className="text-fyi-flame transition-transform group-hover:-translate-x-1">
                ←
              </span>
              Back to FYI
              <span className="font-code text-code-md text-fyi-ink-faint">/ technical_logs</span>
            </a>

            {post.noindex && (
              <span className="font-label text-label-sm text-fyi-ink-faint">
                Draft preview · not indexed
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-space-xs">
            {post.tags.map((tag) => (
              <Pill key={tag.id}>{tag.name}</Pill>
            ))}
          </div>

          <h1 className="font-display text-headline-lg text-fyi-ink">{post.title}</h1>

          <div className="flex flex-wrap items-center gap-space-lg border-y border-fyi-stroke py-space-sm font-code text-code-md text-fyi-ink-dim">
            <div className="flex items-center gap-space-sm">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-fyi-surface-high font-display text-headline-sm text-fyi-flame">
                {AUTHOR.initials}
              </span>
              <span className="font-body text-body-md font-medium text-fyi-ink">{AUTHOR.name}</span>
              <span className="font-code text-code-md text-fyi-ink-faint">({AUTHOR.role})</span>
            </div>

            <div className="flex items-center gap-space-md text-fyi-ink-faint">
              <span className="flex items-center gap-1">
                <CalendarDays className="h-4 w-4 text-fyi-flame" aria-hidden="true" />
                {/* React's type wants `dateTime`; browsers parse attribute names
                    case-insensitively, so this is the standard idiom. */}
                <time dateTime={post.publishedAt ?? post.updatedAt}>
                  {formatDate(post.publishedAt ?? post.updatedAt)}
                </time>
              </span>
              <span aria-hidden="true">•</span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4 text-fyi-flame" aria-hidden="true" />
                {formatReadTime(post.readTime)}
              </span>
            </div>
          </div>
        </div>

        {post.coverImageUrl && (
          <img
            src={post.coverImageUrl}
            alt={post.title}
            className="mb-space-2xl aspect-[1200/630] w-full rounded-lg border border-fyi-stroke object-cover"
          />
        )}

        <div className="grid grid-cols-1 items-start gap-space-xl lg:grid-cols-12">
          <div className="min-w-0 lg:col-span-8">
            {/* Sanitised server-side by the publish pipeline; see lib/markdown
                in the FYI API for the exact allow-list this HTML went through. */}
            <div className="fyi-prose" dangerouslySetInnerHTML={{ __html: post.contentHtml }} />

            <HorizonRule className="my-space-2xl" />

            <div className="flex flex-wrap items-center justify-between gap-space-md">
              <a
                href="/fyi/"
                className="inline-flex items-center gap-space-xs font-label text-label-md text-fyi-flame hover:text-fyi-flame-soft"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                All articles
              </a>
              <a
                href="/rss.xml"
                className="font-label text-label-sm text-fyi-ink-faint hover:text-fyi-flame"
              >
                Subscribe via RSS
              </a>
            </div>
          </div>

          <div className="flex flex-col gap-space-lg lg:col-span-4 lg:sticky lg:top-24">
            <TableOfContents toc={post.toc} />

            <SurfaceCard className="flex flex-col gap-space-xs p-space-md">
              <span className="font-label text-label-sm uppercase tracking-wider text-fyi-ink-faint">
                Published
              </span>
              <span className="font-display text-headline-sm text-fyi-ink">
                {formatDate(post.publishedAt)}
              </span>
              <span className="font-body text-body-sm text-fyi-ink-dim">
                {formatReadTime(post.readTime)} · {post.tags.length} tag
                {post.tags.length === 1 ? '' : 's'}
              </span>
            </SurfaceCard>
          </div>
        </div>
      </article>

      {related.length > 0 && (
        <section className="mx-auto max-w-[1100px] px-6 pb-space-2xl">
          <HorizonRule className="mb-space-lg" />
          <h2 className="font-display text-headline-md text-fyi-ink">
            Related <span className="text-fyi-flame">articles</span>
          </h2>

          <div className="mt-space-md grid grid-cols-1 gap-space-md md:grid-cols-3">
            {related.map((entry) => (
              <a
                key={entry.id}
                href={`/fyi/${entry.slug}/`}
                className="group flex flex-col gap-space-xs rounded-lg border border-fyi-stroke bg-fyi-canvas p-space-md transition-colors hover:border-fyi-flame/50"
              >
                <span className="font-label text-label-sm text-fyi-ink-faint">
                  {formatReadTime(entry.readTime)}
                </span>
                <span className="font-display text-headline-sm text-fyi-ink transition-colors group-hover:text-fyi-flame-soft">
                  {entry.title}
                </span>
                {entry.excerpt && (
                  <span className="line-clamp-2 font-body text-body-sm text-fyi-ink-dim">
                    {entry.excerpt}
                  </span>
                )}
                <span className="mt-space-xs inline-flex items-center gap-1 font-headline-sm text-headline-sm text-fyi-flame">
                  Read
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </span>
              </a>
            ))}
          </div>
        </section>
      )}

      {related.length === 0 && (
        <div className="mx-auto max-w-[1100px] px-6 pb-space-2xl">
          <EmptyState title="That is the whole archive so far">
            <a href="/fyi/" className="text-fyi-flame hover:text-fyi-flame-soft">
              Back to the FYI index
            </a>
          </EmptyState>
        </div>
      )}
    </>
  );
}
