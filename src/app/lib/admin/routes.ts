import React from 'react';
import { ADMIN_PATH } from '@/app/data/routes';

/**
 * Sub-routing for the admin console.
 *
 * The console is one client-rendered app, but its views still own real URLs —
 * `/admin/posts/`, `/admin/posts/<id>/`, `/admin/worklog/` — so a reload or a
 * shared link lands in the right place and the browser's back button works.
 *
 * Nothing here is prerendered: `robots.txt` disallows `/admin/`, `vercel.json`
 * sends `X-Robots-Tag: noindex, nofollow` for it, and it is never in the
 * sitemap.
 */

export type AdminView = 'posts' | 'editor' | 'worklog' | 'media' | 'tags';

export interface AdminRoute {
  view: AdminView;
  /** Post id for the editor, or `null` when creating a new post. */
  postId: string | null;
  /** True when the editor was opened as "new post" rather than an edit. */
  isNew: boolean;
}

const NEW_POST = 'new';

/** Parses `/admin/<view>/[<id>/]` into a view and its parameter. */
export function parseAdminRoute(path: string): AdminRoute {
  const rest = normalise(path);

  if (rest.startsWith('worklog')) return { view: 'worklog', postId: null, isNew: false };
  if (rest.startsWith('media')) return { view: 'media', postId: null, isNew: false };
  if (rest.startsWith('tags')) return { view: 'tags', postId: null, isNew: false };

  if (rest.startsWith('posts')) {
    const id = rest.slice('posts'.length).replace(/^\/+|\/+$/g, '');
    if (!id) return { view: 'posts', postId: null, isNew: false };
    if (id === NEW_POST) return { view: 'editor', postId: null, isNew: true };

    const match = /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i.exec(id);
    if (match) return { view: 'editor', postId: match[1], isNew: false };
  }

  return { view: 'posts', postId: null, isNew: false };
}

function normalise(path: string): string {
  const withoutBase = path.startsWith(ADMIN_PATH) ? path.slice(ADMIN_PATH.length) : path;
  return withoutBase.replace(/^\/+|\/+$/g, '').toLowerCase();
}

/** Builds the URL for an admin view, so navigation has one source of truth. */
export function adminHref(view: AdminView, postId?: string | null): string {
  switch (view) {
    case 'posts':
      return `${ADMIN_PATH}posts/`;
    case 'editor':
      return postId ? `${ADMIN_PATH}posts/${postId}/` : `${ADMIN_PATH}posts/${NEW_POST}/`;
    case 'worklog':
      return `${ADMIN_PATH}worklog/`;
    case 'media':
      return `${ADMIN_PATH}media/`;
    case 'tags':
      return `${ADMIN_PATH}tags/`;
  }
}
