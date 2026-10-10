import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import posthog from 'posthog-js';
import { PostHogProvider } from '@posthog/react';

import App from '@/app/App';
import '@/styles/index.css';

posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_TOKEN, {
  api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
  defaults: '2026-01-30',
});

/**
 * Resolve the mount point, creating it if the document doesn't have one.
 *
 * This used to be `getElementById('root')!`. A non-null assertion only
 * silences TypeScript — it does nothing at runtime, so any document served
 * without the mount point (stale cached HTML, a host serving a different
 * shell, a 404 document) threw `TypeError: Cannot read properties of null`
 * before React ever mounted, leaving a blank page with no error boundary in
 * sight. Recreating the node is two lines and turns a total failure into a
 * working page.
 */
function resolveContainer(): HTMLElement {
  const existing = document.getElementById('root');
  if (existing) return existing;

  const created = document.createElement('div');
  created.id = 'root';
  document.body.prepend(created);
  console.warn('[app] #root was missing from the document; created a fresh mount point.');
  return created;
}

const container = resolveContainer();

const tree = (
  <React.StrictMode>
    <PostHogProvider client={posthog}>
      <App />
    </PostHogProvider>
  </React.StrictMode>
);

/**
 * `npm run build` prerenders the app into each route's HTML, so crawlers and
 * social scrapers see real content without running JavaScript. When that
 * markup is present we hydrate it in place instead of re-rendering, which
 * avoids a flash of empty page while the bundle downloads.
 *
 * Hydration is an optimisation, not a requirement: if the markup does not
 * match, React recovers by rendering on the client. A document with no
 * prerendered markup (dev server, hand-written HTML) mounts normally.
 */
const hasPrerenderedMarkup = container.childElementCount > 0;

if (hasPrerenderedMarkup) {
  hydrateRoot(container, tree);
} else {
  createRoot(container).render(tree);
}
