/// <reference types="vite/client" />

/**
 * Build-time configuration the FYI surfaces read.
 *
 * Everything the site knows about the API comes from here, inlined at build
 * time by Vite. Nothing secret belongs in this list: the Cloudinary keys, the
 * Neon database strings and the Vercel deploy hook all stay in the API's own
 * `.env` and never reach this bundle.
 */
interface ImportMetaEnv {
  /** Origin of the FYI API, e.g. `https://api.damtowise.xyz`. */
  readonly VITE_FYI_API_URL?: string;
  /** Origin of the Neon Auth host. Only the admin console needs it. */
  readonly VITE_NEON_AUTH_URL?: string;
  readonly VITE_PUBLIC_POSTHOG_TOKEN: string;
  readonly VITE_PUBLIC_POSTHOG_HOST: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
