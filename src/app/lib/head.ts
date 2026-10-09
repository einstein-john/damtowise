import { SITE, absoluteUrl } from '@/app/data/site';
import { canonicalFor, type RouteMeta } from '@/app/data/routes';

/**
 * Renders the contents of <head> for a route as an HTML string.
 *
 * This is the single source of truth for per-page metadata. The prerender step
 * writes the result into each generated HTML document, and DocumentHead applies
 * the same values during client-side navigation, so a tag can never disagree
 * between the two.
 */

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const FONT_HREF =
  'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap';

/** Chrome shared by every route: fonts, favicons, manifest, theme colour. */
const SHARED = `    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <!-- Fonts are preconnected so the stylesheet request starts on a warm TLS
         connection rather than queuing behind the app CSS. display=swap means
         text paints immediately in the fallback stack. -->
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link rel="stylesheet" href="${FONT_HREF}" />

    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
    <link rel="icon" type="image/png" sizes="180x180" href="/favicon-180.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/favicon-180.png" />
    <link rel="manifest" href="/site.webmanifest" />
    <meta name="theme-color" content="${SITE.themeColor}" />

    <link
      rel="alternate"
      type="application/rss+xml"
      title="FYI · ${SITE.name}"
      href="${SITE.origin}/rss.xml"
    />`;

export interface HeadOptions {
  /** JSON-LD graph, already serialised. */
  jsonLd: string;
  /** Profile/Open Graph tags only apply to the home page. */
  includeProfile?: boolean;
}

export function renderHead(route: RouteMeta, options: HeadOptions): string {
  const canonical = canonicalFor(route);
  const robots = route.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large';
  const ogImage = absoluteUrl(route.ogImage);

  const parts = [
    SHARED,
    `    <title>${escapeHtml(route.title)}</title>`,
    `    <meta name="description" content="${escapeHtml(route.description)}" />`,
    `    <meta name="robots" content="${robots}" />`,
    `    <link rel="canonical" href="${canonical}" />`,
    '',
    '    <!-- Open Graph -->',
    `    <meta property="og:type" content="${route.ogType}" />`,
    `    <meta property="og:site_name" content="${escapeHtml(SITE.name)}" />`,
    `    <meta property="og:locale" content="${SITE.locale}" />`,
    `    <meta property="og:title" content="${escapeHtml(route.title)}" />`,
    `    <meta property="og:description" content="${escapeHtml(route.description)}" />`,
    `    <meta property="og:url" content="${canonical}" />`,
    `    <meta property="og:image" content="${ogImage}" />`,
    '    <meta property="og:image:width" content="1200" />',
    '    <meta property="og:image:height" content="630" />',
    `    <meta property="og:image:alt" content="${escapeHtml(route.ogImageAlt)}" />`,
  ];

  if (options.includeProfile) {
    parts.push(
      `    <meta property="profile:first_name" content="${escapeHtml(SITE.name)}" />`,
      `    <meta property="profile:username" content="damtowise" />`,
    );
  }

  parts.push(
    '',
    '    <!-- Twitter -->',
    '    <meta name="twitter:card" content="summary_large_image" />',
    `    <meta name="twitter:title" content="${escapeHtml(route.title)}" />`,
    `    <meta name="twitter:description" content="${escapeHtml(route.description)}" />`,
    `    <meta name="twitter:image" content="${ogImage}" />`,
    `    <meta name="twitter:image:alt" content="${escapeHtml(route.ogImageAlt)}" />`,
    '',
    '    <!-- Structured data. Regenerated on every build by scripts/prerender.mjs. -->',
    '    <script type="application/ld+json">',
    options.jsonLd
      .replace(/<\/script>/gi, '<\\/script>')
      .split('\n')
      .map((line) => `    ${line}`)
      .join('\n'),
    '    </script>',
  );

  return parts.join('\n');
}
