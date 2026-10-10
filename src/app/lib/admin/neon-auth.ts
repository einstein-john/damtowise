import { NEON_AUTH_URL, NEON_AUTH_CONFIGURED } from '@/app/lib/fyi/config';
import { ADMIN_PATH } from '@/app/data/routes';

/**
 * Neon Auth (managed Better Auth) session → bearer token.
 *
 * Neon keeps the session in an HTTP-only cookie on *its own* domain, which the
 * FYI API cannot see. Its JWT plugin therefore exposes the same identity as a
 * short-lived bearer token, and that is what `GET /admin/*` wants. The flow:
 *
 *   1. `POST /sign-in/magic-link` → Neon emails a one-time link
 *   2. link click → Neon verifies the token, plants the session cookie on its
 *      own domain and redirects back to the site
 *   3. `GET  /token`              → re-reads the JWT (on that return trip, on
 *                                   reload, and on every 401)
 *   4. `POST /sign-out`           → drops the session
 *
 * Both the `set-auth-jwt` response header and a `token` field in the JSON body
 * are accepted, because Neon documents the header and the SDK returns the body
 * shape — either can appear depending on which client made the request.
 */

/** Thrown for an unknown address, a throttled host or an unreachable one. */
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

/**
 * Emails a one-time sign-in link to the given address.
 *
 * No password is ever collected, and this returns nothing: the link points at
 * Neon, which verifies the token in it, plants the session cookie on its own
 * domain and redirects back to `ADMIN_PATH`. The console only picks that
 * session up on the return trip, through `requestAccessToken` — which is also
 * why the callback is built from `location.origin` rather than a build-time
 * constant, so a preview deployment never mails links to production.
 */
export async function requestMagicLink(email: string): Promise<void> {
  assertConfigured();

  let response: Response;
  try {
    response = await fetch(authUrl('/sign-in/magic-link'), {
      ...SESSION_FETCH,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ email, callbackURL: magicLinkCallbackUrl() }),
    });
  } catch {
    throw new NeonAuthError('Could not reach the auth host. Check your connection.');
  }

  if (!response.ok) {
    throw new NeonAuthError(
      messageFrom(await readJson(response), 'Could not send the link. Check the email address.'),
      response.status,
    );
  }
}

function magicLinkCallbackUrl(): string {
  return `${window.location.origin}${ADMIN_PATH}`;
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
