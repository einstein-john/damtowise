/**
 * Wire shapes for the FYI API (`api.damtowise.xyz`).
 *
 * These are hand-mirrored from `damtowiseFyi/src/contracts/domain.ts` on purpose:
 * the site is a separate deployable with no build-time dependency on the API
 * package, so the contract lives twice and both ends have to stay honest. When
 * the backend changes a field, this file is the other half of that change —
 * `pnpm typecheck` will fail at every call site until they agree.
 */

export type FyiPostStatus = 'draft' | 'published' | 'scheduled';

export interface FyiTag {
  id: string;
  name: string;
  slug: string;
}

/** Everything a listing card needs. `status` only exists on admin responses. */
export interface FyiPostSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  coverImageUrl: string | null;
  tags: FyiTag[];
  publishedAt: string | null;
  readTime: number;
  status?: FyiPostStatus;
}

export interface FyiTocEntry {
  depth: number;
  slug: string;
  text: string;
}

/** A published post, as the article page consumes it. */
export interface FyiPostDetail extends FyiPostSummary {
  contentHtml: string;
  toc: FyiTocEntry[];
  seoTitle: string | null;
  seoDescription: string | null;
  canonicalUrl: string | null;
  noindex: boolean;
  ogImageUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

/** The same post as the admin console sees it: raw Markdown plus status. */
export interface FyiPostAdmin extends FyiPostDetail {
  status: FyiPostStatus;
  contentMd: string;
}

export interface FyiPage<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
}

export interface FyiWorklogItem {
  id: string;
  title: string;
  caption: string | null;
  tag: string | null;
  sortOrder: number;
  published: boolean;
  mediaId: string | null;
  imageUrl: string | null;
  imageAlt: string | null;
  imageWidth: number | null;
  imageHeight: number | null;
}

export interface FyiMediaItem {
  id: string;
  url: string;
  width: number;
  height: number;
  alt: string | null;
  decorative: boolean;
  caption: string | null;
  bytes: number;
  createdAt: string;
}

/** One blocking reason a post is not ready to publish. */
export interface FyiPublishIssue {
  field: 'slug' | 'contentMd' | 'excerpt' | 'seoTitle' | 'seoDescription' | 'altText';
  message: string;
}

/** Fields of a post the editor is allowed to send. */
export interface FyiPostDraft {
  title: string;
  slug?: string;
  excerpt?: string | null;
  contentMd: string;
  coverMediaId?: string | null;
  status?: FyiPostStatus;
  publishedAt?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  canonicalUrl?: string | null;
  noindex?: boolean;
  tagIds?: string[];
}

/** The verified admin identity, straight from `GET /admin/me`. */
export interface FyiAdminIdentity {
  userId: string;
  email: string | null;
}
