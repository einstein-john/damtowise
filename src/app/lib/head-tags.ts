import { canonicalFor, type RouteMeta } from '@/app/data/routes';

/**
 * Keeps <head> in sync with the active route during client-side navigation.
 *
 * On first load the tags are already correct: they were prerendered into the
 * HTML document. This only matters after an in-app link click, where the URL
 * changes without a new document — and for the article page, whose metadata
 * only exists once the post has loaded.
 *
 * During prerendering (server) this module is never called: effects do not run,
 * and the tags come from the HTML template instead.
 */

export function upsertMeta(selector: string, attrs: Record<string, string>) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    document.head.appendChild(element);
  }
  for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, value);
}

export function upsertLink(rel: string, href: string) {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
}

/**
 * Replaces every JSON-LD block in the document with `graph`.
 *
 * The prerendered documents carry an unlabelled `application/ld+json` block, so
 * removing only this module's own node would leave two graphs behind after a
 * client-side navigation. Exactly one route graph may exist at a time.
 */
export function upsertJsonLd(graph: unknown) {
  document.head
    .querySelectorAll('script[type="application/ld+json"]')
    .forEach((node) => node.remove());

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = 'route-jsonld';
  script.textContent = JSON.stringify(graph);
  document.head.appendChild(script);
}

/**
 * Writes the tags `head.ts` would have rendered into a prerendered document.
 *
 * The article page calls this with a derived `RouteMeta` once its post arrives,
 * so a client-side navigation to `/fyi/<slug>/` ends up with the same title,
 * canonical, OG image and JSON-LD a fresh page load would have served.
 */
export function applyRouteHead(meta: RouteMeta, jsonLd?: unknown) {
  document.title = meta.title;

  upsertMeta('meta[name="description"]', { name: 'description', content: meta.description });
  upsertMeta('meta[name="robots"]', {
    name: 'robots',
    content: meta.noindex ? 'noindex, follow' : 'index, follow, max-image-preview:large',
  });
  upsertLink('canonical', canonicalFor(meta));

  upsertMeta('meta[property="og:type"]', { property: 'og:type', content: meta.ogType });
  upsertMeta('meta[property="og:title"]', { property: 'og:title', content: meta.title });
  upsertMeta('meta[property="og:description"]', {
    property: 'og:description',
    content: meta.description,
  });
  upsertMeta('meta[property="og:url"]', { property: 'og:url', content: canonicalFor(meta) });
  upsertMeta('meta[property="og:image"]', {
    property: 'og:image',
    content: absolute(meta.ogImage),
  });

  upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: meta.title });
  upsertMeta('meta[name="twitter:description"]', {
    name: 'twitter:description',
    content: meta.description,
  });

  if (jsonLd !== undefined) upsertJsonLd(jsonLd);
}

function absolute(path: string): string {
  return /^https?:\/\//i.test(path) ? path : `${window.location.origin}${path}`;
}
