import React from 'react';
import { renderToString } from 'react-dom/server';
import App from '@/app/App';
import '@/styles/index.css';
import { setServerPath } from '@/app/lib/router';
import { renderHead } from '@/app/lib/head';
import {
  articleJsonLdFor,
  articlePath as articlePathFor,
  articleRouteMeta,
  jsonLdFor,
} from '@/app/data/json-ld';
import { PROJECTS } from '@/app/data/projects';
import { ROUTES, FYI_PATH, type RouteMeta } from '@/app/data/routes';
import { SITE, PERSON, absoluteUrl } from '@/app/data/site';
import { ARTICLE_BOOTSTRAP_ID, CATALOG_BOOTSTRAP_ID } from '@/app/lib/fyi/bootstrap-id';
import { setFyiCatalog, fyiCatalog } from '@/app/lib/fyi/manifest';
import type { FyiPostDetail, FyiTag, FyiWorklogItem } from '@/app/lib/fyi/types';

/** Ids of the JSON blocks the prerender step injects into FYI documents. */
export { ARTICLE_BOOTSTRAP_ID, CATALOG_BOOTSTRAP_ID };

/**
 * Renders the site to static HTML at build time.
 *
 * The site is a client-rendered React app, which means crawlers and social
 * scrapers that do not execute JavaScript would otherwise see an empty shell.
 * This entry point is built by `vite build --ssr` and consumed by
 * `scripts/prerender.mjs`, which emits one HTML document per route — each with
 * its own title, description, canonical, Open Graph tags and JSON-LD.
 *
 * FYI articles are prerendered too. `scripts/prerender.mjs` calls
 * `loadFyiArticles()` before rendering; that fills the shared manifest the FYI
 * pages read synchronously while the document is being rendered. Without it the
 * article route has nothing to render and the build still succeeds with the
 * FYI index alone.
 *
 * Anything browser-only (WebGL background, PostHog, scroll handlers) lives in
 * effects or event handlers, so it is inert here — the markup matches the first
 * client render, which lets React hydrate in place.
 */

let articles: FyiPostDetail[] = [];

/** The FYI API base the build should read from. Overridable for a local run. */
const FYI_API_URL = (import.meta.env.VITE_FYI_API_URL ?? 'https://api.damtowise.xyz').replace(
  /\/+$/,
  '',
);

const ARTICLE_PAGE_LIMIT = 50;
const MAX_PAGES = 20;

/**
 * Loads the whole public catalogue: published posts, tags and the work log.
 *
 * `articles` drives the per-article documents, the sitemap and the RSS feed.
 * The rest is parked in the shared manifest, which is what lets the FYI index
 * prerender real cards instead of an empty state.
 *
 * A failure is non-fatal on purpose: the site must still build (and still serve
 * a complete FYI index) when the API is asleep. The build logs the reason and
 * carries on with whatever it already has.
 */
export async function loadFyiArticles(fetchImpl: typeof fetch = fetch): Promise<number> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15_000);

  const get = async <T,>(path: string): Promise<T> => {
    const response = await fetchImpl(`${FYI_API_URL}${path}`, {
      headers: { Accept: 'application/json' },
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`FYI API responded ${response.status} for ${path}`);
    return (await response.json()) as T;
  };

  try {
    const posts: FyiPostDetail[] = [];
    let page = 1;
    let total = Number.POSITIVE_INFINITY;

    while (posts.length < total && page <= MAX_PAGES) {
      const payload = await get<{ items: FyiPostDetail[]; total: number }>(
        `${'/posts'}?page=${page}&pageSize=${ARTICLE_PAGE_LIMIT}`,
      );
      if (payload.items.length === 0) break;
      posts.push(...payload.items);
      total = payload.total;
      page += 1;
    }

    // Tags and the work log are small and independent: if either fails, the
    // article documents still go out and the index is merely degraded.
    const [tags, worklog] = await Promise.all([
      get<FyiTag[]>('/tags').catch(() => [] as FyiTag[]),
      get<FyiWorklogItem[]>('/worklog').catch(() => [] as FyiWorklogItem[]),
    ]);

    articles = posts;
    setFyiCatalog({ posts, tags, worklog, articles: posts });
    return posts.length;
  } catch (error) {
    articles = [];
    setFyiCatalog({ posts: [], tags: [], worklog: [], articles: [] });
    console.warn(
      `  ! could not load FYI articles from ${FYI_API_URL}: ${
        error instanceof Error ? error.message : String(error)
      }`,
    );
    return 0;
  } finally {
    clearTimeout(timeout);
  }
}

