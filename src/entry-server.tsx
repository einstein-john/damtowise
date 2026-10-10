import React from 'react';
import { renderToString } from 'react-dom/server';
import App from '@/app/App';
import '@/styles/index.css';
import { setServerPath } from '@/app/lib/router';
import { renderHead } from '@/app/lib/head';
import { PROJECTS, projectsItemListSchema } from '@/app/data/projects';
import {
  ROUTES,
  baseGraph,
  breadcrumbSchema,
  canonicalFor,
  type JsonLdNode,
  type RouteMeta,
} from '@/app/data/routes';
import { SITE, PERSON, absoluteUrl } from '@/app/data/site';

/**
 * Renders the site to static HTML at build time.
 *
 * The site is a client-rendered React app, which means crawlers and social
 * scrapers that do not execute JavaScript would otherwise see an empty shell.
 * This entry point is built by `vite build --ssr` and consumed by
 * `scripts/prerender.mjs`, which emits one HTML document per route — each with
 * its own title, description, canonical, Open Graph tags and JSON-LD.
 *
 * Anything browser-only (WebGL background, PostHog, scroll handlers) lives in
 * effects or event handlers, so it is inert here — the markup matches the first
 * client render, which lets React hydrate in place.
 */
export function render(path = '/'): { html: string } {
  setServerPath(path);
  return { html: renderToString(<App />) };
}

/** JSON-LD graph for a route. */
export function jsonLdFor(route: RouteMeta): string {
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

  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }, null, 2);
}

/** Full <head> contents for a route, as an HTML string. */
export function headFor(route: RouteMeta): string {
  return renderHead(route, {
    jsonLd: jsonLdFor(route),
    includeProfile: route.path === '/',
  });
}

/**
 * Absolute URLs that belong in sitemap.xml, with a lastmod for each.
 * Only routes that are actually published (i.e. not `noindex`) are listed.
 */
export function sitemapEntries() {
  const today = new Date().toISOString().slice(0, 10);

  return ROUTES.filter((route) => !route.noindex).map((route) => ({
    loc: canonicalFor(route),
    lastmod: today,
    changefreq: route.path === '/' ? 'monthly' : 'weekly',
    priority: route.path === '/' ? '1.0' : '0.8',
  }));
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
    '# AI crawlers',
    'User-agent: GPTBot',
    'Allow: /',
    'User-agent: ChatGPT-User',
    'Allow: /',
    'User-agent: Google-Extended',
    'Allow: /',
    'User-agent: PerplexityBot',
    'Allow: /',
    'User-agent: Perplexity-User',
    'Allow: /',
    'User-agent: ClaudeBot',
    'Allow: /',
    'User-agent: Claude-User',
    'Allow: /',
    'User-agent: anthropic-ai',
    'Allow: /',
    'User-agent: OAI-SearchBot',
    'Allow: /',
    'User-agent: meta-externalagent',
    'Allow: /',
    'User-agent: Bytespider',
    'Allow: /',
    '',
    `Sitemap: ${SITE.origin}/sitemap.xml`,
    '',
  ].join('\n');
}

export function rssFeed() {
  const buildDate = new Date().toUTCString();
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
    '    <!-- TODO: emit one <item> per published FYI post once articles exist. -->',
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

/** Routes the prerender step should emit a document for. */
export const PRERENDER_ROUTES = ROUTES;

/** Exported so the project registry stays reachable from build tooling. */
export { PROJECTS };
