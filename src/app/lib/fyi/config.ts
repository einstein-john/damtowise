/**
 * Build/runtime configuration for the FYI surfaces.
 *
 * The site is a static deploy, so everything the FYI pages talk to is configured
 * through `VITE_`-prefixed variables that Vite inlines at build time. There is
 * deliberately **no** server-side proxy: the API is CORS-locked to
 * `SITE_ORIGIN` / `API_PUBLIC_ORIGIN`, and the admin console talks to it directly
 * with a bearer token. Nothing secret ever reaches this bundle — Cloudinary
 * keys, the deploy hook URL and the database strings stay in the API's `.env`.
 */

const rawApiUrl = import.meta.env.VITE_FYI_API_URL ?? 'https://api.damtowise.xyz';
const rawAuthUrl = import.meta.env.VITE_NEON_AUTH_URL ?? '';

/** Origin of the FYI API, never with a trailing slash. */
export const FYI_API_URL = rawApiUrl.replace(/\/+$/, '');

/**
 * Origin of the Neon Auth (Better Auth) host. Only the admin console needs it;
 * leave it blank and `/admin` reports "auth is not configured" instead of
 * failing with a network error it cannot explain.
 */
export const NEON_AUTH_URL = rawAuthUrl.replace(/\/+$/, '');

export const FYI_API_CONFIGURED = FYI_API_URL.length > 0;
export const NEON_AUTH_CONFIGURED = NEON_AUTH_URL.length > 0;

/**
 * Chord that opens the admin console. `Shift` + `F` for "FYI", held with
 * ⌘ on macOS and Ctrl everywhere else, so it does not collide with the browser
 * shortcuts that matter (⌘K, ⌘F, ⌘P).
 */
export const ADMIN_HOTKEY = { key: 'F', shift: true } as const;

/** Human-readable form, shown in the hint the console and the FYI footer print. */
export const ADMIN_HOTKEY_LABEL = '⌘⇧F';

/** Neon access tokens live 15 minutes; refresh well before that. */
export const TOKEN_REFRESH_INTERVAL_MS = 12 * 60 * 1000;
