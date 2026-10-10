import React from 'react';
import {
  LogOut,
  ShieldCheck,
  Tag,
  Images,
  FileText,
  ListOrdered,
  type LucideIcon,
} from 'lucide-react';
import { ADMIN_PATH } from '@/app/data/routes';
import { ADMIN_HOTKEY_LABEL } from '@/app/lib/fyi/config';
import { navigate } from '@/app/lib/router';
import {
  adminHref,
  parseAdminRoute,
  type AdminRoute,
  type AdminView,
} from '@/app/lib/admin/routes';
import { useAdminAuth } from '@/app/lib/admin/auth';
import { FyiButton, Loading } from '@/app/components/fyi/primitives';
import { AdminSignIn } from './AdminSignIn';
import { AdminPosts } from './AdminPosts';
import { AdminPostEditor } from './AdminPostEditor';
import { AdminWorklog } from './AdminWorklog';
import { AdminMedia } from './AdminMedia';
import { AdminTags } from './AdminTags';

/**
 * The FYI writing console.
 *
 * Gated on a verified Neon Auth token: until `GET /admin/me` has confirmed the
 * signed-in `sub` is on `ADMIN_USER_IDS`, the console renders nothing but a
 * sign-in form. There is no unauthenticated view — no preview, no partial
 * shell — because the whole point of the allowlist is that only one identity
 * may see this data at all.
 */

const NAV: Array<{ view: AdminView; label: string; icon: LucideIcon }> = [
  { view: 'posts', label: 'Posts & articles', icon: FileText },
  { view: 'worklog', label: 'Work log', icon: ListOrdered },
  { view: 'media', label: 'Media library', icon: Images },
  { view: 'tags', label: 'Tags', icon: Tag },
];

export function AdminConsole({ path }: { path: string }) {
  const { status, identity, ready, error, signOut } = useAdminAuth();
  const route = React.useMemo(() => safeParseAdminRoute(path), [path]);

  const [now, setNow] = React.useState(() => new Date());
  React.useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  if (!ready || status === 'loading') {
    return (
      <div className="mx-auto max-w-2xl px-6 py-space-3xl">
        <Loading label="Verifying session" />
      </div>
    );
  }

  if (status === 'signed-out') return <AdminSignIn error={error} />;

  return (
    <div className="mx-auto max-w-[1280px] px-6 py-space-md">
      <div
        className="pointer-events-none absolute -top-12 left-1/4 h-48 w-96 rounded-full bg-fyi-flame/10 blur-[100px]"
        aria-hidden="true"
      />

      <header className="relative flex flex-col gap-space-md border-b border-fyi-stroke pb-space-md lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-col gap-space-xs">
          <span className="inline-flex items-center gap-1.5 self-start rounded-full border border-fyi-flame/30 bg-fyi-flame/10 px-3 py-1 font-label text-label-sm text-fyi-flame">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            ADMIN ALLOWLIST VERIFIED
          </span>
          <h1 className="font-display text-headline-lg text-fyi-ink">
            FYI <span className="text-fyi-flame">writing console</span>
          </h1>
          <p className="font-code text-code-md text-fyi-ink-faint">
            {identity?.email ?? identity?.userId ?? 'administrator'} ·{' '}
            {now.toISOString().slice(11, 16)} UTC
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-space-sm">
          <a
            href="/"
            className="inline-flex items-center gap-1 font-label text-label-sm text-fyi-ink-faint transition-colors hover:text-fyi-flame"
          >
            <span aria-hidden="true">←</span> portfolio
          </a>
          <span className="hidden font-label text-label-sm text-fyi-ink-faint lg:inline">
            {ADMIN_HOTKEY_LABEL} toggles the console
          </span>
          <FyiButton
            icon={LogOut}
            onClick={() => {
              void signOut().then(() => navigate(ADMIN_PATH));
            }}
          >
            Sign out
          </FyiButton>
        </div>
      </header>

      <nav
        aria-label="Console sections"
        className="flex flex-wrap items-center gap-space-xs py-space-md"
      >
        {NAV.map((item) => {
          const active = item.view === route.view;
          return (
            <a
              key={item.view}
              href={adminHref(item.view)}
              aria-current={active ? 'page' : undefined}
              className={
                active
                  ? 'inline-flex items-center gap-space-xs rounded bg-fyi-surface-high px-space-md py-space-xs font-label text-label-md text-fyi-flame'
                  : 'inline-flex items-center gap-space-xs rounded px-space-md py-space-xs font-label text-label-md text-fyi-ink-dim transition-colors hover:bg-fyi-surface-container hover:text-fyi-ink'
              }
            >
              <item.icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </a>
          );
        })}
      </nav>

      {route.view === 'posts' && <AdminPosts />}
      {route.view === 'editor' && <AdminPostEditor postId={route.postId} isNew={route.isNew} />}
      {route.view === 'worklog' && <AdminWorklog />}
      {route.view === 'media' && <AdminMedia />}
      {route.view === 'tags' && <AdminTags />}
    </div>
  );
}

/** Keeps a malformed `/admin/...` URL from taking the whole console down. */
function safeParseAdminRoute(path: string): AdminRoute {
  try {
    return parseAdminRoute(path);
  } catch {
    return { view: 'posts', postId: null, isNew: false };
  }
}
