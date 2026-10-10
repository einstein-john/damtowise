import React from 'react';
import { type RouteMeta } from '@/app/data/routes';
import { jsonLdFor } from '@/app/data/json-ld';
import { applyRouteHead } from '@/app/lib/head-tags';
import { fyiCatalog } from '@/app/lib/fyi/manifest';

/**
 * Mirrors the active route's metadata into <head> after a client-side
 * navigation.
 *
 * Static routes own their tags through `lib/head.ts` at build time; this writes
 * the same values into the live document when the router swaps pages without a
 * reload, using the same JSON-LD graph the build emits.
 *
 * Routes marked `dynamic` are skipped here: `/fyi/<slug>/` fills in its own tags
 * from the loaded post, and `/admin` is `noindex` no matter what it renders.
 */
export function DocumentHead({ meta }: { meta: RouteMeta | undefined }) {
  React.useEffect(() => {
    if (!meta) return;
    if (meta.dynamic) return;

    applyRouteHead(meta, jsonLdFor(meta, fyiCatalog().posts));
  }, [meta]);

  return null;
}
