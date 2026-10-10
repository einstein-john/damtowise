import React from 'react';
import {
  FyiApiError,
  getPost as getPostBySlug,
  listAllPublishedPosts,
  listTags,
  listWorklog,
} from './api';
import { FYI_API_CONFIGURED } from './config';
import { CATALOG_BOOTSTRAP_ID, CATALOG_POST_BOOTSTRAP_ID } from './bootstrap-id';
import { fyiCatalog, publishedArticle } from './manifest';
import type { FyiPostDetail, FyiPostSummary, FyiTag, FyiWorklogItem } from './types';

/**
 * Shared FYI catalogue.
 *
 * The blog index and the article page's "related" rail want the same lists.
 * Loading them once, in a provider, means an in-app navigation from `/fyi/` to
 * `/fyi/<slug>/` costs zero extra requests and never shows a second loading
 * state for the same data.
 *
 * The initial state is whatever the prerender step embedded in the document
 * (`<script type="application/json" id="fyi-catalog">`), which is what lets a
 * cold load hydrate without a flash. Once that is spent — or on an in-app
 * navigation — the provider fetches the live catalogue instead.
 */

type LoadState = 'idle' | 'loading' | 'ready' | 'error';

interface FyiCatalogValue {
  posts: FyiPostSummary[];
  tags: FyiTag[];
  worklog: FyiWorklogItem[];
  state: LoadState;
  error: string | null;
  reload: () => void;
}

const EMPTY: FyiCatalogValue = {
  posts: [],
  tags: [],
  worklog: [],
  state: 'idle',
  error: null,
  reload: () => {},
};

const FyiCatalogContext = React.createContext<FyiCatalogValue>(EMPTY);

function describe(cause: unknown): string {
  if (cause instanceof FyiApiError) return cause.message;
  if (cause instanceof Error) return cause.message;
  return 'Could not reach the FYI API.';
}

