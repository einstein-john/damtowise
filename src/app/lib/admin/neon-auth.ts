import { NEON_AUTH_URL, NEON_AUTH_CONFIGURED } from '@/app/lib/fyi/config';

/**
 * Neon Auth (managed Better Auth) session → bearer token.
 *
 * Neon keeps the session in an HTTP-only cookie on *its own* domain, which the
 * FYI API cannot see. Its JWT plugin therefore exposes the same identity as a
 * short-lived bearer token, and that is what `GET /admin/*` wants. The flow:
 *
 *   1. `POST /sign-in/email`      → sets the session cookie, returns a JWT
 *   2. `GET  /token`              → re-reads the JWT whenever it expires (15 min)
 *   3. `POST /sign-out`           → drops the session
 *
 * Both the `set-auth-jwt` response header and a `token` field in the JSON body
 * are accepted, because Neon documents the header and the SDK returns the body
 * shape — either can appear depending on which client made the request.
 */

/** Thrown for a bad password, an unconfirmed email or an unreachable host. */
export class NeonAuthError extends Error {
  readonly status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = 'NeonAuthError';
    this.status = status;
  }
}

const authUrl = (path: string) => `${NEON_AUTH_URL}${path}`;

/**
 * `credentials: 'include'` is not optional here and is not a mistake: it is the
 * only way the session cookie is sent to Neon. Nothing is ever sent to the FYI
 * API with cookies — that request path uses `credentials: 'omit'`.
 */
const SESSION_FETCH: RequestInit = { credentials: 'include', mode: 'cors' };

function assertConfigured() {
  if (!NEON_AUTH_CONFIGURED) {
    throw new NeonAuthError('Auth host not configured.');
  }
}

/** Reads the JWT from wherever the auth host chose to put it. */
function readToken(response: Response, body: unknown): string | null {
  const header = response.headers.get('set-auth-jwt');
  if (header) return header;

  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;
    if (typeof record.token === 'string') return record.token;
    const session = record.session;
    if (
      session &&
      typeof session === 'object' &&
      typeof (session as { token?: unknown }).token === 'string'
    ) {
      return (session as { token: string }).token;
    }
  }
  return null;
}

async function readJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function messageFrom(body: unknown, fallback: string): string {
  if (body && typeof body === 'object') {
    const record = body as Record<string, unknown>;
    if (typeof record.message === 'string') return record.message;
    if (typeof record.error === 'string') return record.error;
  }
  return fallback;
}

/** Signs in with email and password, returning a fresh access token. */
export async function signInWithPassword(email: string, password: string): Promise<string> {
  assertConfigured();

  let response: Response;
  try {
    response = await fetch(authUrl('/sign-in/email'), {
      ...SESSION_FETCH,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email, password, rememberMe: true }),
    });
  } catch {
    throw new NeonAuthError('Could not reach the auth host. Check your connection.');
  }

  const body = await readJson(response);
  if (!response.ok) {
    throw new NeonAuthError(
      messageFrom(body, 'Sign-in failed. Check the email and password.'),
      response.status,
    );
  }

  const token = readToken(response, body);
  if (!token) {
    throw new NeonAuthError(
      'Signed in, but the auth host returned no access token. Enable the Neon JWT plugin.',
    );
  }
  return token;
}

/**
 * Mints a new access token from the current session.
 *
 * Used on load (so a reloaded tab stays signed in) and on every 401, which is
 * how the console survives Neon's 15-minute token lifetime without asking the
 * user to sign in again mid-edit.
 */
export async function requestAccessToken(): Promise<string | null> {
  if (!NEON_AUTH_CONFIGURED) return null;

  let response: Response;
  try {
    response = await fetch(authUrl('/token'), { ...SESSION_FETCH, headers: JSON_HEADERS });
  } catch {
    return null;
  }
  if (!response.ok) return null;

  const body = await readJson(response);
  return readToken(response, body);
}

const JSON_HEADERS = { Accept: 'application/json' } as const;

export async function signOutOfNeonAuth(): Promise<void> {
  if (!NEON_AUTH_CONFIGURED) return;
  try {
    await fetch(authUrl('/sign-out'), { ...SESSION_FETCH, method: 'POST', headers: JSON_HEADERS });
  } catch {
    // A failed sign-out must still clear local state; the token expires anyway.
  }
}