/** Posts the build resolved, newest first. */
export function loadedArticles(): readonly FyiPostDetail[] {
  return articles;
}

/** The article the prerenderer is currently rendering, if the build resolved it. */
function currentArticle(path: string): FyiPostDetail | undefined {
  const match = /^\/fyi\/([^/]+)\/?$/.exec(path);
  if (!match) return undefined;
  return articles.find((post) => post.slug === match[1]);
}

/**
 * The article payload the client hydrates from.
 *
 * Injected as JSON into the document by the prerender step, so a cold load
 * renders the article on the first client pass instead of flashing a skeleton.
 * Escaped for an inline `<script>` — a literal `</script>` inside the HTML
 * would end the block early and eat the rest of the document.
 */
export function articleBootstrap(path: string): string | null {
  const post = currentArticle(path);
  if (!post) return null;
  return escapeForScript(JSON.stringify(post));
}

/**
 * The catalogue the FYI index hydrates from: post summaries, tags and the work
 * log. Kept separate from the article payload because only the article route
 * needs the full bodies, and embedding a full body on every card would be dead
 * weight in the document.
 */
export function catalogBootstrap(): string {
  const catalog = fyiCatalog();

  const posts = catalog.posts.map(
    ({ id, slug, title, excerpt, coverImageUrl, tags, publishedAt, readTime }) => ({
      id,
      slug,
      title,
      excerpt,
      coverImageUrl,
      tags,
      publishedAt,
      readTime,
    }),
  );

  return escapeForScript(JSON.stringify({ posts, tags: catalog.tags, worklog: catalog.worklog }));
}

function escapeForScript(json: string): string {
  return json.replace(/<\/(script)/gi, '<\\/$1');
}

export function render(path = '/'): { html: string } {
  setServerPath(path);
  return { html: renderToString(<App />) };
}

/** JSON-LD graph for a static route. */
export function jsonLdForRoute(route: RouteMeta): string {
  return JSON.stringify(jsonLdFor(route, articles), null, 2);
}

/** Full <head> contents for a route, as an HTML string. */
export function headFor(route: RouteMeta): string {
  return renderHead(route, {
    jsonLd: jsonLdForRoute(route),
    includeProfile: route.path === '/',
  });
}

/**
 * Full <head> for an article, with its own BlogPosting graph.
 *
 * The Open Graph article block mirrors the JSON-LD: Facebook, LinkedIn and
 * Slack read `article:published_time`/`article:author`/`article:tag`, and a
 * card that only says "article" with no dates is a card that renders as a
 * generic web page.
 */
export function articleHeadFor(post: FyiPostDetail): string {
  return renderHead(articleRouteMeta(post), {
    jsonLd: JSON.stringify(articleJsonLdFor(post), null, 2),
    article: {
      publishedTime: post.publishedAt,
      modifiedTime: post.updatedAt,
      authors: [PERSON.name],
      tags: post.tags.map((tag) => tag.name),
      section: post.tags[0]?.name,
    },
  });
}

/**
 * The FYI index as the build should write it.
 *
 * A build that could not reach the API has an index document with no articles
 * in it, and that is exactly the thin page that must not be indexed. The live
 * document still follows `FYI_HAS_POSTS`, so a successful build and a failed
 * build disagree only in the failure case — where noindex is the right answer.
 */
