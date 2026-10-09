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
 *   1. Inject the prerendered React markup into dist/index.html so `curl` and
 *      `view-source:` return the hero copy, headings, links and JSON-LD without
 *      running a single line of JavaScript.
 *   2. Regenerate robots.txt, sitemap.xml and rss.xml from the same data
 *      modules the UI renders, so they can never drift from the site.
 *   3. Refresh the sitemap's <lastmod> values.
 */
import { readFile, writeFile, rm } from 'node:fs/promises';
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
  if (typeof mod.render !== 'function') {
    throw new Error(`SSR bundle at ${entry} does not export a render() function.`);
  }
  return mod;
}

/**
 * Replaces the hand-written JSON-LD block in index.html with the graph produced
 * by src/entry-server.tsx, so the structured data and the rendered markup are
 * generated from one place.
 */
function syncJsonLd(html, jsonLd) {
  const pattern = /<script type="application\/ld\+json">[\s\S]*?<\/script>/;
  if (!pattern.test(html)) {
    throw new Error('Could not find the <script type="application/ld+json"> block to replace.');
  }
  // `</script>` inside the JSON would terminate the tag early.
  const safe = jsonLd.replace(/<\/script>/gi, '<\\/script>');
  return html.replace(pattern, `<script type="application/ld+json">\n${safe}\n    </script>`);
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
  const { render, jsonLd, robotsTxt, rssFeed, sitemapXml } = renderer;

  const { html: appHtml } = render();

  const template = await readFile(distIndex, 'utf8');
  const prerendered = injectMarkup(template, appHtml);
  const withSchema = syncJsonLd(prerendered, jsonLd());

  await writeFile(distIndex, withSchema, 'utf8');

  await Promise.all([
    writeFile(path.join(distDir, 'robots.txt'), robotsTxt(), 'utf8'),
    writeFile(path.join(distDir, 'sitemap.xml'), sitemapXml(), 'utf8'),
    writeFile(path.join(distDir, 'rss.xml'), rssFeed(), 'utf8'),
  ]);

  const textLength = textContentOf(appHtml).length;
  console.log(
    `prerendered ${appHtml.length.toLocaleString()} bytes of markup into dist/index.html`,
  );
  console.log(
    `~${textLength.toLocaleString()} characters of indexable text, no JavaScript required`,
  );
  console.log('wrote robots.txt, sitemap.xml and rss.xml');

  await rm(ssrDir, { recursive: true, force: true });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
