import React from 'react';
import { KeyRound, ShieldAlert } from 'lucide-react';
import { ADMIN_HOTKEY_LABEL, NEON_AUTH_CONFIGURED } from '@/app/lib/fyi/config';
import { useAdminAuth } from '@/app/lib/admin/auth';
import {
  ChromeWindow,
  CodeLine,
  FyiButton,
  FyiField,
  FyiInput,
  HorizonRule,
  LiveBadge,
  Notice,
  SurfaceCard,
} from '@/app/components/fyi/primitives';

/**
 * Admin sign-in gate.
 *
 * Reached by the ⌘⇧F chord or by direct URL — never linked from anywhere in the
 * public site. It only ever collects an email and password and hands them to
 * Neon Auth; the session cookie stays on Neon's domain, and the API is talked
 * to with the bearer token that comes back.
 *
 * If `VITE_NEON_AUTH_URL` was not set at build time the form says so plainly
 * rather than failing with a network error nobody can interpret.
 */
export function AdminSignIn({ error }: { error: string | null }) {
  const { signIn, status, clearError } = useAdminAuth();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [busy, setBusy] = React.useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    try {
      await signIn(email.trim(), password);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center gap-space-lg px-6 py-space-3xl">
      <LiveBadge label="FYI // admin gate" />

      <div className="grid w-full grid-cols-1 items-center gap-space-xl lg:grid-cols-2">
        <form onSubmit={submit} className="flex flex-col gap-space-md">
          <h1 className="font-display text-headline-lg text-fyi-ink">
            Sign in to <span className="text-fyi-flame">the console</span>
          </h1>
          <p className="font-body text-body-md text-fyi-ink-dim">
            Only accounts listed in{' '}
            <code className="font-code text-code-md text-fyi-flame">ADMIN_USER_IDS</code> can
            publish. Everyone else gets a 403, even with a valid password.
          </p>

          {!NEON_AUTH_CONFIGURED && (
            <Notice tone="error" title="Auth host not configured">
              Set <code className="font-code text-code-md">VITE_NEON_AUTH_URL</code> before
              building, then rebuild. Until then the console cannot verify a session.
            </Notice>
          )}

          {error && (
            <Notice tone="error" title="Sign-in failed">
              {error}{' '}
              <button
                type="button"
                onClick={clearError}
                className="ml-1 underline hover:text-fyi-flame"
              >
                dismiss
              </button>
            </Notice>
          )}

          <FyiField label="Email" htmlFor="admin-email">
            <FyiInput
              id="admin-email"
              type="email"
              autoComplete="username"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@damtowise.xyz"
            />
          </FyiField>

          <FyiField label="Password" htmlFor="admin-password">
            <FyiInput
              id="admin-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="••••••••••"
            />
          </FyiField>

          <FyiButton
            type="submit"
            variant="primary"
            icon={KeyRound}
            disabled={busy || !NEON_AUTH_CONFIGURED || status === 'loading'}
          >
            {busy ? 'Verifying…' : 'Sign in'}
          </FyiButton>

          <p className="font-label text-label-sm text-fyi-ink-faint">
            Press {ADMIN_HOTKEY_LABEL} anywhere on the site to come back here.
          </p>
        </form>

        <SurfaceCard className="overflow-hidden" interactive={false}>
          <ChromeWindow
            title="require-admin.ts"
            right={<span className="text-fyi-flame">403</span>}
          >
            <CodeLine number={1}>
              <span className="text-fyi-flame">const</span> token ={' '}
              <span className="text-fyi-flame-soft">authorization</span>.replace(
              <span className="text-fyi-ink">/^Bearer /</span>,{' '}
              <span className="text-fyi-ink">''</span>)
            </CodeLine>
            <CodeLine number={2} tone="muted">
              // no token → 401, bad signature → 401
            </CodeLine>
            <CodeLine number={3}>
              <span className="text-fyi-flame">if</span> (!isAdminUser(env, sub))
            </CodeLine>
            <CodeLine number={4} indent={1} tone="accent">
              throw forbidden()
            </CodeLine>
            <CodeLine number={5} tone="muted">
              // an empty ADMIN_USER_IDS means allow nobody
            </CodeLine>
          </ChromeWindow>
        </SurfaceCard>
      </div>

      <div className="w-full">
        <HorizonRule className="my-space-lg" />
      </div>

      <SurfaceCard className="flex w-full items-start gap-space-sm p-space-md" interactive={false}>
        <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-fyi-flame" aria-hidden="true" />
        <p className="font-body text-body-sm text-fyi-ink-dim">
          The token lives for fifteen minutes and is refreshed silently from the Neon session.
          Nothing is stored in <code className="font-code text-code-md">localStorage</code> — the
          session dies with the tab.
        </p>
      </SurfaceCard>
    </div>
  );
}
