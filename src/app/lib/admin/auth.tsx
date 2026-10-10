import React from 'react';
import { FyiApiError, getAdminIdentity } from '@/app/lib/fyi/api';
import {
  NeonAuthError,
  requestAccessToken,
  signInWithPassword,
  signOutOfNeonAuth,
} from './neon-auth';
import { TOKEN_REFRESH_INTERVAL_MS } from '@/app/lib/fyi/config';
import type { FyiAdminIdentity } from '@/app/lib/fyi/types';

/**
 * Admin session state.
 *
 * One provider owns the token so the console has a single place where a 401 is
 * retried, a token is refreshed and an identity is verified. Screens never
 * touch `fetch` themselves — they call `withToken` and get a token that is
 * already known to work.
 *
 * The token is held in memory and mirrored into `sessionStorage` so a reload
 * keeps the session without making a refresh call. It is intentionally *not*
 * in `localStorage`: the console is a single-tab tool, and a token that dies
 * with the tab is one fewer thing to leak.
 */

const TOKEN_KEY = 'fyi.admin.token';

type AdminStatus = 'loading' | 'signed-out' | 'signed-in';

export interface AdminAuthValue {
  status: AdminStatus;
  identity: FyiAdminIdentity | null;
  error: string | null;
  /** True once the first session check has resolved. */
  ready: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
  withToken: <T>(call: (token: string) => Promise<T>) => Promise<T>;
  /** Forces a token refresh; used after a long idle period. */
  refresh: () => Promise<string | null>;
}

const AdminAuthContext = React.createContext<AdminAuthValue | null>(null);

function readStoredToken(): string | null {
  try {
    return window.sessionStorage.getItem(TOKEN_KEY);
  } catch {
    // Safari private mode throws on storage access; the session then simply
    // does not survive a reload, which is an acceptable degradation.
    return null;
  }
}

function writeStoredToken(token: string | null): void {
  try {
    if (token) window.sessionStorage.setItem(TOKEN_KEY, token);
    else window.sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = React.useState<AdminStatus>('loading');
  const [identity, setIdentity] = React.useState<FyiAdminIdentity | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [ready, setReady] = React.useState(false);

  const tokenRef = React.useRef<string | null>(null);

  /** Always holds exactly one refresh, so concurrent 401s share it. */
  const refreshRef = React.useRef<Promise<string | null> | null>(null);

  const refresh = React.useCallback(async (): Promise<string | null> => {
    refreshRef.current ??= (async () => {
      const next = await requestAccessToken();
      tokenRef.current = next;
      writeStoredToken(next);
      return next;
    })();

    try {
      return await refreshRef.current;
    } finally {
      refreshRef.current = null;
    }
  }, []);

  const adopt = React.useCallback(async (token: string): Promise<boolean> => {
    try {
      const me = await getAdminIdentity(token);
      tokenRef.current = token;
      writeStoredToken(token);
      setIdentity(me);
      setStatus('signed-in');
      setError(null);
      return true;
    } catch {
      tokenRef.current = null;
      writeStoredToken(null);
      setIdentity(null);
      setStatus('signed-out');
      return false;
    }
  }, []);

  const dropSession = React.useCallback(() => {
    tokenRef.current = null;
    writeStoredToken(null);
    setIdentity(null);
    setStatus('signed-out');
  }, []);

  /**
   * Verifies a token against `/admin/me`.
   *
   * A 403 is worth separating from a 401: the token is genuine but `sub` is not
   * on `ADMIN_USER_IDS`, and telling the user to "sign in again" would send
   * them in circles.
   */
  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      const stored = readStoredToken();
      if (stored) {
        try {
          const me = await getAdminIdentity(stored);
          if (cancelled) return;
          tokenRef.current = stored;
          setIdentity(me);
          setStatus('signed-in');
          return;
        } catch (cause) {
          if (isForbidden(cause) && !cancelled) {
            dropSession();
            setError('That account is signed in but is not on the admin allowlist.');
            return;
          }
          // Expired or revoked: try the session cookie once before giving up.
          const fresh = await refresh();
          if (fresh && (await adopt(fresh))) return;
        }
      } else {
        const fresh = await refresh();
        if (fresh && (await adopt(fresh))) return;
      }

      if (cancelled) return;
      dropSession();
    })()
      .catch(() => {
        if (!cancelled) dropSession();
      })
      .finally(() => {
        if (!cancelled) setReady(true);
      });

    return () => {
      cancelled = true;
    };
  }, [adopt, dropSession, refresh]);

  // Neon access tokens live 15 minutes; this keeps a long editing session alive.
  React.useEffect(() => {
    if (status !== 'signed-in') return;
    const timer = window.setInterval(() => {
      void refresh().then((token) => {
        if (!token) dropSession();
      });
    }, TOKEN_REFRESH_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [status, refresh, dropSession]);

  const signIn = React.useCallback(
    async (email: string, password: string) => {
      setError(null);
      try {
        const token = await signInWithPassword(email, password);
        const ok = await adopt(token);
        if (!ok) setError('Signed in, but this account is not on the admin allowlist.');
      } catch (cause) {
        setError(
          cause instanceof NeonAuthError
            ? cause.message
            : 'Sign-in failed. Check the email and password.',
        );
        setStatus('signed-out');
      }
    },
    [adopt],
  );

  const signOut = React.useCallback(async () => {
    await signOutOfNeonAuth();
    dropSession();
  }, [dropSession]);

  const withToken = React.useCallback(
    async <T,>(call: (token: string) => Promise<T>): Promise<T> => {
      const current = tokenRef.current ?? readStoredToken();
      if (!current) throw new Error('Not signed in.');

      try {
        return await call(current);
      } catch (cause) {
        // One retry on a 401: the token most likely just hit its 15-minute mark.
        if (!isUnauthorized(cause)) throw cause;
        const fresh = await refresh();
        if (!fresh) {
          dropSession();
          throw cause;
        }
        return call(fresh);
      }
    },
    [dropSession, refresh],
  );

  const value = React.useMemo<AdminAuthValue>(
    () => ({
      status,
      identity,
      error,
      ready,
      signIn,
      signOut,
      clearError: () => setError(null),
      withToken,
      refresh,
    }),
    [status, identity, error, ready, signIn, signOut, withToken, refresh],
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth(): AdminAuthValue {
  const value = React.useContext(AdminAuthContext);
  if (!value) throw new Error('useAdminAuth must be used inside <AdminAuthProvider>.');
  return value;
}

function isUnauthorized(cause: unknown): boolean {
  return cause instanceof FyiApiError && cause.status === 401;
}

function isForbidden(cause: unknown): boolean {
  return cause instanceof FyiApiError && cause.status === 403;
}
