import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import posthog from 'posthog-js';
import { PostHogProvider } from '@posthog/react';

import App from '@/app/App';
import '@/styles/index.css';

/**
 * Defer PostHog until after first paint so its polyfills and recorder bundle
 * never block LCP or contribute to total blocking time.
 */
function initPostHog() {
  posthog.init(import.meta.env.VITE_PUBLIC_POSTHOG_TOKEN, {
    api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
    defaults: '2026-01-30',
  });
}

if (document.readyState === 'complete') {
  initPostHog();
} else {
  window.addEventListener('load', initPostHog, { once: true });
}

const container = document.getElementById('root');
if (!container) {
  throw new Error('[app] #root mount point not found. The served document is not the app shell.');
}

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
