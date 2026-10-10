import React from 'react';
import { Plus, Tag as TagIcon, Trash2 } from 'lucide-react';
import { useAdminAuth } from '@/app/lib/admin/auth';
import { createTag, deleteTag, listAdminTags } from '@/app/lib/fyi/api';
import type { FyiTag } from '@/app/lib/fyi/types';
import {
  EmptyState,
  FyiButton,
  FyiField,
  FyiInput,
  Loading,
  Notice,
  SurfaceCard,
  cx,
} from '@/app/components/fyi/primitives';

/**
 * Tags.
 *
 * The API derives a slug from the name when one is not supplied, so this screen
 * only asks for a name. Deleting a tag cascades `post_tags`, which is why the
 * confirm says so explicitly — losing a tag silently detaches it from every
 * post that used it.
 */
export function AdminTags() {
  const { withToken } = useAdminAuth();

  const [tags, setTags] = React.useState<FyiTag[]>([]);
  const [state, setState] = React.useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = React.useState<string | null>(null);
  const [name, setName] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  const load = React.useCallback(async () => {
    setState('loading');
    try {
      setTags(await withToken((token) => listAdminTags(token)));
      setState('ready');
      setError(null);
    } catch (cause) {
      setState('error');
      setError(cause instanceof Error ? cause.message : 'Could not load tags.');
    }
  }, [withToken]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const create = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;

    setBusy(true);
    try {
      const created = await withToken((token) => createTag(token, name.trim()));
      setTags((current) => [...current, created].sort((a, b) => a.name.localeCompare(b.name)));
      setName('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not create that tag.');
    } finally {
      setBusy(false);
    }
  };

  const remove = async (tag: FyiTag) => {
    if (
      !window.confirm(
        `Delete "${tag.name}"? Every post tagged with it will lose the tag (post_tags cascades).`,
      )
    ) {
      return;
    }

    setBusy(true);
    try {
      await withToken((token) => deleteTag(token, tag.id));
      setTags((current) => current.filter((entry) => entry.id !== tag.id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Delete failed.');
    } finally {
      setBusy(false);
    }
  };

  if (state === 'loading') {
    return (
      <SurfaceCard className="p-space-lg" interactive={false}>
        <Loading label="Loading tags" />
      </SurfaceCard>
    );
  }

  return (
    <div className="flex flex-col gap-space-md">
      {error && (
        <Notice tone="error" title="Something went wrong">
          {error}
        </Notice>
      )}

      <form
        onSubmit={create}
        className="flex flex-col gap-space-md rounded-lg border border-fyi-stroke bg-fyi-surface p-space-md sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <FyiField label="New tag" htmlFor="tag-name" hint="The slug is derived from the name.">
            <FyiInput
              id="tag-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="TypeScript"
              required
            />
          </FyiField>
        </div>
        <FyiButton type="submit" variant="primary" icon={Plus} disabled={busy}>
          Create tag
        </FyiButton>
      </form>

      {tags.length === 0 ? (
        <EmptyState title="No tags yet">
          Tags drive the filters on the public FYI page and the API's
          <code className="mx-1 font-code text-code-md text-fyi-flame">?tag=</code>
          query, so add them before you need them.
        </EmptyState>
      ) : (
        <SurfaceCard className="flex flex-wrap gap-space-sm p-space-md">
          {tags.map((tag) => (
            <span
              key={tag.id}
              className={cx(
                'inline-flex items-center gap-space-xs rounded-full border border-fyi-stroke bg-fyi-well',
                'px-3 py-1 font-label text-label-md text-fyi-ink-dim',
              )}
            >
              <TagIcon className="h-3.5 w-3.5 text-fyi-flame" aria-hidden="true" />
              {tag.name}
              <span className="font-code text-label-sm text-fyi-ink-faint">/{tag.slug}</span>
              <button
                type="button"
                onClick={() => void remove(tag)}
                aria-label={`Delete ${tag.name}`}
                className="text-fyi-ink-faint transition-colors hover:text-red-300"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </span>
          ))}
        </SurfaceCard>
      )}
    </div>
  );
}
