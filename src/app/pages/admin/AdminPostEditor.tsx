import React from 'react';
import {
  Bold,
  Code2,
  Heading1,
  Heading2,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  Rocket,
  Save,
  Trash2,
  Undo2,
} from 'lucide-react';
import {
  EXCERPT_MAX_LENGTH,
  SEO_DESCRIPTION_MAX_LENGTH,
  SEO_TITLE_MAX_LENGTH,
} from '@/app/lib/fyi/limits';
import { navigate } from '@/app/lib/router';
import { useAdminAuth } from '@/app/lib/admin/auth';
import {
  createPost,
  deletePost,
  FyiApiError,
  getAdminPost,
  getPublishReadiness,
  listAdminTags,
  listMedia,
  publishPost,
  unpublishPost,
  updatePost,
} from '@/app/lib/fyi/api';
import { formatRelative } from '@/app/lib/fyi/format';
import type {
  FyiPostAdmin,
  FyiPostDraft,
  FyiPostStatus,
  FyiPublishIssue,
  FyiTag,
} from '@/app/lib/fyi/types';
import {
  EmptyState,
  FyiButton,
  FyiField,
  FyiInput,
  FyiSelect,
  FyiTextarea,
  HorizonRule,
  Notice,
  Skeleton,
  StatusTag,
  SurfaceCard,
  cx,
} from '@/app/components/fyi/primitives';

/**
 * Markdown Studio — the post editor.
 *
 * The editor owns the authoring round-trip: it loads `contentMd`, sends PATCHes,
 * and never renders Markdown itself. Rendering is the publish pipeline's job,
 * so what the author types and what a reader gets cannot disagree — the preview
 * here shows the *stored* HTML, straight from the database.
 *
 * Publish readiness is shown live rather than as a modal on click, because the
 * API already exposes it as a read-only inspection: the editor can tell an
 * author that an image has no alt text while they are still typing.
 */

const EMPTY_DRAFT: FyiPostDraft = {
  title: '',
  slug: '',
  excerpt: '',
  contentMd: '',
  status: 'draft',
  seoTitle: '',
  seoDescription: '',
  canonicalUrl: '',
  noindex: false,
  tagIds: [],
};

