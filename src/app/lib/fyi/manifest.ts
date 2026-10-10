import type { FyiPostDetail, FyiPostSummary, FyiTag, FyiWorklogItem } from './types';

/**
 * Build-time catalogue.
 *
 * The React render that produces every prerendered document is synchronous, so
 * a page cannot `await` an API call while it is being rendered. Instead the
 * prerender step loads the catalogue first and parks it here; the FYI pages read
 * it synchronously during the server pass and fall back to a live fetch in the
 * browser. The result: a cold load of `/fyi/<slug>/` contains the whole article
 * in its HTML, and hydration matches because the same data is also embedded in
 * the document.
 *
 * In the browser the manifest is always empty (the SSR bundle never runs
 * there), so nothing about the client path depends on it.
 */

export interface FyiCatalog {
  posts: FyiPostSummary[];
  tags: FyiTag[];
  worklog: FyiWorklogItem[];
  /** Full post bodies, needed to prerender an article document. */
  articles: FyiPostDetail[];
}

const EMPTY: FyiCatalog = { posts: [], tags: [], worklog: [], articles: [] };

let catalog: FyiCatalog = EMPTY;

export function setFyiCatalog(next: FyiCatalog): void {
  catalog = next;
}

export function fyiCatalog(): FyiCatalog {
  return catalog;
}

/** The published post a prerendered document is about, if the build resolved it. */
export function publishedArticle(slug: string | null): FyiPostDetail | null {
  if (!slug) return null;
  return catalog.articles.find((post) => post.slug === slug) ?? null;
}
