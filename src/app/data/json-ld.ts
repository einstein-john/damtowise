import { PROJECTS, projectsItemListSchema } from '@/app/data/projects';
import {
  FYI_PATH,
  baseGraph,
  breadcrumbSchema,
  type JsonLdNode,
  type RouteMeta,
} from '@/app/data/routes';
import { SITE, PERSON, absoluteUrl } from '@/app/data/site';
import type { FyiPostDetail, FyiPostSummary } from '@/app/lib/fyi/types';

/**
 * JSON-LD graphs, shared by the prerenderer and the browser.
 *
 * This module lives in `data/` rather than in `entry-server.tsx` so the live
 * document can use the exact same graph as the static one. A `<script>` that
 * disagrees with the prerendered document is worse than not having it at all,
 * and for structured data it is usually worse than having nothing: Google reads
 * the crawlable copy, the reader gets the hydrated one.
 */

/** Absolute URL of an article document. */
export function articlePath(slug: string): string {
  return `/fyi/${slug}/`;
}

/**
 * JSON-LD graph for a route.
 *
 * `posts` is optional: when the FYI index is rendered with its catalogue in hand
 * the graph carries a `Blog` + `ItemList` describing the listing, which is what
 * tells a crawler the page is a real archive rather than a landing page.
 */
export function jsonLdFor(
  route: RouteMeta,
  posts?: readonly FyiPostSummary[],
): Record<string, unknown> {
  const graph: JsonLdNode[] = baseGraph();

  if (route.path === '/') {
    graph.push(
      {
        '@type': 'ProfilePage',
        '@id': `${absoluteUrl(route.path)}#profile`,
        mainEntity: { '@id': PERSON.id },
        isPartOf: { '@id': `${SITE.origin}/#website` },
        description: `${PERSON.jobTitle} portfolio specialising in TypeScript, Node.js and n8n workflow automation.`,
      } as JsonLdNode,
      projectsItemListSchema() as JsonLdNode,
    );
  }

  const breadcrumb = breadcrumbSchema(route);
  if (breadcrumb) graph.push(breadcrumb as JsonLdNode);

  if (route.path === FYI_PATH && posts && posts.length > 0) {
    graph.push(fyiCollectionSchema(posts));
  }

  return { '@context': 'https://schema.org', '@graph': graph };
}

/**
 * The FYI listing, described as a collection of its posts.
 *
 * `Blog` (not `CollectionPage`) because the page is a blog index: it has an
 * author, a publisher and a continuous series of dated posts. Each entry points
 * at the article's own document, so the `ItemList` doubles as a crawl map —
 * important because the listing itself only renders the most recent page.
 */
export function fyiCollectionSchema(posts: readonly FyiPostSummary[]): JsonLdNode {
  return {
    '@type': 'Blog',
    '@id': `${SITE.origin}${FYI_PATH}#blog`,
    name: 'FYI',
    description: `Notes on backend engineering, API design and n8n workflow automation by ${PERSON.name}.`,
    inLanguage: SITE.locale,
    author: { '@id': PERSON.id },
    publisher: { '@id': `${SITE.origin}/#website` },
    blogPost: posts.map((post, index) => ({
      '@type': 'BlogPosting',
      position: index + 1,
      url: absoluteUrl(articlePath(post.slug)),
      headline: post.title,
      datePublished: post.publishedAt,
      ...(post.excerpt ? { description: post.excerpt } : {}),
      keywords: post.tags.map((tag) => tag.name).join(', ') || undefined,
      author: { '@id': PERSON.id },
      isPartOf: { '@id': `${SITE.origin}${FYI_PATH}#blog` },
    })),
  } as JsonLdNode;
}

/**
 * `BlogPosting` graph, so an article can be surfaced as a rich result.
 *
 * The breadcrumb is included on purpose: `articleRouteMeta` declares one, and an
 * article whose `BreadcrumbList` never reaches the document is a breadcrumb that
 * only exists in code.
 */
export function articleJsonLdFor(post: FyiPostDetail): Record<string, unknown> {
  const graph: JsonLdNode[] = baseGraph();

  graph.push({
    '@type': 'BlogPosting',
    '@id': `${absoluteUrl(articlePath(post.slug))}#article`,
    headline: post.seoTitle ?? post.title,
    description: post.seoDescription ?? post.excerpt ?? undefined,
    image: post.ogImageUrl ? [post.ogImageUrl] : [`${SITE.origin}/og/default.png`],
    datePublished: post.publishedAt ?? undefined,
    dateModified: post.updatedAt,
    inLanguage: SITE.locale,
    mainEntityOfPage: { '@id': absoluteUrl(articlePath(post.slug)) },
    author: { '@id': PERSON.id },
    publisher: { '@id': `${SITE.origin}/#website` },
    keywords: post.tags.map((tag) => tag.name).join(', ') || undefined,
    timeRequired: `PT${post.readTime}M`,
    isPartOf: { '@id': `${SITE.origin}${FYI_PATH}#blog` },
    ...(post.canonicalUrl ? { url: post.canonicalUrl } : {}),
  } as JsonLdNode);

  const breadcrumb = breadcrumbSchema(articleRouteMeta(post));
  if (breadcrumb) graph.push(breadcrumb as JsonLdNode);

  return { '@context': 'https://schema.org', '@graph': graph };
}

/** A subset of a post, enough for listing metadata. */
export interface SeoListEntry {
  slug: string;
  title: string;
  excerpt?: string | null;
  publishedAt?: string | null;
  tags?: Array<{ name: string }>;
}

/**
 * Article metadata for `<head>`.
 *
 * Derived in the browser from the loaded post; the prerenderer builds the same
 * object for the static document, so a cold load and a client-side navigation
 * end up with identical tags.
 */
export function articleRouteMeta(post: FyiPostDetail): RouteMeta {
  return {
    path: articlePath(post.slug),
    file: `fyi/${post.slug}/index.html`,
    title: `${post.seoTitle ?? post.title} | ${SITE.name}`,
    description: post.seoDescription ?? post.excerpt ?? `${SITE.name} FYI — ${FYI_PATH}`,
    ogType: 'article',
    ogImage: post.ogImageUrl ?? '/og/default.png',
    ogImageAlt: `${post.title} — ${SITE.name} FYI`,
    noindex: post.noindex,
    breadcrumb: [
      { name: 'Home', path: '/' },
      { name: 'FYI', path: FYI_PATH },
      { name: post.title, path: articlePath(post.slug) },
    ],
  };
}

export { PROJECTS };
