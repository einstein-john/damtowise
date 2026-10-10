import React from 'react';
import {
  ExternalLink,
  FilePlus2,
  Pencil,
  Rocket,
  Search,
  Trash2,
  Undo2,
  Users,
} from 'lucide-react';
import { formatRelative } from '@/app/lib/fyi/format';
import { useAdminAuth } from '@/app/lib/admin/auth';
import { adminHref } from '@/app/lib/admin/routes';
import { navigate } from '@/app/lib/router';
import { deletePost, listAdminPosts, publishPost, unpublishPost } from '@/app/lib/fyi/api';
import type { FyiPostAdmin, FyiPostStatus } from '@/app/lib/fyi/types';
import {
  EmptyState,
  FyiButton,
  FyiInput,
  Notice,
  Pill,
  SearchField,
  StatTile,
  StatusTag,
  SurfaceCard,
  cx,
} from '@/app/components/fyi/primitives';

/**
 * Post registry.
 *
 * The API's admin list is paginated and unfiltered, so this screen keeps the
 * filtering honest: it loads one page of 50 and filters locally, and only shows
 * pagination when there really are more posts than one page holds. Counting
 * rows the API never returned would be a lie the UI could not back up.
 */

const STATUS_FILTERS: Array<{ value: FyiPostStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'draft', label: 'Drafts' },
  { value: 'scheduled', label: 'Scheduled' },
];

const PAGE_SIZE = 50;

