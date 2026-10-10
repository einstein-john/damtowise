import { FYI_API_URL } from './config';
import type {
  FyiAdminIdentity,
  FyiMediaItem,
  FyiPage,
  FyiPostAdmin,
  FyiPostDraft,
  FyiPostSummary,
  FyiPostDetail,
  FyiPublishIssue,
  FyiTag,
  FyiWorklogItem,
} from './types';

/**
 * Error shape the API returns: `{ error, message?, issues? }`.
 *
 * Known failures keep their own status (`404` for an unpublished slug, `422`
 * for a schema violation, `409` for a slug clash, `403` for a non-admin token);
 * anything unrecognised is logged server-side and surfaced as a plain 500. The
 * UI shows `message` when it exists and falls back to a generic line, so an
 * internal detail never leaks to a visitor.
 */
export interface FyiApiErrorBody {
  error: string;
  message?: string;
  issues?: Array<{ path?: Array<string | number>; message: string }>;
}

export class FyiApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly issues: FyiApiErrorBody['issues'];

  constructor(status: number, body: FyiApiErrorBody | null) {
    super(body?.message ?? `Request failed with status ${status}`);
    this.name = 'FyiApiError';
    this.status = status;
    this.code = body?.error ?? 'unknown_error';
    this.issues = body?.issues;
  }

  /** True when the visitor is signed out or the token is no longer accepted. */
  get isAuthFailure(): boolean {
    return this.status === 401;
  }

  /** True when the account is valid but is not on `ADMIN_USER_IDS`. */
  get isForbidden(): boolean {
    return this.status === 403;
  }
}

async function parseError(response: Response): Promise<FyiApiError> {
  let body: FyiApiErrorBody | null = null;
  try {
    body = (await response.json()) as FyiApiErrorBody;
  } catch {
    // Non-JSON error (a proxy timeout, an HTML error page). Keep the status.
  }
  return new FyiApiError(response.status, body);
}

const JSON_HEADERS = { Accept: 'application/json' } as const;

async function request<T>(path: string, init: RequestInit = {}, token?: string | null): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');
  if (init.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (token) headers.set('Authorization', `Bearer ${token}`);

  const response = await fetch(`${FYI_API_URL}${path}`, {
    ...init,
    headers,
    // Bearer auth: no cookies are ever sent, on either side.
    credentials: 'omit',
    mode: 'cors',
  });

  if (!response.ok) throw await parseError(response);
  if (response.status === 204) return undefined as T;

  return (await response.json()) as T;
}

const query = (params: Record<string, string | number | undefined>) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') search.set(key, String(value));
  }
  const encoded = search.toString();
  return encoded ? `?${encoded}` : '';
};

/* ── Public reads ─────────────────────────────────────────────────────────── */

/** Published posts, newest first. */
export function listPosts(params?: { tag?: string; page?: number; pageSize?: number }) {
  return request<FyiPage<FyiPostSummary>>(`/posts${query({ ...params })}`, {
    headers: JSON_HEADERS,
  });
}

/** A published post by slug. 404 for anything unpublished — the API never hints. */
export function getPost(slug: string) {
  return request<FyiPostDetail>(`/posts/${encodeURIComponent(slug)}`, { headers: JSON_HEADERS });
}

export function listTags() {
  return request<FyiTag[]>(`/tags`, { headers: JSON_HEADERS });
}

/** Published work-log captures, in display order. */
export function listWorklog() {
  return request<FyiWorklogItem[]>(`/worklog`, { headers: JSON_HEADERS });
}

/* ── Admin reads and writes ───────────────────────────────────────────────── */

export function getAdminIdentity(token: string) {
  return request<FyiAdminIdentity>(`/admin/me`, { headers: JSON_HEADERS }, token);
}

export function listAdminPosts(token: string, params?: { page?: number; pageSize?: number }) {
  return request<FyiPage<FyiPostAdmin>>(
    `/admin/posts${query({ ...params })}`,
    { headers: JSON_HEADERS },
    token,
  );
}

export function getAdminPost(token: string, id: string) {
  return request<FyiPostAdmin>(
    `/admin/posts/${encodeURIComponent(id)}`,
    { headers: JSON_HEADERS },
    token,
  );
}

export function createPost(token: string, draft: FyiPostDraft) {
  return request<FyiPostAdmin>(
    `/admin/posts`,
    { method: 'POST', body: JSON.stringify(draft), headers: JSON_HEADERS },
    token,
  );
}

export function updatePost(token: string, id: string, patch: Partial<FyiPostDraft>) {
  return request<FyiPostAdmin>(
    `/admin/posts/${encodeURIComponent(id)}`,
    { method: 'PATCH', body: JSON.stringify(patch), headers: JSON_HEADERS },
    token,
  );
}

export function deletePost(token: string, id: string) {
  return request<void>(
    `/admin/posts/${encodeURIComponent(id)}`,
    { method: 'DELETE', headers: JSON_HEADERS },
    token,
  );
}