export function staticRouteMetaFor(path: string): RouteMeta {
  const route = ROUTES.find((entry) => entry.path === path);
  if (!route) throw new Error(`No static route is registered for ${path}`);
  if (route.path === FYI_PATH && articles.length === 0) {
    return { ...route, noindex: true };
  }
  return route;
}

/**
 * Absolute URLs that belong in sitemap.xml, with a lastmod for each.
 * Only routes that are actually published (i.e. not `noindex`) are listed.
 */
export function sitemapEntries() {
  const today = new Date().toISOString().slice(0, 10);

  const staticEntries = ROUTES.map((route) => staticRouteMetaFor(route.path))
    .filter((meta) => !meta.noindex)
    .map((meta) => ({
      loc: absoluteUrl(meta.path),
      lastmod: today,
      changefreq: meta.path === '/' ? 'monthly' : 'weekly',
      priority: meta.path === '/' ? '1.0' : '0.8',
    }));

  const articleEntries = articles
    .filter((post) => !post.noindex)
    .map((post) => ({
      loc: absoluteUrl(articlePathFor(post.slug)),
      lastmod: (post.publishedAt ?? post.updatedAt).slice(0, 10),
      changefreq: 'monthly',
      priority: '0.7',
    }));

  return [...staticEntries, ...articleEntries];
}

export function robotsTxt() {
  return [
    'User-agent: *',
    'Allow: /',
    '',
    '# Private application surfaces',
    'Disallow: /admin/',
    'Disallow: /auth/',
    '',
    `Sitemap: ${SITE.origin}/sitemap.xml`,
    '',
  ].join('\n');
}

const escapeXml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

export function rssFeed() {
  const buildDate = new Date().toUTCString();

  const items = articles
    .filter((post) => !post.noindex)
    .map((post) =>
      [
        '    <item>',
        `      <title>${escapeXml(post.seoTitle ?? post.title)}</title>`,
        `      <link>${absoluteUrl(articlePathFor(post.slug))}</link>`,
        `      <guid isPermaLink="true">${absoluteUrl(articlePathFor(post.slug))}</guid>`,
        `      <pubDate>${new Date(post.publishedAt ?? post.updatedAt).toUTCString()}</pubDate>`,
        `      <description>${escapeXml(post.seoDescription ?? post.excerpt ?? '')}</description>`,
        '    </item>',
      ].join('\n'),
    )
    .join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>FYI · ${SITE.name}</title>`,
    `    <link>${SITE.origin}/fyi/</link>`,
    `    <description>Notes on backend engineering, API design and n8n workflow automation by ${PERSON.name}.</description>`,
    `    <language>${SITE.locale}</language>`,
    `    <lastBuildDate>${buildDate}</lastBuildDate>`,
    `    <atom:link href="${SITE.origin}/rss.xml" rel="self" type="application/rss+xml" />`,
    items,
    '  </channel>',
    '</rss>',
    '',
  ].join('\n');
}

export function sitemapXml() {
  const urls = sitemapEntries()
    .map((entry) =>
      [
        '  <url>',
        `    <loc>${entry.loc}</loc>`,
        `    <lastmod>${entry.lastmod}</lastmod>`,
        `    <changefreq>${entry.changefreq}</changefreq>`,
        `    <priority>${entry.priority}</priority>`,
        '  </url>',
      ].join('\n'),
    )
    .join('\n');

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    urls,
    '</urlset>',
    '',
  ].join('\n');
}

/** Static routes the prerender step emits a document for. */
export const PRERENDER_ROUTES = ROUTES;

/** Article routes, one per published post the build resolved. */
export function prerenderArticleRoutes(): RouteMeta[] {
  return articles.map(articleRouteMeta);
}

/** Exported so the project registry stays reachable from build tooling. */
export { PROJECTS };
