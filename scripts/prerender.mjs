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

/**
 * Extracts the tags Vite injects into <head> — the module entry script, its
 * modulepreload hints and the stylesheet link.
 *
 * These MUST survive prerendering. Replacing <head> wholesale without carrying
 * them over produces a page that is crawlable but has no CSS and no JavaScript:
 * the markup is there, but nothing is styled and nothing hydrates.
 *
 * Only tags pointing at `/assets/` are captured. External stylesheets (the
 * Google Fonts link in index.html) are already emitted by headFor(), and
 * capturing them as well would emit a duplicate render-blocking request.
 */
function extractViteAssetTags(html) {
  const headStart = html.indexOf('<head>');
  const headEnd = html.indexOf('</head>');
  if (headStart === -1 || headEnd === -1) {
    throw new Error('Could not locate a <head> block in the built index.html.');
  }

  const head = html.slice(headStart, headEnd);
  const tags = head.match(
    /<script\b[^>]*\bsrc="\/assets\/[^"]*"[^>]*>|<link\b[^>]*\brel="(?:stylesheet|modulepreload)"[^>]*\bhref="\/assets\/[^"]*"[^>]*>/g,
  );

  return tags ?? [];
}

/** Swaps the template's <head> for the route-specific one, plus Vite's tags. */
function replaceHead(html, head) {
  const pattern = /<head>[\s\S]*?<\/head>/;
  if (!pattern.test(html)) {
    throw new Error('Could not find a <head> block in the built index.html.');
  }
  return html.replace(pattern, `<head>\n${head}\n  </head>`);
}

/**
 * Fails the build if the document we just produced cannot style or hydrate
 * itself. Shipping a page with no script tag is worse than failing loudly.
 */
function assertAssetsPresent(document_, route, assetTags) {
  const hasModuleScript = /<script\b[^>]*\bsrc="\/assets\/[^"]*\.js"/.test(document_);
  const hasStylesheet = /<link\b[^>]*\brel="stylesheet"/.test(document_);

  if (!hasModuleScript || !hasStylesheet || assetTags.length === 0) {
    throw new Error(
      `Prerendered ${route.path} is missing build assets ` +
        `(module script: ${hasModuleScript}, stylesheet: ${hasStylesheet}, ` +
        `tags carried over: ${assetTags.length}). Refusing to write a page that ` +
        `cannot render or hydrate.`,
    );
  }
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
  const assetTags = extractViteAssetTags(shell);

  if (assetTags.length === 0) {
    throw new Error(
      'Found no Vite asset tags (module script / stylesheet) in dist/index.html. ' +
        'The head replacement would strip them and produce an unstyled page.',
    );
  }

  for (const route of PRERENDER_ROUTES) {
    const { html: appHtml } = render(route.path);
    const head = [headFor(route), ...assetTags].join('\n');
    const document_ = injectMarkup(replaceHead(shell, head), appHtml);

    assertAssetsPresent(document_, route, assetTags);

    const target = path.join(distDir, route.file);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, document_, 'utf8');

    const indexable = route.noindex ? 'noindex' : 'index';
    console.log(
      `  ${route.path.padEnd(8)} -> ${route.file.padEnd(16)} ${indexable}, ` +
        `~${textContentOf(appHtml).length.toLocaleString()} chars of text, ` +
        `${assetTags.length} asset tags`,
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
