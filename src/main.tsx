import React from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import type posthogType from 'posthog-js';
import { PostHogProvider } from '@posthog/react';

import App from '@/app/App';
import '@/styles/index.css';

/**
 * PostHog is loaded asynchronously so its polyfills, recorder and surveys
 * never enter the main chunk or block first paint. The app renders without
 * it; once ready, the provider wraps the tree and recording starts.
 */
let posthogClient: typeof posthogType | null = null;

async function loadPostHog() {
  const mod = await import('posthog-js');
  const client = mod.default;
  client.init(import.meta.env.VITE_PUBLIC_POSTHOG_TOKEN, {
    api_host: import.meta.env.VITE_PUBLIC_POSTHOG_HOST,
    defaults: '2026-01-30',
  });
  posthogClient = client;
  // Force a re-render so PostHogProvider picks up the client.
  window.dispatchEvent(new Event('posthog:ready'));
}

if (document.readyState === 'complete') {
  void loadPostHog();
} else {
  window.addEventListener('load', () => void loadPostHog(), { once: true });
}

function Root() {
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    const onReady = () => setReady(true);
    window.addEventListener('posthog:ready', onReady, { once: true });
    return () => window.removeEventListener('posthog:ready', onReady);
  }, []);
  if (!ready || !posthogClient) return null;
  return (
    <PostHogProvider client={posthogClient}>
      <App />
    </PostHogProvider>
  );
}

const container = document.getElementById('root');
if (!container) {
  throw new Error('[app] #root mount point not found. The served document is not the app shell.');
}

const tree = (
  <React.StrictMode>
    <Root />
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
