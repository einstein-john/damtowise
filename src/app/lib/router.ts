import React from 'react';
import { HOME_PATH, ROUTES, routeForPath, type RouteMeta } from '@/app/data/routes';

/**
 * A very small client-side router.
 *
 * There is no routing library here on purpose: the site prerenders to static
 * HTML, so every destination is a real document with its own canonical, meta
 * and JSON-LD. The router only exists to make in-app link clicks feel like
 * navigation instead of a full page load, and to let the head tags update when
 * they do. Anything that works without JavaScript still works — the <a href>
 * targets are the prerendered files.
 */

const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) listener();
}

/**
 * Set by the prerender step before rendering a route, so the server can render
 * the page that matches the document it is about to write. Unused in the
 * browser, where the URL is the source of truth.
 */
let serverPath: string | undefined;

export function setServerPath(path: string) {
  serverPath = path;
}

function currentPath(): string {
  if (typeof window === 'undefined') return serverPath ?? HOME_PATH;
  return window.location.pathname;
}

/** True when the router should take over a click on this link. */
function isRoutable(anchor: HTMLAnchorElement, event: MouseEvent): boolean {
  if (event.defaultPrevented) return false;
  if (event.button !== 0) return false;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false;

  const href = anchor.getAttribute('href');
  if (!href || anchor.target === '_blank' || anchor.hasAttribute('download')) return false;
  if (anchor.getAttribute('rel')?.includes('external')) return false;

  // Only same-origin, non-anchored links are handled. Fragment-only links stay
  // with the browser so in-page anchors keep working.
  const url = new URL(anchor.href, window.location.href);
  if (url.origin !== window.location.origin) return false;
  if (url.pathname === currentPath() && url.hash) return false;

  return Boolean(routeForPath(url.pathname));
}

function onDocumentClick(event: MouseEvent) {
  const target = event.target;
  if (!(target instanceof Element)) return;

  const anchor = target.closest('a');
  if (!anchor) return;
  if (!isRoutable(anchor, event)) return;

  const url = new URL(anchor.href, window.location.href);
  event.preventDefault();
  navigate(url.pathname + url.hash);
}

let listening = false;

function startListening() {
  if (listening || typeof window === 'undefined') return;
  listening = true;
  window.addEventListener('popstate', notify);
  document.addEventListener('click', onDocumentClick);
}

export function navigate(href: string) {
  if (typeof window === 'undefined') return;
  const url = new URL(href, window.location.href);
  if (url.origin !== window.location.origin) {
    window.location.href = href;
    return;
  }
  window.history.pushState({}, '', url.pathname + url.search + url.hash);
  notify();

  if (url.hash) {
    const target = document.getElementById(url.hash.slice(1));
    if (target) target.scrollIntoView({ behavior: 'smooth' });
    else window.scrollTo(0, 0);
  } else {
    window.scrollTo(0, 0);
  }
}

export interface Route {
  meta: RouteMeta | undefined;
  isNotFound: boolean;
  /** The path the router resolved, normalised. Needed by pages that read it. */
  path: string;
}

/** Subscribes to URL changes and resolves the current route. */
export function useRoute(): Route {
  const [path, setPath] = React.useState(currentPath);

  React.useEffect(() => {
    startListening();
    const listener = () => setPath(currentPath());
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const meta = React.useMemo(() => routeForPath(path), [path]);
  return { meta, isNotFound: !meta, path };
}

/** All prerenderable routes, for the build step. */
export const ALL_ROUTES = ROUTES;
