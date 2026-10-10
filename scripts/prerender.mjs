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
 *   1. Load the published FYI articles from the API, so one HTML document can be
 *      emitted per post (`/fyi/<slug>/index.html`) with its own title,
 *      description, canonical, Open Graph tags and JSON-LD.
 *   2. Emit one HTML document per static route into dist/.
 *   3. Regenerate robots.txt, sitemap.xml and rss.xml from the same data
 *      modules the UI renders, so they can never drift from the site.
 *   4. Refresh the sitemap's <lastmod> values.
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

  // The trailing `(?:<\/script>)?` matters more than it looks. A <script> with a
  // src attribute is only inert once it is closed: an unclosed one puts the HTML
  // parser into "script data" state, where every following tag — including the
  // stylesheet link, </head>, <body> and #root — is swallowed as script text.
  // The page then loads no CSS and the app cannot find its mount point.
  const tags = head.match(
    /<script\b[^>]*\bsrc="\/assets\/[^"]*"[^>]*>(?:<\/script>)?|<link\b[^>]*\brel="(?:stylesheet|modulepreload)"[^>]*\bhref="\/assets\/[^"]*"[^>]*>/g,
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
  // An earlier version of this check only looked for the opening <script> tag,
  // which happily passed while that tag was left unclosed — and an unclosed
  // <script> silently swallows the rest of the document. Require the close tag.
  const hasClosedModuleScript = /<script\b[^>]*\bsrc="\/assets\/[^"]*\.js"[^>]*>\s*<\/script>/.test(
    document_,
  );
  const hasStylesheet = /<link\b[^>]*\brel="stylesheet"/.test(document_);
  const hasMountPoint = /<div id="root">/.test(document_);

  // Every <script> the head emits must be balanced, or the parser eats the body.
  const openScripts = (document_.match(/<script\b/g) ?? []).length;
  const closeScripts = (document_.match(/<\/script>/g) ?? []).length;
  const scriptsBalanced = openScripts === closeScripts;

  if (
    !hasClosedModuleScript ||
    !hasStylesheet ||
    !hasMountPoint ||
    !scriptsBalanced ||
    assetTags.length === 0
  ) {
    throw new Error(
      `Prerendered ${route.path} is incomplete ` +
        `(closed module script: ${hasClosedModuleScript}, stylesheet: ${hasStylesheet}, ` +
        `#root: ${hasMountPoint}, <script> ${openScripts} open / ${closeScripts} closed, ` +
        `asset tags: ${assetTags.length}). ` +
        `Refusing to write a page that cannot render, hydrate or mount.`,
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

/**
 * Injects the JSON payloads the client hydrates from.
 *
 * Without them, a cold load renders the prerendered markup but the first client
 * pass finds an empty cache and swaps in a skeleton — a hydration mismatch that
 * also makes the content flash. The blocks are `application/json` (never
 * executed) and are written before `</body>`, so they cannot disturb the head
 * assertions the build already made.
 */
function injectBootstrap(html, payloads) {
  const marker = '</body>';
  if (!html.includes(marker)) {
    throw new Error('Could not locate </body> to inject the FYI bootstrap into.');
  }

  const tags = payloads
    .filter((entry) => entry.value)
    .map((entry) => `  <script type="application/json" id="${entry.id}">${entry.value}</script>`)
    .join('\n');

  return tags ? html.replace(marker, `${tags}\n  ${marker}`) : html;
}

const textContentOf = (markup) =>
  markup
    .replace(/<script[\s\S]*?<\/script>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** FYI index path, duplicated from `src/app/data/routes.ts` for the build step. */
const FYI_PATH = '/fyi/';

async function main() {
  const renderer = await loadRenderer();
  const {
    render,
    headFor,
    articleHeadFor,
    robotsTxt,
    rssFeed,
    sitemapXml,
    sitemapEntries,
    PRERENDER_ROUTES,
    staticRouteMetaFor,
    loadFyiArticles,
    prerenderArticleRoutes,
    articleBootstrap,
    catalogBootstrap,
    loadedArticles,
    ARTICLE_BOOTSTRAP_ID,
    CATALOG_BOOTSTRAP_ID,
  } = renderer;

  // The FYI API owns which posts are public; a build-time /fyi/ index with no
  // articles in it is marked noindex by `staticRouteMetaFor`.
  if (typeof loadFyiArticles === 'function') await loadFyiArticles();
  const indexMeta = typeof staticRouteMetaFor === 'function' ? staticRouteMetaFor(FYI_PATH) : null;
  const articleRoutes =
    typeof prerenderArticleRoutes === 'function' ? prerenderArticleRoutes() : [];
  const bootstrap = typeof articleBootstrap === 'function' ? articleBootstrap : () => null;
  const catalog = typeof catalogBootstrap === 'function' ? catalogBootstrap : () => null;
  const articleCount = typeof loadedArticles === 'function' ? loadedArticles().length : 0;

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
    // The /fyi/ index needs the build's own verdict on whether the blog has
    // content to rank; every other static route uses its declared metadata.
    const meta = route.path === FYI_PATH && indexMeta ? indexMeta : route;
    const { html: appHtml } = render(route.path);
    const head = [headFor(meta), ...assetTags].join('\n');
    const document_ = injectBootstrap(injectMarkup(replaceHead(shell, head), appHtml), [
      { id: CATALOG_BOOTSTRAP_ID ?? 'fyi-catalog', value: catalog() },
    ]);

    assertAssetsPresent(document_, route, assetTags);

    const target = path.join(distDir, route.file);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, document_, 'utf8');

    const indexable = meta.noindex ? 'noindex' : 'index';
    console.log(
      `  ${route.path.padEnd(8)} -> ${route.file.padEnd(16)} ${indexable}, ` +
        `~${textContentOf(appHtml).length.toLocaleString()} chars of text, ` +
        `${assetTags.length} asset tags`,
    );
  }

  if (articleCount === 0) {
    console.log('  no FYI articles published yet — skipping /fyi/<slug>/ documents');
  }

  for (const route of articleRoutes) {
    const { html: appHtml } = render(route.path);
    const post = loadedArticles().find(
      (entry) => entry.slug === route.path.slice('/fyi/'.length, -1),
    );
    const head = [post ? articleHeadFor(post) : headFor(route), ...assetTags].join('\n');

    const document_ = injectBootstrap(injectMarkup(replaceHead(shell, head), appHtml), [
      { id: CATALOG_BOOTSTRAP_ID ?? 'fyi-catalog', value: catalog() },
      {
        id: ARTICLE_BOOTSTRAP_ID ?? 'fyi-post',
        value: typeof bootstrap === 'function' ? bootstrap(route.path) : null,
      },
    ]);

    assertAssetsPresent(document_, route, assetTags);

    const target = path.join(distDir, route.file);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, document_, 'utf8');

    console.log(
      `  ${route.path.padEnd(28)} -> ${route.file.padEnd(34)} ` +
        `${post?.noindex ? 'noindex' : 'index'}, ` +
        `~${textContentOf(appHtml).length.toLocaleString()} chars of text`,
    );
  }

  await Promise.all([
    writeFile(path.join(distDir, 'robots.txt'), robotsTxt(), 'utf8'),
    writeFile(path.join(distDir, 'sitemap.xml'), sitemapXml(), 'utf8'),
    writeFile(path.join(distDir, 'rss.xml'), rssFeed(), 'utf8'),
  ]);

  console.log(
    `  wrote robots.txt, sitemap.xml (${sitemapEntries().length} URLs) and rss.xml ` +
      `(${articleCount} article${articleCount === 1 ? '' : 's'})`,
  );

  await rm(ssrDir, { recursive: true, force: true });
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
