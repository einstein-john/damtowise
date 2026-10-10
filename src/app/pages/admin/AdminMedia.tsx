import React from 'react';
import { Trash2, Upload } from 'lucide-react';
import { useAdminAuth } from '@/app/lib/admin/auth';
import { deleteMedia, listMedia, updateMedia, uploadMedia } from '@/app/lib/fyi/api';
import { MAX_UPLOAD_BYTES } from '@/app/lib/fyi/limits';
import { formatBytes, formatRelative } from '@/app/lib/fyi/format';
import type { FyiMediaItem } from '@/app/lib/fyi/types';
import {
  EmptyState,
  FyiButton,
  FyiCheckbox,
  FyiField,
  FyiInput,
  Loading,
  Notice,
  StatTile,
  SurfaceCard,
  cx,
} from '@/app/components/fyi/primitives';

/**
 * Media library.
 *
 * Uploads go straight to Cloudinary through the API, which checks declared
 * type, magic bytes and size *before* it spends a request — a rejected file
 * never leaves this screen. The alt-text field is first-class because publishing
 * is blocked without it, so this screen is where that rule is actually paid off.
 */

const ACCEPT = 'image/jpeg,image/png,image/webp,image/avif,image/gif';

export function AdminMedia() {
  const { withToken } = useAdminAuth();

  const [items, setItems] = React.useState<FyiMediaItem[]>([]);
  const [total, setTotal] = React.useState(0);
  const [state, setState] = React.useState<'loading' | 'ready' | 'error'>('loading');
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<string | null>(null);

  const [file, setFile] = React.useState<File | null>(null);
  const [alt, setAlt] = React.useState('');
  const [caption, setCaption] = React.useState('');
  const [decorative, setDecorative] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const load = React.useCallback(async () => {
    setState('loading');
    try {
      const page = await withToken((token) => listMedia(token, { page: 1, pageSize: 40 }));
      setItems(page.items);
      setTotal(page.total);
      setState('ready');
      setError(null);
    } catch (cause) {
      setState('error');
      setError(cause instanceof Error ? cause.message : 'Could not load the media library.');
    }
  }, [withToken]);

  React.useEffect(() => {
    void load();
  }, [load]);

  const upload = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!file) return;

    setUploading(true);
    try {
      await withToken((token) =>
        uploadMedia(token, file, {
          alt: alt.trim() || null,
          caption: caption.trim() || null,
          decorative,
        }),
      );
      setFile(null);
      setAlt('');
      setCaption('');
      setDecorative(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Upload failed.');
    } finally {
      setUploading(false);
    }
  };

  const patch = async (item: FyiMediaItem, changes: Partial<FyiMediaItem>) => {
    setBusy(item.id);
    try {
      const updated = await withToken((token) =>
        updateMedia(token, item.id, {
          ...(changes.alt !== undefined ? { alt: changes.alt } : {}),
          ...(changes.caption !== undefined ? { caption: changes.caption } : {}),
          ...(changes.decorative !== undefined ? { decorative: changes.decorative } : {}),
        }),
      );
      setItems((current) => current.map((entry) => (entry.id === item.id ? updated : entry)));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Update failed.');
    } finally {
      setBusy(null);
    }
  };

  const remove = async (item: FyiMediaItem) => {
    if (!window.confirm('Delete this image? It is refused while any post references it.')) return;
    setBusy(item.id);
    try {
      await withToken((token) => deleteMedia(token, item.id));
      setItems((current) => current.filter((entry) => entry.id !== item.id));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Delete failed.');
    } finally {
      setBusy(null);
    }
  };

  const missingAlt = items.filter((item) => !item.decorative && !item.alt?.trim()).length;

  return (
    <div className="flex flex-col gap-space-md">
      <section className="grid grid-cols-2 gap-space-sm xl:grid-cols-4">
        <StatTile label="In library" value={total} hint={`${items.length} on this page`} />
        <StatTile
          label="Missing alt text"
          value={missingAlt}
          hint={missingAlt === 0 ? 'publish-ready' : 'blocks publishing'}
        />
        <StatTile
          label="Cap"
          value={`${Math.floor(MAX_UPLOAD_BYTES / 1024 / 1024)} MB`}
          hint="per file"
        />
        <StatTile label="Delivery" value="Cloudinary" hint="srcset 480/800/1200" />
      </section>

      {error && (
        <Notice tone="error" title="Something went wrong">
          {error}
        </Notice>
      )}

      <form
        onSubmit={upload}
        className="grid grid-cols-1 gap-space-md rounded-lg border border-fyi-stroke bg-fyi-surface p-space-md lg:grid-cols-12"
      >
        <div className="lg:col-span-4">
          <FyiField label="File" htmlFor="media-file">
            <input
              ref={fileInputRef}
              id="media-file"
              type="file"
              accept={ACCEPT}
              required
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="w-full rounded border border-fyi-stroke bg-fyi-well px-space-md py-space-sm font-body text-body-sm text-fyi-ink file:mr-3 file:rounded file:border-0 file:bg-fyi-surface-high file:px-space-sm file:py-1 file:font-label file:text-label-sm file:text-fyi-ink"
            />
          </FyiField>
        </div>

        <div className="lg:col-span-3">
          <FyiField label="Alt text" htmlFor="media-alt" hint="Required unless decorative.">
            <FyiInput
              id="media-alt"
              value={alt}
              onChange={(event) => setAlt(event.target.value)}
              placeholder="Terminal window showing p99 latency"
            />
          </FyiField>
        </div>

        <div className="lg:col-span-3">
          <FyiField label="Caption" htmlFor="media-caption">
            <FyiInput
              id="media-caption"
              value={caption}
              onChange={(event) => setCaption(event.target.value)}
              placeholder="Shown under the figure"
            />
          </FyiField>
        </div>

        <div className="flex flex-col justify-end gap-space-xs lg:col-span-2">
          <FyiCheckbox
            id="media-decorative"
            checked={decorative}
            onChange={setDecorative}
            label="Decorative (no alt)"
          />
          <FyiButton type="submit" variant="primary" icon={Upload} disabled={uploading || !file}>
            {uploading ? 'Uploading…' : 'Upload'}
          </FyiButton>
        </div>
      </form>

      {state === 'loading' ? (
        <SurfaceCard className="p-space-lg" interactive={false}>
          <Loading label="Loading library" />
        </SurfaceCard>
      ) : items.length === 0 ? (
        <EmptyState title="No uploads yet">
          Add an image above and reference it from a post as{' '}
          <code className="font-code text-code-md text-fyi-flame">![alt](media:&lt;uuid&gt;)</code>.
          The renderer turns that into a responsive <code>&lt;figure&gt;</code> with a Cloudinary
          srcset.
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 gap-space-md md:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <SurfaceCard key={item.id} className="flex flex-col gap-space-sm p-space-md">
              <img
                src={item.url}
                alt={item.alt ?? ''}
                width={item.width}
                height={item.height}
                loading="lazy"
                className="h-40 w-full rounded border border-fyi-stroke object-cover"
              />

              <div className="flex items-center justify-between font-label text-label-sm text-fyi-ink-faint">
                <span>
                  {item.width}×{item.height}
                </span>
                <span>{formatBytes(item.bytes)}</span>
              </div>

              <FyiField label="Alt text" htmlFor={`alt-${item.id}`}>
                <FyiInput
                  key={`alt-${item.id}`}
                  id={`alt-${item.id}`}
                  defaultValue={item.alt ?? ''}
                  onBlur={(event) => {
                    if (event.target.value !== (item.alt ?? ''))
                      void patch(item, { alt: event.target.value });
                  }}
                  placeholder="Describe the image"
                  className={cx(!item.decorative && !item.alt?.trim() && 'border-red-500/40')}
                />
              </FyiField>

              <FyiField label="Caption" htmlFor={`caption-${item.id}`}>
                <FyiInput
                  key={`caption-${item.id}`}
                  id={`caption-${item.id}`}
                  defaultValue={item.caption ?? ''}
                  onBlur={(event) => {
                    if (event.target.value !== (item.caption ?? ''))
                      void patch(item, { caption: event.target.value });
                  }}
                />
              </FyiField>

              <div className="flex items-center justify-between border-t border-fyi-stroke pt-space-sm font-label text-label-sm text-fyi-ink-faint">
                <span>{formatRelative(item.createdAt)}</span>
                <FyiButton
                  size="sm"
                  variant="danger"
                  icon={Trash2}
                  disabled={busy === item.id}
                  onClick={() => void remove(item)}
                  aria-label="Delete image"
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
