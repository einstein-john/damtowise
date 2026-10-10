import { PROJECTS, projectsItemListSchema } from '@/app/data/projects';
import { baseGraph, breadcrumbSchema, type JsonLdNode, type RouteMeta } from '@/app/data/routes';
import { SITE, PERSON, absoluteUrl } from '@/app/data/site';
import { FYI_PATH } from '@/app/data/routes';
import type { FyiPostDetail } from '@/app/lib/fyi/types';

/**
 * JSON-LD graph for a route.
 *
 * Lives in `data/` rather than in `entry-server.tsx` so the browser can use the
 * exact same graph after a client-side navigation: a `<script>` that disagrees
 * with the prerendered one is worse than not having it at all.
 */
export function jsonLdFor(route: RouteMeta): Record<string, unknown> {
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

  return { '@context': 'https://schema.org', '@graph': graph };
}

/** Absolute URL of an article document. */
export function articlePath(slug: string): string {
  return `/fyi/${slug}/`;
}

/**
 * `BlogPosting` graph, so an article can be surfaced as a rich result.
 *
 * Shares this module with the prerenderer so the document the browser hydrates
 * and the document Google reads are describing the same post.
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
    isPartOf: { '@id': `${SITE.origin}/#website` },
  } as JsonLdNode);

  return { '@context': 'https://schema.org', '@graph': graph };
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
