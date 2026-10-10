import React from 'react';
import { ArrowDown, ArrowUp, Eye, EyeOff, ImagePlus, Plus, Trash2 } from 'lucide-react';
import { useAdminAuth } from '@/app/lib/admin/auth';
import {
  createWorklogItem,
  deleteWorklogItem,
  listAdminWorklog,
  listMedia,
  reorderWorklog,
  updateWorklogItem,
} from '@/app/lib/fyi/api';
import { MAX_UPLOAD_BYTES } from '@/app/lib/fyi/limits';
import type { FyiMediaItem, FyiWorklogItem } from '@/app/lib/fyi/types';
import {
  EmptyState,
  FyiButton,
  FyiField,
  FyiInput,
  FyiSelect,
  Loading,
  Notice,
  StatTile,
  SurfaceCard,
  cx,
} from '@/app/components/fyi/primitives';

/**
 * Work log pipeline manager.
 *
 * The public `/worklog` endpoint returns published items in `sortOrder`, and the
 * admin endpoint returns everything including drafts. Reordering is one bulk
 * call that rewrites the whole order, which is what the drag-and-drop list on
 * the design wants — moving one row should never leave a half-written order
 * behind if the request fails.
 */

export function AdminWorklog() {
  const { withToken } = useAdminAuth();

  const [items, setItems] = React.useState<FyiWorklogItem[]>([]);
  const [state, setState] = React.useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [reordering, setReordering] = React.useState(false);

  const [title, setTitle] = React.useState('');
  const [caption, setCaption] = React.useState('');
  const [tag, setTag] = React.useState('');
  const [media, setMedia] = React.useState<FyiMediaItem[]>([]);
  const [mediaId, setMediaId] = React.useState<string>('none');

  const load = React.useCallback(
    async (opts?: { preserveError?: boolean }) => {
      setState('loading');
      try {
        const [list, mediaPage] = await withToken(async (token) => [
          await listAdminWorklog(token),
          await listMedia(token, { page: 1, pageSize: 40 }).catch(() => null),
        ]);
        setItems(list);
        setMedia(mediaPage?.items ?? []);
        setState('ready');
        if (!opts?.preserveError) setError(null);
      } catch (cause) {
        setState('error');
        setError(cause instanceof Error ? cause.message : 'Could not load the work log.');
      }
    },
    [withToken],
  );

  React.useEffect(() => {
    void load();
  }, [load]);

  /** Swaps two neighbours and writes the whole order back in one request. */
  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;

    const next = [...items];
    [next[index], next[target]] = [next[target], next[index]];

    setItems(next);
    setReordering(true);
    try {
      await withToken((token) =>
        reorderWorklog(
          token,
          next.map((item, position) => ({ id: item.id, sortOrder: position * 10 })),
        ),
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Reorder failed.');
      await load({ preserveError: true });
    } finally {
      setReordering(false);
    }
  };

  const togglePublished = async (item: FyiWorklogItem) => {
    setBusy(true);
    try {
      await withToken((token) => updateWorklogItem(token, item.id, { published: !item.published }));
      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id ? { ...entry, published: !entry.published } : entry,
        ),
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Update failed.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (item: FyiWorklogItem) => {
    if (!window.confirm(`Delete "${item.title}" from the work log?`)) return;
    setBusy(true);
    try {
      await withToken((token) => deleteWorklogItem(token, item.id));
      setItems((current) => current.filter((entry) => entry.id !== item.id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Delete failed.');
    } finally {
      setBusy(false);
    }
  };

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;

    setBusy(true);
    try {
      await withToken((token) =>
        createWorklogItem(token, {
          title: title.trim(),
          caption: caption.trim() || null,
          tag: tag.trim() || null,
          mediaId: mediaId === 'none' ? null : mediaId,
          published: false,
          sortOrder: items.length * 10,
        }),
      );
      setTitle('');
      setCaption('');
      setTag('');
      setMediaId('none');
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create that item.');
    } finally {
      setBusy(false);
    }
  };

  const publishedCount = items.filter((item) => item.published).length;

  if (state === 'loading') {
    return (
      <div className="py-space-lg">
        <Loading label="Loading captures" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-space-md">
      <section className="grid grid-cols-2 gap-space-sm xl:grid-cols-4">
        <StatTile label="Published" value={publishedCount} hint="live on /fyi/" />
        <StatTile label="Drafts" value={items.length - publishedCount} hint="hidden" />
        <StatTile
          label="Order writes"
          value={reordering ? 'writing…' : 'idle'}
          hint="bulk reorder"
        />
        <StatTile
          label="Upload cap"
          value={`${Math.floor(MAX_UPLOAD_BYTES / 1024 / 1024)} MB`}
          hint="server-enforced"
        />
      </section>

      {error && (
        <Notice tone="error" title="Something went wrong">
          {error}
        </Notice>
      )}

      <form
        onSubmit={create}
        className="grid grid-cols-1 gap-space-md rounded-lg border border-fyi-stroke bg-fyi-surface p-space-md lg:grid-cols-12"
      >
        <div className="lg:col-span-4">
          <FyiField label="Title" htmlFor="worklog-title">
            <FyiInput
              id="worklog-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="n8n Webhook Ingestion Graph"
              required
            />
          </FyiField>
        </div>

        <div className="lg:col-span-3">
          <FyiField label="Caption" htmlFor="worklog-caption">
            <FyiInput
              id="worklog-caption"
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              placeholder="Dispatch payloads to Postgres"
            />
          </FyiField>
        </div>

        <div className="lg:col-span-2">
          <FyiField label="Tag" htmlFor="worklog-tag">
            <FyiInput
              id="worklog-tag"
              value={tag}
              onChange={(event) => setTag(event.target.value)}
              placeholder="n8n"
            />
          </FyiField>
        </div>

        <div className="lg:col-span-2">
          <FyiField label="Capture" htmlFor="worklog-media">
            <FyiSelect
              id="worklog-media"
              value={mediaId}
              onChange={(event) => setMediaId(event.target.value)}
            >
              <option value="none">none</option>
              {media.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.alt?.slice(0, 24) || item.id.slice(0, 8)}
                </option>
              ))}
            </FyiSelect>
          </FyiField>
        </div>

        <div className="flex items-end lg:col-span-1">
          <FyiButton type="submit" variant="primary" icon={Plus} disabled={busy}>
            Add
          </FyiButton>
        </div>
      </form>

      {items.length === 0 ? (
        <EmptyState title="No work-log captures yet">
          A work-log entry is a published image with a caption. Publishing is blocked if the image
          has no alt text and is not marked decorative.
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-space-md md:grid-cols-2 xl:grid-cols-3">
          {items.map((item, index) => (
            <SurfaceCard key={item.id} className="flex flex-col gap-space-sm p-space-md">
              {item.imageUrl ? (
                <img
                  src={item.imageUrl}
                  alt={item.imageAlt ?? item.title}
                  width={item.imageWidth ?? undefined}
                  height={item.imageHeight ?? undefined}
                  loading="lazy"
                  className="h-40 w-full rounded border border-fyi-stroke object-cover"
                />
              ) : (
                <div className="flex h-40 items-center justify-center rounded border border-fyi-stroke bg-fyi-well font-code text-code-md text-fyi-ink-faint">
                  <ImagePlus className="h-5 w-5" aria-hidden="true" />
                </div>
              )}

              <div className="flex items-start justify-between gap-space-sm">
                <div className="min-w-0">
                  <p className="truncate font-display text-headline-sm text-fyi-ink">
                    {item.title}
                  </p>
                  <p className="font-code text-code-md text-fyi-ink-faint">#{index + 1}</p>
                </div>
                <span
                  className={cx(
                    'rounded-full px-2 py-0.5 font-label text-label-sm',
                    item.published
                      ? 'bg-fyi-flame/10 text-fyi-flame'
                      : 'bg-fyi-well text-fyi-ink-faint',
                  )}
                >
                  {item.published ? 'live' : 'draft'}
                </span>
              </div>

              {item.caption && (
                <p className="font-body text-body-sm text-fyi-ink-dim">{item.caption}</p>
              )}

              {item.tag && <WorklogTag>{item.tag}</WorklogTag>}

              <div className="flex flex-wrap items-center gap-1 border-t border-fyi-stroke pt-space-sm">
                <FyiButton
                  size="sm"
                  disabled={index === 0 || reordering}
                  onClick={() => void move(index, -1)}
                  aria-label={`Move ${item.title} up`}
                >
                  <ArrowUp className="h-4 w-4" aria-hidden="true" />
                </FyiButton>
                <FyiButton
                  size="sm"
                  disabled={index === items.length - 1 || reordering}
                  onClick={() => void move(index, 1)}
                  aria-label={`Move ${item.title} down`}
                >
                  <ArrowDown className="h-4 w-4" aria-hidden="true" />
                </FyiButton>

                <FyiButton
                  size="sm"
                  icon={item.published ? EyeOff : Eye}
                  disabled={busy}
                  onClick={() => void togglePublished(item)}
                >
                  {item.published ? 'Unpublish' : 'Publish'}
                </FyiButton>

                <FyiButton
                  size="sm"
                  variant="danger"
                  icon={Trash2}
                  disabled={busy}
                  onClick={() => void remove(item)}
                  aria-label={`Delete ${item.title}`}
                >
                  <span className="sr-only">Delete</span>
                </FyiButton>
              </div>
            </SurfaceCard>
          ))}
        </div>
      )}
    </div>
  );
}

function WorklogTag({ children }: { children: React.ReactNode }) {
  return (
    <span className="self-start rounded-full bg-fyi-surface-container px-2.5 py-0.5 font-label text-label-sm text-fyi-ink-dim">
      {children}
    </span>
  );
}