export function AdminPosts() {
  const { withToken } = useAdminAuth();

  const [posts, setPosts] = React.useState<FyiPostAdmin[]>([]);
  const [total, setTotal] = React.useState(0);
  const [page, setPage] = React.useState(1);
  const [state, setState] = React.useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = React.useState<string | null>(null);
  const [busyId, setBusyId] = React.useState<string | null>(null);
  const [confirmId, setConfirmId] = React.useState<string | null>(null);

  const [query, setQuery] = React.useState('');
  const [status, setStatus] = React.useState<FyiPostStatus | 'all'>('all');
  const [tagSlug, setTagSlug] = React.useState<string>('all');

  const load = React.useCallback(
    async (nextPage: number) => {
      setState('loading');
      try {
        const result = await withToken((token) =>
          listAdminPosts(token, { page: nextPage, pageSize: PAGE_SIZE }),
        );
        setPosts(result.items);
        setTotal(result.total);
        setPage(result.page);
        setState('ready');
        setError(null);
      } catch (cause) {
        setState('error');
        setError(cause instanceof Error ? cause.message : 'Could not load posts.');
      }
    },
    [withToken],
  );

  React.useEffect(() => {
    void load(1);
  }, [load]);

  const visible = React.useMemo(() => {
    const needle = query.trim().toLowerCase();
    return posts.filter((post) => {
      const matchesStatus = status === 'all' || post.status === status;
      const matchesTag = tagSlug === 'all' || post.tags.some((tag) => tag.slug === tagSlug);
      const matchesQuery =
        !needle ||
        post.title.toLowerCase().includes(needle) ||
        post.slug.toLowerCase().includes(needle) ||
        post.tags.some((tag) => tag.name.toLowerCase().includes(needle));
      return matchesStatus && matchesTag && matchesQuery;
    });
  }, [posts, query, status, tagSlug]);

  const counts = React.useMemo(
    () => ({
      published: posts.filter((post) => post.status === 'published').length,
      draft: posts.filter((post) => post.status === 'draft').length,
      scheduled: posts.filter((post) => post.status === 'scheduled').length,
    }),
    [posts],
  );

  const allTags = React.useMemo(() => {
    const seen = new Map<string, string>();
    for (const post of posts) for (const tag of post.tags) seen.set(tag.slug, tag.name);
    return [...seen.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [posts]);

  const runAction = async (id: string, action: 'publish' | 'unpublish' | 'delete') => {
    setBusyId(id);
    try {
      await withToken(async (token) => {
        if (action === 'publish') await publishPost(token, id);
        if (action === 'unpublish') await unpublishPost(token, id);
        if (action === 'delete') await deletePost(token, id);
      });
      setConfirmId(null);
      await load(page);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Action failed.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="flex flex-col gap-space-md">
      <section className="grid grid-cols-1 gap-space-md sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Published"
          value={counts.published}
          hint="live on the site"
          icon={Rocket}
        />
        <StatTile label="Drafts" value={counts.draft} hint="not listed" icon={FilePlus2} />
        <StatTile label="Scheduled" value={counts.scheduled} hint="armed timer" icon={Users} />
        <StatTile
          label="In registry"
          value={total}
          hint={`${posts.length} on page ${page}`}
          icon={Search}
        />
      </section>

      <div className="flex flex-col gap-space-md rounded-lg border border-fyi-stroke bg-fyi-surface p-space-md">
        <div className="flex flex-col gap-space-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl flex-1">
            <SearchField
              label="Search posts"
              value={query}
              onChange={setQuery}
              placeholder="Search posts by title, tag or slug…"
            />
          </div>

          <div className="flex flex-wrap items-center gap-space-sm">
            <FyiInput
              aria-label="Filter by tag"
              value={tagSlug}
              onChange={(event) => setTagSlug(event.target.value)}
              className="w-auto"
              list="admin-tag-options"
              placeholder="tag"
            />
            <datalist id="admin-tag-options">
              <option value="all" />
              {allTags.map(([slug, name]) => (
                <option key={slug} value={slug}>
                  {name}
                </option>
              ))}
            </datalist>

            <FyiButton
              variant="primary"
              icon={FilePlus2}
              onClick={() => navigate(adminHref('editor', null))}
            >
              + Create new post
            </FyiButton>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-space-xs font-label text-label-sm">
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatus(filter.value)}
              aria-pressed={status === filter.value}
              className={cx(
                'rounded-full px-space-md py-1.5 transition-colors',
                status === filter.value
                  ? 'bg-fyi-flame font-semibold text-fyi-flame-deep'
                  : 'bg-fyi-well text-fyi-ink-faint hover:text-fyi-ink',
              )}
            >
              {filter.label}
              {filter.value !== 'all' && ` (${counts[filter.value]})`}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <Notice tone="error" title="Something went wrong">
          {error}
        </Notice>
      )}

      {state === 'loading' ? (
        <SurfaceCard className="p-space-lg" interactive={false}>
          <p className="font-label text-label-md text-fyi-ink-faint">Loading registry…</p>
        </SurfaceCard>
      ) : visible.length === 0 ? (
        <EmptyState
          title="No posts here yet"
          action={
            <FyiButton
              variant="primary"
              icon={FilePlus2}
              onClick={() => navigate(adminHref('editor', null))}
            >
              Write the first one
            </FyiButton>
          }
        >
          {posts.length === 0
            ? 'The registry is empty. Create a draft, fill in an excerpt, and the publish pipeline will tell you what is still missing.'
            : 'Nothing matches the current filters.'}
        </EmptyState>
      ) : (
        <SurfaceCard className="overflow-hidden" interactive={false}>
          <div className="flex items-center justify-between border-b border-fyi-stroke bg-fyi-surface-low px-space-md py-2">
            <span className="font-code text-code-md text-fyi-ink-faint">
              cluster://damto/fyi/content/posts
            </span>
            <span className="font-label text-label-sm text-fyi-flame">
              {visible.length} shown · {total} total
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-fyi-well font-label text-label-sm uppercase tracking-wider text-fyi-ink-faint">
                  <th className="px-space-md py-3">Title &amp; slug</th>
                  <th className="px-space-md py-3">Tags</th>
                  <th className="px-space-md py-3">Status</th>
                  <th className="px-space-md py-3">Read</th>
                  <th className="px-space-md py-3">Modified</th>
                  <th className="px-space-md py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-fyi-stroke font-body text-body-sm text-fyi-ink">
                {visible.map((post) => (
                  <tr key={post.id} className="transition-colors hover:bg-fyi-surface/60">
                    <td className="px-space-md py-3.5">
                      <div className="flex flex-col gap-0.5">
                        <a
                          href={adminHref('editor', post.id)}
                          className="font-display text-headline-sm text-fyi-ink transition-colors hover:text-fyi-flame"
                        >
                          {post.title}
                        </a>
                        <span className="font-code text-code-md text-fyi-ink-faint">
                          /fyi/{post.slug}
                        </span>
                      </div>
                    </td>

                    <td className="px-space-md py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {post.tags.length === 0 ? (
                          <span className="font-label text-label-sm text-fyi-ink-faint">none</span>
                        ) : (
                          post.tags.map((tag) => <Pill key={tag.id}>{tag.name}</Pill>)
                        )}
                      </div>
                    </td>

                    <td className="px-space-md py-3.5">
                      <StatusTag status={post.status} />
                    </td>

                    <td className="px-space-md py-3.5 font-code text-code-md text-fyi-ink-dim">
                      {post.readTime} min
                    </td>

                    <td className="px-space-md py-3.5 font-label text-label-sm text-fyi-ink-faint">
                      {formatRelative(post.updatedAt)}
                    </td>

                    <td className="px-space-md py-3.5">
                      <div className="flex items-center justify-end gap-1">
                        <FyiButton
                          size="sm"
                          title="Edit"
                          aria-label={`Edit ${post.title}`}
                          onClick={() => navigate(adminHref('editor', post.id))}
                        >
                          <Pencil className="h-4 w-4" aria-hidden="true" />
                        </FyiButton>

                        {post.status === 'published' && (
                          <a
                            href={`/fyi/${post.slug}/`}
                            title="Open the live article"
                            aria-label={`Open ${post.title}`}
                            className="inline-flex h-8 items-center rounded px-space-sm text-fyi-ink-dim hover:bg-fyi-surface-high hover:text-fyi-ink"
                          >
                            <ExternalLink className="h-4 w-4" aria-hidden="true" />
                          </a>
                        )}

                        {post.status === 'published' ? (
                          <FyiButton
                            size="sm"
                            icon={Undo2}
                            disabled={busyId === post.id}
                            onClick={() => void runAction(post.id, 'unpublish')}
                            title="Unpublish"
                          >
                            Unpublish
                          </FyiButton>
                        ) : (
                          <FyiButton
                            size="sm"
                            variant="primary"
                            icon={Rocket}
                            disabled={busyId === post.id}
                            onClick={() => void runAction(post.id, 'publish')}
                            title="Publish now"
                          >
                            Publish
                          </FyiButton>
                        )}

                        {confirmId === post.id ? (
                          <span className="flex items-center gap-1">
                            <FyiButton
                              size="sm"
                              variant="danger"
                              disabled={busyId === post.id}
                              onClick={() => void runAction(post.id, 'delete')}
                            >
                              Confirm delete
                            </FyiButton>
                            <FyiButton size="sm" onClick={() => setConfirmId(null)}>
                              Cancel
                            </FyiButton>
                          </span>
                        ) : (
                          <FyiButton
                            size="sm"
                            variant="danger"
                            aria-label={`Delete ${post.title}`}
                            title="Delete"
                            onClick={() => setConfirmId(post.id)}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </FyiButton>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {total > PAGE_SIZE && (
            <div className="flex items-center justify-between border-t border-fyi-stroke px-space-md py-3 font-label text-label-sm text-fyi-ink-faint">
              <span>
                Page {page} of {Math.ceil(total / PAGE_SIZE)} · {total} posts
              </span>
              <span className="flex items-center gap-1">
                <FyiButton size="sm" disabled={page <= 1} onClick={() => void load(page - 1)}>
                  PREV
                </FyiButton>
                <FyiButton
                  size="sm"
                  disabled={page * PAGE_SIZE >= total}
                  onClick={() => void load(page + 1)}
                >
                  NEXT
                </FyiButton>
              </span>
            </div>
          )}
        </SurfaceCard>
      )}
    </div>
  );
}