export function publishPost(token: string, id: string) {
  return request<{ id: string; status: FyiPostAdmin['status']; ogImageUrl: string | null }>(
    `/admin/posts/${encodeURIComponent(id)}/publish`,
    { method: 'POST', headers: JSON_HEADERS },
    token,
  );
}

export function unpublishPost(token: string, id: string) {
  return request<{ id: string; status: FyiPostAdmin['status'] }>(
    `/admin/posts/${encodeURIComponent(id)}/unpublish`,
    { method: 'POST', headers: JSON_HEADERS },
    token,
  );
}

/** Reports blockers without changing anything, so the editor can show them live. */
export function getPublishReadiness(token: string, id: string) {
  return request<{ ready: boolean; issues: FyiPublishIssue[] }>(
    `/admin/posts/${encodeURIComponent(id)}/publish-readiness`,
    { headers: JSON_HEADERS },
    token,
  );
}

export function listMedia(token: string, params?: { page?: number; pageSize?: number }) {
  return request<FyiPage<FyiMediaItem>>(
    `/admin/media${query({ ...params })}`,
    { headers: JSON_HEADERS },
    token,
  );
}

/**
 * Multipart upload. Declared type, magic bytes and size are all checked on the
 * server before Cloudinary is contacted, so a rejected file costs nothing.
 */
export async function uploadMedia(
  token: string,
  file: File,
  fields: { alt?: string | null; caption?: string | null; decorative?: boolean },
) {
  const form = new FormData();
  form.append('file', file);
  if (fields.alt) form.append('alt', fields.alt);
  if (fields.caption) form.append('caption', fields.caption);
  form.append('decorative', String(Boolean(fields.decorative)));

  return request<FyiMediaItem>(`/admin/media`, { method: 'POST', body: form }, token);
}

export function updateMedia(
  token: string,
  id: string,
  patch: { alt?: string | null; caption?: string | null; decorative?: boolean },
) {
  return request<FyiMediaItem>(
    `/admin/media/${encodeURIComponent(id)}`,
    { method: 'PATCH', body: JSON.stringify(patch), headers: JSON_HEADERS },
    token,
  );
}

export function deleteMedia(token: string, id: string) {
  return request<void>(
    `/admin/media/${encodeURIComponent(id)}`,
    { method: 'DELETE', headers: JSON_HEADERS },
    token,
  );
}

export function listAdminTags(token: string) {
  return request<FyiTag[]>(`/admin/tags`, { headers: JSON_HEADERS }, token);
}

export function createTag(token: string, name: string, slug?: string) {
  return request<FyiTag>(
    `/admin/tags`,
    {
      method: 'POST',
      body: JSON.stringify({ name, ...(slug ? { slug } : {}) }),
      headers: JSON_HEADERS,
    },
    token,
  );
}

export function updateTag(token: string, id: string, patch: { name?: string; slug?: string }) {
  return request<FyiTag>(
    `/admin/tags/${encodeURIComponent(id)}`,
    { method: 'PATCH', body: JSON.stringify(patch), headers: JSON_HEADERS },
    token,
  );
}

export function deleteTag(token: string, id: string) {
  return request<void>(
    `/admin/tags/${encodeURIComponent(id)}`,
    { method: 'DELETE', headers: JSON_HEADERS },
    token,
  );
}

export function listAdminWorklog(token: string) {
  return request<FyiWorklogItem[]>(`/admin/worklog`, { headers: JSON_HEADERS }, token);
}

export function createWorklogItem(
  token: string,
  input: {
    title: string;
    caption?: string | null;
    tag?: string | null;
    sortOrder?: number;
    published?: boolean;
    mediaId?: string | null;
  },
) {
  return request<FyiWorklogItem>(
    `/admin/worklog`,
    { method: 'POST', body: JSON.stringify(input), headers: JSON_HEADERS },
    token,
  );
}

export function updateWorklogItem(
  token: string,
  id: string,
  patch: Partial<{
    title: string;
    caption: string | null;
    tag: string | null;
    sortOrder: number;
    published: boolean;
    mediaId: string | null;
  }>,
) {
  return request<FyiWorklogItem>(
    `/admin/worklog/${encodeURIComponent(id)}`,
    { method: 'PATCH', body: JSON.stringify(patch), headers: JSON_HEADERS },
    token,
  );
}

export function deleteWorklogItem(token: string, id: string) {
  return request<void>(
    `/admin/worklog/${encodeURIComponent(id)}`,
    { method: 'DELETE', headers: JSON_HEADERS },
    token,
  );
}

/** Bulk reorder: the drag-and-drop list sends the whole order in one call. */
export function reorderWorklog(token: string, items: Array<{ id: string; sortOrder: number }>) {
  return request<void>(
    `/admin/worklog/reorder`,
    { method: 'POST', body: JSON.stringify({ items }), headers: JSON_HEADERS },
    token,
  );
}
