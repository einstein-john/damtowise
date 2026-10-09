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

const container = document.getElementById('root')!;

/**
 * `npm run build` prerenders the app into index.html, so crawlers and social
 * scrapers see real content without running JavaScript. When that markup is
 * present we hydrate it in place rather than re-rendering, which avoids a
 * flash of empty page while the bundle downloads. A dev server (or any host
 * serving a hand-written index.html) has no markup, so it mounts normally.
 *
 * SSR and the first client render produce identical output — every
 * browser-only concern lives in an effect or an event handler — so hydration
 * should always match. If it ever doesn't, React falls back to a client
 * render on its own.
 */
const isPrerendered = container.childElementCount > 0;

if (isPrerendered) {
  hydrateRoot(
    container,
    <React.StrictMode>
      <PostHogProvider client={posthog}>
        <App />
      </PostHogProvider>
    </React.StrictMode>,
  );
} else {
  createRoot(container).render(
    <React.StrictMode>
      <PostHogProvider client={posthog}>
        <App />
      </PostHogProvider>
    </React.StrictMode>,
  );
}
