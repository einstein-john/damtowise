# damtowise.xyz

Static portfolio site with the **FYI** blog and its writing console.
Vite · React 19 · TypeScript · Tailwind v4 · prerendered per route.

```
pnpm install
cp .env.example .env     # VITE_FYI_API_URL, VITE_NEON_AUTH_URL
npm run dev              # http://localhost:3000
npm run build            # dist/, one HTML document per route (and per article)
npm run typecheck        # no tests in this repo; run before every PR
```

The blog is **not** part of this bundle's server. Everything it renders comes
from the FYI API at build time and, in the browser, at request time:

| Surface         | Route          | Data                                       |
| --------------- | -------------- | ------------------------------------------ |
| Blog index      | `/fyi/`        | `GET /posts`, `/tags`, `/worklog`          |
| Article         | `/fyi/<slug>/` | `GET /posts/<slug>` (prerendered at build) |
| Writing console | `/admin/*`     | `/admin/*` (Bearer token, Neon Auth)       |

---

## How the blog is built

`src/entry-server.tsx` is compiled with `vite build --ssr` and consumed by
`scripts/prerender.mjs`, which:

1. calls `loadFyiArticles()` — paginates `GET /posts` and loads `/tags` and
   `/worklog`, parking the whole catalogue in `src/app/lib/fyi/manifest.ts`;
2. emits one HTML document per **published post** at `/fyi/<slug>/`, each with
   its own title, canonical, Open Graph tags and `BlogPosting` JSON-LD;
3. embeds the catalogue and the article as JSON blocks before `</body>`, so a
   cold load hydrates from the same data it was rendered with;
4. writes `robots.txt`, `sitemap.xml` (including article URLs) and `rss.xml`
   (now with one `<item>` per published post).

If the API is unreachable the build **does not fail**: it logs the reason,
skips the article documents and ships the FYI index alone.

Article bodies are the HTML the API's publish pipeline already sanitised
(`remark` + `rehype-sanitize`); this site never renders Markdown in the browser.
`src/styles/fyi.css` styles exactly what that pipeline may emit, including
`figure.article-figure` with a Cloudinary `srcset`.

---

## Writing console

Reached with the chord **⌘/Ctrl + ⇧ + F** from any page, or by direct URL.
There is no link to it anywhere in the site.

- `robots.txt` disallows `/admin/`, and `vercel.json` / `public/_headers` both
  send `X-Robots-Tag: noindex, nofollow` for it.
- It is not prerendered, not in the sitemap, and the SPA fallback
  (`vercel.json` → `rewrites`, `public/_redirects` → `/*`) serves the shell.
- Nothing renders until `GET /admin/me` has confirmed the signed-in `sub` is on
  the API's `ADMIN_USER_IDS`. A valid token for an unknown account gets a 403
  and a message that says so.

| View            | URL                                       |
| --------------- | ----------------------------------------- |
| Sign in         | `/admin/`                                 |
| Post registry   | `/admin/posts/`                           |
| Markdown studio | `/admin/posts/new/`, `/admin/posts/<id>/` |
| Work log        | `/admin/worklog/`                         |
| Media library   | `/admin/media/`                           |
| Tags            | `/admin/tags/`                            |

Auth flow (`src/app/lib/admin/`):

1. `POST <NEON_AUTH_URL>/sign-in/email` → Neon sets its session cookie and
   returns a JWT in the `set-auth-jwt` header (or the body).
2. The token is held in memory and mirrored into `sessionStorage` — never
   `localStorage`, so it dies with the tab.
3. It is minted by `GET /token` again every 12 minutes, because Neon access
   tokens live 15.
4. Any 401 triggers one refresh-and-retry (`withToken`), so an editing session
   is never interrupted by an expiry.

`credentials: 'include'` is used **only** against the Neon Auth host. Every
request to the FYI API uses `credentials: 'omit'` — it is bearer auth, and no
cookie is ever sent there.

---

## Design system

FYI is an obsidian/thermal-orange reading surface, separate from the portfolio
home page's pure black. Tokens live in `src/styles/fyi.css` (`@theme`) and
mirror the exported designs one-for-one, so the mockups and the implementation
cannot drift:

- surfaces `#0A0A0A` / `#0D0D0D` / `#121212` / `#1C1B1B`, strokes `#1F1F1F`
- ink `#FFFFFF` / `#A1A1AA` / `#71717A`, flame `#FF6A00`
- JetBrains Mono for anything the machine says, Inter for anything a person wrote
- 1px gradient horizon rules; the only glow permitted is the amber rim
- shared primitives in `src/app/components/fyi/primitives.tsx`

---

## Layout

```
routes/   data + templates only (metadata, JSON-LD, route matching)
services/ (none — the API is the service layer)
lib/fyi/  API client, catalogue, types, formatting, limits
lib/admin/auth, hotkey, routes, Neon Auth client
lib/head-tags.ts     <head> sync after client-side navigation
components/fyi/      presentational primitives
pages/fyi/           blog index, article
pages/admin/         console, sign-in, registry, editor, work log, media, tags
```

One direction only: pages → lib → components. No page talks to `fetch`
directly; everything goes through `src/app/lib/fyi/api.ts`.