export function FyiCatalogProvider({ children }: { children: React.ReactNode }) {
  const [value, setValue] = React.useState<FyiCatalogValue>(() => initialCatalog() ?? EMPTY);
  const [nonce, setNonce] = React.useState(0);

  React.useEffect(() => {
    if (!FYI_API_CONFIGURED) {
      setValue((current) => ({
        ...current,
        state: 'error',
        error: 'The FYI API base URL is not configured for this build.',
      }));
      return;
    }

    let cancelled = false;

    // Already populated by the prerender step, so a cold load has nothing to download.
    if (initialCatalog()) {
      setValue((current) => ({ ...current, state: 'ready', error: null }));
      return;
    }

    setValue((current) => ({ ...current, state: 'loading', error: null }));

    // The three reads are independent, so one failing must not blank the other
    // two — a missing work-log gallery is a smaller problem than a missing list
    // of articles.
    (async () => {
      const [posts, tags, worklog] = await Promise.allSettled([
        listAllPublishedPosts().catch(() => [] as FyiPostSummary[]),
        listTags(),
        listWorklog(),
      ]);

      if (cancelled) return;

      const failed = [posts, tags, worklog].filter(
        (result): result is PromiseRejectedResult => result.status === 'rejected',
      );

      setValue({
        posts: posts.status === 'fulfilled' ? posts.value : [],
        tags: tags.status === 'fulfilled' ? tags.value : [],
        worklog: worklog.status === 'fulfilled' ? worklog.value : [],
        state: failed.length === 0 ? 'ready' : 'error',
        error: failed.length > 0 ? describe(failed[0].reason) : null,
        reload: () => setNonce((n) => n + 1),
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [nonce]);

  return <FyiCatalogContext.Provider value={value}>{children}</FyiCatalogContext.Provider>;
}

export function useFyiCatalog(): FyiCatalogValue {
  return React.useContext(FyiCatalogContext);
}

/**
 * A single published post.
 *
 * On a cold load of `/fyi/<slug>/` the document already carries the post, so
 * the first render is complete and hydration matches exactly. Navigating
 * inside the app fetches instead.
 */
export function useFyiPost(slug: string | null) {
  const [post, setPost] = React.useState<FyiPostDetail | null>(() => resolvePost(slug));
  const [state, setState] = React.useState<'loading' | 'ready' | 'error'>(() =>
    resolvePost(slug) ? 'ready' : 'loading',
  );
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!slug) return;

    const resolved = resolvePost(slug);
    if (resolved) {
      setPost(resolved);
      setState('ready');
      setError(null);
      return;
    }

    let cancelled = false;
    setState('loading');

    (async () => {
      try {
        const found = await getPostBySlug(slug);
        if (cancelled) return;
        setPost(found);
        setState('ready');
        setError(null);
      } catch (cause) {
        if (cancelled) return;
        setPost(null);
        setState('error');
        // The API returns a bare 404 for anything unpublished, so a miss and an
        // unpublished post are deliberately indistinguishable to the visitor.
        setError(
          cause instanceof FyiApiError && cause.status === 404
            ? 'That article is not published (yet).'
            : describe(cause),
        );
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [slug]);

  return { post, state, error };
}

/**
 * Where the current post comes from: the build manifest on the server, the
 * embedded JSON in the browser. Both are synchronous, which is what lets the
 * first client render match the prerendered markup.
 */
function resolvePost(slug: string | null): FyiPostDetail | null {
  if (!slug) return null;

  // Only reachable while the prerenderer is rendering this document.
  const fromManifest = publishedArticle(slug);
  if (fromManifest) return fromManifest;

  return readArticleBootstrap(slug);
}

/**
 * The initial catalogue, from whichever source has it.
 *
 * The server render reads the build manifest (the prerender step populated it
 * before rendering); the browser reads the JSON that same step embedded. Both
 * are synchronous, which is what lets the first client render match the
 * prerendered markup — a mismatch here would flash a skeleton on every cold
 * load.
 *
 * An empty payload does not count as "populated": a build that could not reach
 * the API still embeds an empty block, and treating that as data would stop the
 * browser from ever fetching the real catalogue.
 */
function initialCatalog(): FyiCatalogValue | null {
  const manifest = fyiCatalog();
  if (manifest.posts.length > 0) {
    return {
      posts: manifest.posts,
      tags: manifest.tags,
      worklog: manifest.worklog,
      state: 'ready',
      error: null,
      reload: () => {},
    };
  }

  return embeddedCatalog();
}

/** Reads the catalogue the prerender step embedded, if this document has one. */
function embeddedCatalog(): FyiCatalogValue | null {
  if (typeof document === 'undefined') return null;

  const node = document.getElementById(CATALOG_BOOTSTRAP_ID);
  if (!node?.textContent) return null;

  try {
    const parsed = JSON.parse(node.textContent) as Omit<
      FyiCatalogValue,
      'state' | 'error' | 'reload'
    >;
    if (!Array.isArray(parsed.posts) || parsed.posts.length === 0) return null;
    return {
      posts: parsed.posts,
      tags: parsed.tags ?? [],
      worklog: parsed.worklog ?? [],
      state: 'ready',
      error: null,
      reload: () => {},
    };
  } catch {
    return null;
  }
}

/**
 * Reads the post the prerender step embedded in this document.
 *
 * Only ever populated on a cold load of an article route, which is exactly when
 * it matters — and only when the slug matches, so a stale bootstrap can never
 * render the wrong article after a navigation.
 */
function readArticleBootstrap(slug: string): FyiPostDetail | null {
  if (typeof document === 'undefined') return null;

  const node = document.getElementById(CATALOG_POST_BOOTSTRAP_ID);
  if (!node?.textContent) return null;

  try {
    const post = JSON.parse(node.textContent) as FyiPostDetail;
    return post.slug === slug ? post : null;
  } catch {
    return null;
  }
}
