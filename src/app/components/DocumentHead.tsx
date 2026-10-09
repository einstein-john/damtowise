import React from 'react';
import { canonicalFor, type RouteMeta } from '@/app/data/routes';

/**
 * Keeps <head> in sync with the active route during client-side navigation.
 *
 * On first load the tags are already correct: they were prerendered into the
 * HTML document. This only matters after an in-app link click, where the URL
 * changes without a new document.
 *
 * During prerendering (server) this is a no-op — effects do not run — and the
 * tags come from the HTML template instead.
 */

function upsertMeta(selector: string, attrs: Record<string, string>) {
  let element = document.head.querySelector<HTMLMetaElement>(selector);
  if (!element) {
    element = document.createElement('meta');
    document.head.appendChild(element);
  }
  for (const [key, value] of Object.entries(attrs)) element.setAttribute(key, value);
}

function upsertLink(rel: string, href: string) {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!element) {
    element = document.createElement('link');
    element.setAttribute('rel', rel);
    document.head.appendChild(element);
  }
  element.setAttribute('href', href);
}

function upsertJsonLd(graph: unknown) {
  const id = 'route-jsonld';
  document.getElementById(id)?.remove();

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.id = id;
  script.textContent = JSON.stringify(graph);
  document.head.appendChild(script);
}

export function DocumentHead({ meta }: { meta: RouteMeta | undefined }) {
  React.useEffect(() => {
    if (!meta) return;

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

    upsertMeta('meta[name="twitter:title"]', { name: 'twitter:title', content: meta.title });
    upsertMeta('meta[name="twitter:description"]', {
      name: 'twitter:description',
      content: meta.description,
    });
  }, [meta]);

  // The structured data is emitted into the prerendered document, so it is only
  // injected here if something navigated without one (e.g. a client-side jump
  // to a path that was served by a host's SPA fallback).
  React.useEffect(() => {
    if (!meta) return;
    if (document.getElementById('route-jsonld') || document.getElementById('page-jsonld')) return;
    upsertJsonLd({ '@context': 'https://schema.org', '@graph': [] });
  }, [meta]);

  return null;
}