export function AdminPostEditor({ postId, isNew }: { postId: string | null; isNew: boolean }) {
  const { withToken } = useAdminAuth();

  const [draft, setDraft] = React.useState<FyiPostDraft>(EMPTY_DRAFT);
  const [tags, setTags] = React.useState<FyiTag[]>([]);
  const [post, setPost] = React.useState<FyiPostAdmin | null>(null);
  const [loadState, setLoadState] = React.useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = React.useState<string | null>(null);
  const [dirty, setDirty] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [savedAt, setSavedAt] = React.useState<string | null>(null);
  const [issues, setIssues] = React.useState<FyiPublishIssue[] | null>(null);
  const [mediaOpen, setMediaOpen] = React.useState(false);
  const [media, setMedia] = React.useState<
    Array<{ id: string; url: string; alt: string | null; width: number; height: number }>
  >([]);

  const bodyRef = React.useRef<HTMLTextAreaElement>(null);

  /* ── Loading ────────────────────────────────────────────────────────────── */

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoadState('loading');
      try {
        const [loaded, allTags, mediaPage] = await withToken(async (token) => {
          const fetched = isNew || !postId ? null : await getAdminPost(token, postId);
          const [tagList, firstMedia] = await Promise.all([
            listAdminTags(token),
            listMedia(token, { page: 1, pageSize: 24 }).catch(() => null),
          ]);
          return [fetched, tagList, firstMedia] as const;
        });

        if (cancelled) return;

        setTags(allTags);
        setMedia(mediaPage?.items ?? []);
        setPost(loaded);

        setDraft({
          title: loaded?.title ?? '',
          slug: loaded?.slug ?? '',
          excerpt: loaded?.excerpt ?? '',
          contentMd: loaded?.contentMd ?? '',
          status: loaded?.status ?? 'draft',
          publishedAt: loaded?.publishedAt ?? null,
          seoTitle: loaded?.seoTitle ?? '',
          seoDescription: loaded?.seoDescription ?? '',
          canonicalUrl: loaded?.canonicalUrl ?? '',
          noindex: loaded?.noindex ?? false,
          tagIds: loaded?.tags.map((tag) => tag.id) ?? [],
          coverMediaId: undefined,
        });

        setLoadState('ready');
        setError(null);
      } catch (cause) {
        if (cancelled) return;
        setLoadState('error');
        setError(cause instanceof Error ? cause.message : 'Could not load that post.');
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [postId, isNew, withToken]);

  /* ── Readiness, re-inspected whenever the body or excerpt changes ────────── */

  const inspect = React.useCallback(async () => {
    if (!post) return;
    try {
      const result = await withToken((token) => getPublishReadiness(token, post.id));
      setIssues(result.issues);
    } catch {
      // Readiness is advisory; a failure here must never block saving.
      setIssues(null);
    }
  }, [post, withToken]);

  React.useEffect(() => {
    if (!post) return;
    const timer = window.setTimeout(() => void inspect(), 900);
    return () => window.clearTimeout(timer);
  }, [
    post,
    draft.contentMd,
    draft.excerpt,
    draft.seoTitle,
    draft.seoDescription,
    draft.slug,
    inspect,
  ]);

  /* ── Editing helpers ────────────────────────────────────────────────────── */

  const patch = (changes: Partial<FyiPostDraft>) => {
    setDraft((current) => ({ ...current, ...changes }));
    setDirty(true);
  };

  /** Wraps (or unwraps) the current textarea selection in Markdown markup. */
  const wrap = (before: string, after = before) => {
    const textarea = bodyRef.current;
    if (!textarea) return;

    const { selectionStart: start, selectionEnd: end, value } = textarea;
    const selected = value.slice(start, end) || 'text';
    const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;

    patch({ contentMd: next });

    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  };

  /** Inserts a media reference the renderer resolves: `![alt](media:<uuid>)`. */
  const insertMedia = (id: string) => {
    const textarea = bodyRef.current;
    const alt = media.find((item) => item.id === id)?.alt ?? '';

    if (!textarea) {
      patch({ contentMd: `${draft.contentMd}\n\n![${alt}](media:${id})\n` });
      return;
    }

    const { selectionStart: start, value } = textarea;
    const snippet = `![${alt}](media:${id})`;
    patch({ contentMd: `${value.slice(0, start)}${snippet}${value.slice(start)}` });
    setMediaOpen(false);
  };

  const save = async (): Promise<FyiPostAdmin | null> => {
    setSaving(true);
    setError(null);

    try {
      const saved = await withToken(async (token) => {
        if (post) return updatePost(token, post.id, toPatch(draft));
        return createPost(token, toPatch(draft) as FyiPostDraft);
      });

      setPost(saved);
      setDirty(false);
      setSavedAt(new Date().toISOString());
      await inspect();
      // After creating a new post, navigate to its editor URL.
      if (!post) navigate(`/admin/editor/${saved.id}`);
      return saved;
    } catch (cause) {
      const message =
        cause instanceof FyiApiError && cause.issues?.length
          ? `${cause.message} — ${cause.issues.map((issue) => issue.message).join(', ')}`
          : cause instanceof Error
            ? cause.message
            : 'Save failed.';
      setError(message);
      return null;
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    // A draft cannot be published before it exists, so a first publish saves.
    // Also save when the existing post has unsaved changes.
    const target = (post && dirty) || !post ? await save() : post;
    if (!target) return;

    setSaving(true);
    try {
      const result = await withToken((token) => publishPost(token, target.id));
      setPost((current) =>
        current ? { ...current, status: result.status, ogImageUrl: result.ogImageUrl } : current,
      );
      await inspect();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Publish failed.');
    } finally {
      setSaving(false);
    }
  };

  const unpublish = async () => {
    if (!post) return;
    setSaving(true);
    try {
      const result = await withToken((token) => unpublishPost(token, post.id));
      setPost((current) => (current ? { ...current, status: result.status } : current));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unpublish failed.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!post) return;
    if (!window.confirm(`Delete "${post.title}"? This cannot be undone.`)) return;

    setSaving(true);
    try {
      await withToken((token) => deletePost(token, post.id));
      navigate('/admin/posts/');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Delete failed.');
      setSaving(false);
    }
  };

  /* ── Render ─────────────────────────────────────────────────────────────── */

  if (loadState === 'loading') {
    return (
      <div className="flex flex-col gap-space-md py-space-lg">
        <Skeleton className="h-10 w-full max-w-xl" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (loadState === 'error') {
    return (
      <Notice tone="error" title="Could not open that post">
        {error}
      </Notice>
    );
  }

  return (
    <div className="flex flex-col gap-space-md">
      <div className="flex flex-wrap items-center justify-between gap-space-sm font-label text-label-sm text-fyi-ink-faint">
        <span className="flex items-center gap-space-xs">
          <a href="/admin/posts/" className="hover:text-fyi-flame">
            POSTS
          </a>
          <span className="text-fyi-ink-faint/50">/</span>
          <span className="text-fyi-flame">
            {isNew ? 'NEW' : (post?.slug.toUpperCase() ?? 'EDIT')}
          </span>
        </span>

        <span className="flex items-center gap-space-sm">
          {dirty ? (
            <span className="text-fyi-flame">unsaved changes</span>
          ) : savedAt ? (
            <span>saved {formatRelative(savedAt)}</span>
          ) : null}
        </span>
      </div>

      <div className="flex flex-col gap-space-md rounded-lg border border-fyi-stroke bg-fyi-surface p-space-md xl:flex-row xl:items-center xl:justify-between">
        <div className="min-w-0 flex-1">
          <label className="sr-only" htmlFor="admin-post-title">
            Post title
          </label>
          <input
            id="admin-post-title"
            value={draft.title}
            onChange={(event) => patch({ title: event.target.value })}
            placeholder="Post title…"
            className="w-full bg-transparent font-display text-headline-md text-fyi-ink placeholder:text-fyi-ink-faint/40 focus:text-fyi-flame focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-space-sm">
          {post && <StatusTag status={post.status} />}

          <FyiButton icon={Save} disabled={saving || !dirty} onClick={() => void save()}>
            {saving ? 'Saving…' : 'Save draft'}
          </FyiButton>

          {post?.status === 'published' ? (
            <FyiButton icon={Undo2} disabled={saving} onClick={() => void unpublish()}>
              Unpublish
            </FyiButton>
          ) : (
            <FyiButton
              variant="primary"
              icon={Rocket}
              disabled={saving}
              onClick={() => void publish()}
            >
              Publish
            </FyiButton>
          )}

          {post && (
            <FyiButton
              variant="danger"
              icon={Trash2}
              disabled={saving}
              onClick={() => void remove()}
            >
              Delete
            </FyiButton>
          )}
        </div>
      </div>

      {error && (
        <Notice tone="error" title="Not saved">
          {error}
        </Notice>
      )}

      {issues && issues.length > 0 && (
        <Notice tone="info" title="Publishing is blocked">
          <ul className="mt-1 list-disc pl-5">
            {issues.map((issue, index) => (
              <li key={`${issue.field}-${index}`}>
                <span className="font-code text-code-md text-fyi-flame">{issue.field}</span> —{' '}
                {issue.message}
              </li>
            ))}
          </ul>
        </Notice>
      )}

      {post?.status === 'published' && (
        <Notice tone="success" title="Live">
          Published {formatRelative(post.publishedAt)} ·{' '}
          <a href={`/fyi/${post.slug}/`} className="underline hover:text-fyi-flame">
            open the article
          </a>
        </Notice>
      )}

      <div className="grid grid-cols-1 items-start gap-space-md lg:grid-cols-12">
        {/* ── Editor canvas ─────────────────────────────────────────────── */}
        <div className="flex min-w-0 flex-col gap-space-md lg:col-span-8">
          <div className="flex flex-wrap items-center gap-1 rounded-lg border border-fyi-stroke bg-fyi-surface p-space-xs">
            <ToolbarButton label="Heading 1" onClick={() => wrap('\n# ')}>
              <Heading1 className="h-4 w-4" aria-hidden="true" />
            </ToolbarButton>
            <ToolbarButton label="Heading 2" onClick={() => wrap('\n## ')}>
              <Heading2 className="h-4 w-4" aria-hidden="true" />
            </ToolbarButton>
            <span className="mx-1 h-5 w-px bg-fyi-surface-highest" aria-hidden="true" />
            <ToolbarButton label="Bold" onClick={() => wrap('**')}>
              <Bold className="h-4 w-4" aria-hidden="true" />
            </ToolbarButton>
            <ToolbarButton label="Italic" onClick={() => wrap('*')}>
              <Italic className="h-4 w-4" aria-hidden="true" />
            </ToolbarButton>
            <ToolbarButton label="Code" onClick={() => wrap('`')}>
              <Code2 className="h-4 w-4" aria-hidden="true" />
            </ToolbarButton>
            <ToolbarButton label="Link" onClick={() => wrap('[', '](https://)')}>
              <Link2 className="h-4 w-4" aria-hidden="true" />
            </ToolbarButton>
            <ToolbarButton label="List" onClick={() => wrap('\n- ')}>
              <List className="h-4 w-4" aria-hidden="true" />
            </ToolbarButton>
            <ToolbarButton
              label="Insert media reference"
              onClick={() => setMediaOpen((open) => !open)}
              active={mediaOpen}
            >
              <ImageIcon className="h-4 w-4" aria-hidden="true" />
            </ToolbarButton>
          </div>

          {mediaOpen && (
            <SurfaceCard className="p-space-md">
              <p className="mb-space-sm font-label text-label-sm uppercase tracking-wider text-fyi-flame">
                Insert an upload
              </p>
              {media.length === 0 ? (
                <p className="font-body text-body-sm text-fyi-ink-faint">
                  No uploads yet. Add one in the media library first.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-space-sm sm:grid-cols-6">
                  {media.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => insertMedia(item.id)}
                      className="group overflow-hidden rounded border border-fyi-stroke hover:border-fyi-flame"
                      title={item.alt ?? item.id}
                    >
                      <img
                        src={item.url}
                        alt={item.alt ?? ''}
                        className="h-16 w-full object-cover"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              )}
            </SurfaceCard>
          )}

          <FyiTextarea
            ref={bodyRef}
            value={draft.contentMd}
            onChange={(event) => patch({ contentMd: event.target.value })}
            rows={22}
            spellCheck
            aria-label="Post body in Markdown"
            placeholder={
              '# Start writing…\n\nReference an upload with ![alt](media:<uuid>) — the publisher turns it into a responsive <figure>.'
            }
            className="font-code text-code-md"
          />

          <div className="flex items-center justify-between font-label text-label-sm text-fyi-ink-faint">
            <span>{draft.contentMd.length.toLocaleString()} characters</span>
            <span>publishing renders HTML, TOC and read time</span>
          </div>

          {post?.contentHtml && (
            <details className="rounded-lg border border-fyi-stroke bg-fyi-surface">
              <summary className="cursor-pointer select-none px-space-md py-space-sm font-label text-label-sm uppercase tracking-wider text-fyi-flame">
                Rendered preview (stored HTML)
              </summary>
              <div className="border-t border-fyi-stroke p-space-md">
                <div
                  className="fyi-prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: post.contentHtml }}
                />
              </div>
            </details>
          )}
        </div>

        {/* ── Metadata deck ──────────────────────────────────────────────── */}
        <div className="flex flex-col gap-space-md lg:col-span-4">
          <SurfaceCard className="flex flex-col gap-space-md p-space-md">
            <p className="font-label text-label-sm uppercase tracking-wider text-fyi-flame">
              Frontmatter
            </p>

            <FyiField
              label="Slug"
              htmlFor="admin-slug"
              hint="Lowercase, hyphen-separated. Changing it writes a redirect."
            >
              <FyiInput
                id="admin-slug"
                value={draft.slug ?? ''}
                onChange={(event) => patch({ slug: event.target.value })}
                placeholder="api-scanner-node-openapi"
              />
            </FyiField>

            <FyiField label="Status" htmlFor="admin-status">
              <FyiSelect
                id="admin-status"
                value={draft.status ?? 'draft'}
                onChange={(event) => patch({ status: event.target.value as FyiPostStatus })}
              >
                <option value="draft">draft</option>
                <option value="published">published</option>
                <option value="scheduled">scheduled</option>
              </FyiSelect>
            </FyiField>

            {draft.status === 'scheduled' && (
              <FyiField
                label="Publish at"
                htmlFor="admin-published-at"
                hint="ISO 8601 with an offset. One in-memory timer aims at the next post — no polling."
              >
                <FyiInput
                  id="admin-published-at"
                  type="datetime-local"
                  value={toLocalInput(draft.publishedAt)}
                  onChange={(event) =>
                    patch({
                      publishedAt: event.target.value
                        ? new Date(event.target.value).toISOString()
                        : null,
                    })
                  }
                />
              </FyiField>
            )}

            <HorizonRule />

            <FyiField
              label="Excerpt"
              htmlFor="admin-excerpt"
              counter={`${(draft.excerpt ?? '').length}/${EXCERPT_MAX_LENGTH}`}
              hint="Required to publish."
            >
              <FyiTextarea
                id="admin-excerpt"
                rows={3}
                value={draft.excerpt ?? ''}
                onChange={(event) => patch({ excerpt: event.target.value })}
              />
            </FyiField>

            <FyiField
              label="SEO title"
              htmlFor="admin-seo-title"
              counter={`${(draft.seoTitle ?? '').length}/${SEO_TITLE_MAX_LENGTH}`}
            >
              <FyiInput
                id="admin-seo-title"
                value={draft.seoTitle ?? ''}
                onChange={(event) => patch({ seoTitle: event.target.value })}
              />
            </FyiField>

            <FyiField
              label="SEO description"
              htmlFor="admin-seo-description"
              counter={`${(draft.seoDescription ?? '').length}/${SEO_DESCRIPTION_MAX_LENGTH}`}
            >
              <FyiTextarea
                id="admin-seo-description"
                rows={3}
                value={draft.seoDescription ?? ''}
                onChange={(event) => patch({ seoDescription: event.target.value })}
              />
            </FyiField>

            <FyiField label="Canonical URL" htmlFor="admin-canonical">
              <FyiInput
                id="admin-canonical"
                value={draft.canonicalUrl ?? ''}
                onChange={(event) => patch({ canonicalUrl: event.target.value })}
                placeholder="https://…"
              />
            </FyiField>

            <label className="flex items-center gap-space-sm font-label text-label-sm text-fyi-ink-dim">
              <input
                type="checkbox"
                checked={draft.noindex ?? false}
                onChange={(event) => patch({ noindex: event.target.checked })}
                className="h-4 w-4 rounded border-fyi-stroke bg-fyi-well accent-[#ff6a00]"
              />
              noindex (keep it out of the sitemap and search)
            </label>
          </SurfaceCard>

          <SurfaceCard className="flex flex-col gap-space-sm p-space-md">
            <p className="font-label text-label-sm uppercase tracking-wider text-fyi-flame">Tags</p>
            {tags.length === 0 ? (
              <p className="font-body text-body-sm text-fyi-ink-faint">
                No tags yet — create some in the tags screen.
              </p>
            ) : (
              <div className="flex flex-wrap gap-1">
                {tags.map((tag) => {
                  const active = (draft.tagIds ?? []).includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        patch({
                          tagIds: active
                            ? (draft.tagIds ?? []).filter((id) => id !== tag.id)
                            : [...(draft.tagIds ?? []), tag.id],
                        })
                      }
                      className={cx(
                        'rounded-full px-2.5 py-0.5 font-label text-label-sm transition-colors',
                        active
                          ? 'bg-fyi-flame text-fyi-flame-deep'
                          : 'bg-fyi-surface-container text-fyi-ink-dim hover:text-fyi-ink',
                      )}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            )}
          </SurfaceCard>

          {post && (
            <SurfaceCard className="flex flex-col gap-space-sm p-space-md" interactive={false}>
              <p className="font-label text-label-sm uppercase tracking-wider text-fyi-ink-faint">
                Pipeline
              </p>
              <ul className="flex list-none flex-col gap-1 font-label text-label-sm text-fyi-ink-dim">
                <li>read time · {post.readTime} min</li>
                <li>toc entries · {post.toc.length}</li>
                <li>og image · {post.ogImageUrl ? 'generated' : 'on publish'}</li>
                <li>updated · {formatRelative(post.updatedAt)}</li>
              </ul>
            </SurfaceCard>
          )}
        </div>
      </div>

      {media.length === 0 && !mediaOpen && (
        <EmptyState title="No media uploaded yet">
          Publishing is <strong className="text-fyi-ink">blocked</strong> if any image — cover
          included — has no alt text and is not marked decorative.
        </EmptyState>
      )}
    </div>
  );
}

function ToolbarButton({
  label,
  onClick,
  active,
  children,
}: {
  label: string;
  onClick: () => void;
  active?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      onClick={onClick}
      className={cx(
        'inline-flex h-8 w-8 items-center justify-center rounded font-label text-label-md transition-colors',
        active
          ? 'bg-fyi-surface-highest text-fyi-flame'
          : 'text-fyi-ink-faint hover:bg-fyi-surface-container hover:text-fyi-ink',
      )}
    >
      {children}
    </button>
  );
}

/** Sends only the fields the schema actually accepts, never `null` for a missing optional. */
function toPatch(draft: FyiPostDraft): Partial<FyiPostDraft> {
  const patch: Partial<FyiPostDraft> = {};

  if (draft.title.trim()) patch.title = draft.title.trim();
  if (draft.slug?.trim()) patch.slug = draft.slug.trim();
  if (draft.contentMd) patch.contentMd = draft.contentMd;
  if (draft.excerpt !== undefined) patch.excerpt = draft.excerpt?.trim() ? draft.excerpt : null;
  if (draft.seoTitle !== undefined) patch.seoTitle = draft.seoTitle?.trim() ? draft.seoTitle : null;
  if (draft.seoDescription !== undefined)
    patch.seoDescription = draft.seoDescription?.trim() ? draft.seoDescription : null;
  if (draft.canonicalUrl !== undefined)
    patch.canonicalUrl = draft.canonicalUrl?.trim() ? draft.canonicalUrl : null;
  if (draft.status) patch.status = draft.status;
  if (draft.publishedAt !== undefined) patch.publishedAt = draft.publishedAt;
  if (draft.noindex !== undefined) patch.noindex = draft.noindex;
  if (draft.tagIds) patch.tagIds = draft.tagIds;
  if (draft.coverMediaId !== undefined) patch.coverMediaId = draft.coverMediaId;

  return patch;
}

/** `datetime-local` wants `YYYY-MM-DDTHH:mm`, not an ISO instant. */
function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return '';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return '';
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}
