import React from 'react';
import { renderToString } from 'react-dom/server';
import App from '@/app/App';
import '@/styles/index.css';
import { PROJECTS, projectsItemListSchema } from '@/app/data/projects';
import { SITE, PERSON, personSchema, webSiteSchema, profilePageSchema } from '@/app/data/site';

/**
 * Renders the app to static HTML at build time.
 *
 * The portfolio is a client-rendered React app, which means crawlers and social
 * scrapers that do not execute JavaScript would otherwise see an empty shell.
 * This entry point is built by `vite build --ssr` and consumed by
 * `scripts/prerender.mjs`, which injects the markup into `dist/index.html` and
 * regenerates robots.txt / sitemap.xml / rss.xml from the same data modules
 * the UI renders.
 *
 * Anything browser-only (WebGL background, PostHog, scroll handlers) lives in
 * effects or click handlers, so it is inert here — the markup it produces is
 * identical to the first client render, which keeps React from re-painting
 * the page on load.
 */
export function render(): { html: string } {
  const html = renderToString(<App />);
  return { html };
}

/** JSON-LD graph emitted into <head> for the home page. */
export function jsonLd() {
  return JSON.stringify(
    {
      '@context': 'https://schema.org',
      '@graph': [webSiteSchema(), personSchema(), profilePageSchema(), projectsItemListSchema()],
    },
    null,
    2,
  );
}

/** Absolute URLs that belong in sitemap.xml, with a lastmod for each. */
export function sitemapEntries() {
  const today = new Date().toISOString().slice(0, 10);

  const entries = [
    { loc: `${SITE.origin}/`, changefreq: 'monthly', priority: '1.0', lastmod: today },
    { loc: `${SITE.origin}/fyi`, changefreq: 'weekly', priority: '0.8', lastmod: today },
  ];

  // Project case studies are not published yet — listing them would advertise
  // URLs that 404. Enable once `projectPageLive` is flipped in Projects.tsx.
  const publishProjectPages = false;
  if (publishProjectPages) {
    for (const project of PROJECTS) {
      entries.push({
        loc: `${SITE.origin}${project.path}`,
        changefreq: 'monthly',
        priority: '0.7',
        lastmod: today,
      });
    }
  }

  return entries;
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

export function rssFeed() {
  const buildDate = new Date().toUTCString();
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    '  <channel>',
    `    <title>FYI · ${SITE.name}</title>`,
    `    <link>${SITE.origin}/fyi</link>`,
    `    <description>Notes on backend engineering, API design and n8n workflow automation by ${PERSON.name}.</description>`,
    `    <language>${SITE.locale}</language>`,
    `    <lastBuildDate>${buildDate}</lastBuildDate>`,
    `    <atom:link href="${SITE.origin}/rss.xml" rel="self" type="application/rss+xml" />`,
    '    <!-- TODO: emit one <item> per published FYI post once the blog routes exist. -->',
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

export { App };
