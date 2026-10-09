/**
 * Post-build SEO pass for the static site.
 *
 * Run as part of `npm run build`, after the client build and the SSR build:
 *
 *   vite build
 *   vite build --ssr src/entry-server.tsx --outDir .prerender
 *   node scripts/prerender.mjs
 *
 * Responsibilities:
 *   1. Emit one HTML document per route into dist/, with the route's own title,
 *      description, canonical, Open Graph tags and JSON-LD, plus the React
 *      markup prerendered into #root. `curl` and `view-source:` therefore return
 *      real content without running any JavaScript.
 *   2. Regenerate robots.txt, sitemap.xml and rss.xml from the same data
 *      modules the UI renders, so they can never drift from the site.
 *   3. Refresh the sitemap's <lastmod> values.
 */
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ssrDir = path.join(rootDir, '.prerender');
const distDir = path.join(rootDir, 'dist');
const distIndex = path.join(distDir, 'index.html');

async function loadRenderer() {
  const candidates = ['entry-server.js', 'entry-server.mjs'].map((file) => path.join(ssrDir, file));
  const entry = candidates.find((file) => existsSync(file));
  if (!entry) {
    throw new Error(
      `SSR bundle not found in ${ssrDir}. Expected "vite build --ssr src/entry-server.tsx --outDir .prerender" to run first.`,
    );
  }
  const mod = await import(pathToFileURL(entry).href);
  for (const name of ['render', 'headFor', 'robotsTxt', 'rssFeed', 'sitemapXml']) {
    if (typeof mod[name] !== 'function') {
      throw new Error(`SSR bundle at ${entry} does not export ${name}().`);
    }
  }
  return mod;
}

/** Swaps the template's <head> for the route-specific one. */
function replaceHead(html, head) {
  const pattern = /<head>[\s\S]*?<\/head>/;
  if (!pattern.test(html)) {
    throw new Error('Could not find a <head> block in the built index.html.');
  }
  return html.replace(pattern, `<head>\n${head}\n  </head>`);
}

function injectMarkup(html, appHtml) {
  const rootPattern = /<div id="root"(\s[^>]*)?><\/div>/;
  if (!rootPattern.test(html)) {
    throw new Error('Could not find an empty <div id="root"></div> to prerender into.');
  }
  return html.replace(rootPattern, `<div id="root">${appHtml}</div>`);
}

const textContentOf = (markup) =>
  markup
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

async function main() {
  const renderer = await loadRenderer();
  const { render, headFor, robotsTxt, rssFeed, sitemapXml, PRERENDER_ROUTES } = renderer;

  // The client build already wrote a full index.html; use it as the shell so
  // every route shares the same body, script tags and asset references.
  const shell = await readFile(distIndex, 'utf8');

  for (const route of PRERENDER_ROUTES) {
    const { html: appHtml } = render(route.path);
    const document_ = injectMarkup(replaceHead(shell, headFor(route)), appHtml);

    const target = path.join(distDir, route.file);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, document_, 'utf8');

    const indexable = route.noindex ? 'noindex' : 'index';
    console.log(
      `  ${route.path.padEnd(8)} -> ${route.file.padEnd(16)} ${indexable}, ` +
        `~${textContentOf(appHtml).length.toLocaleString()} chars of text`,
    );
  }

  await Promise.all([
    writeFile(path.join(distDir, 'robots.txt'), robotsTxt(), 'utf8'),
    writeFile(path.join(distDir, 'sitemap.xml'), sitemapXml(), 'utf8'),
    writeFile(path.join(distDir, 'rss.xml'), rssFeed(), 'utf8'),
  ]);

  console.log('  wrote robots.txt, sitemap.xml and rss.xml');

  await rm(ssrDir, { recursive: true, force: true });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
