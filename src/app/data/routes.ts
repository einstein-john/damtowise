import { SITE, PERSON, absoluteUrl, personSchema, webSiteSchema } from './site';

export interface RouteMeta {
  /** Canonical path. Non-root paths carry a trailing slash, which is the form
   *  `dist/fyi/index.html` is verified to be served under. Combined with
   *  Vercel's `trailingSlash: true`, the canonical URL is served directly and
   *  the slashless variant gets a single 308 onto it. */
  path: string;
  /** Output file, relative to dist/. */
  file: string;
  title: string;
  description: string;
  ogType: 'website' | 'profile' | 'article';
  ogImage: string;
  ogImageAlt: string;
  /** `noindex` until the page has real content worth ranking for. */
  noindex?: boolean;
  breadcrumb?: Array<{ name: string; path: string }>;
  /**
   * True for routes whose metadata is only known once data has loaded
   * (`/fyi/<slug>/`) or which are not documents at all (`/admin`). The generic
   * `<head>` updater skips these so it cannot overwrite the page's real tags
   * with the template's.
   */
  dynamic?: boolean;
}

export const HOME_PATH = '/';
export const FYI_PATH = '/fyi/';
export const ADMIN_PATH = '/admin/';

/**
 * FYI now runs off a live API (`api.damtowise.xyz`) and ships prerendered
 * article documents, so the index is indexable. Flip this back to `false` if
 * the blog is ever emptied again — an index with no posts is not worth ranking.
 *
 * Note that the per-article documents do not depend on this flag: each carry the
 * `noindex` of the post that produced them.
 */
export const FYI_HAS_POSTS = true;

export const ROUTES: RouteMeta[] = [
  {
    path: HOME_PATH,
    file: 'index.html',
    title: 'Backend & Automation Engineer | TypeScript, Node.js, n8n | Damtowise',
    description:
      'Remote backend & automation engineer building scalable APIs and workflow automation with TypeScript, Node.js and n8n. View projects and get in touch.',
    ogType: 'profile',
    ogImage: '/og/home.png',
    ogImageAlt:
      'Damtowise: Backend & Automation Engineer portfolio with code window and orange accent',
  },
  {
    path: '/fyi/',
    file: 'fyi/index.html',
    title: 'FYI · Writing on backend engineering & automation | Damtowise',
    description:
      'FYI is the Damtowise blog on TypeScript, Node.js, API design and n8n workflow automation. Notes on production backend systems, currently being written up.',
    ogType: 'website',
    ogImage: '/og/default.png',
    ogImageAlt: 'Damtowise FYI — notes on backend engineering and n8n workflow automation',
    noindex: !FYI_HAS_POSTS,
    breadcrumb: [
      { name: 'Home', path: HOME_PATH },
      { name: 'FYI', path: '/fyi/' },
    ],
  },
];

export function routeForPath(pathname: string): RouteMeta | undefined {
  const target = normalisePath(pathname);
  return ROUTES.find((route) => route.path === target) ?? templateForPath(target);
}

/**
 * Placeholder metadata for routes that are not in `ROUTES`.
 *
 * `/fyi/<slug>/` resolves here so the client router can render the article
 * shell while the post is fetched; the article then rewrites `<head>` with the
 * post's own title, description, canonical and OG image. `/admin` resolves to a
 * `noindex` stub because the console is a client-only surface: no document is
 * ever prerendered for it, and it must stay out of the sitemap.
 */
function templateForPath(target: string): RouteMeta | undefined {
  if (target === ADMIN_PATH || target.startsWith(`${ADMIN_PATH}`)) return ADMIN_ROUTE;
  if (isFyiArticlePath(target)) return FYI_ARTICLE_ROUTE;
  return undefined;
}

const FYI_ARTICLE_SLUG = /^\/fyi\/[a-z0-9]+(?:-[a-z0-9]+)*\/$/;

/** True for a plausible article URL, before the API has confirmed the slug. */
export function isFyiArticlePath(pathname: string): boolean {
  const target = normalisePath(pathname);
  return FYI_ARTICLE_SLUG.test(target);
}

/** Pulls the slug out of `/fyi/<slug>/`. */
export function fyiSlugFromPath(pathname: string): string | null {
  const target = normalisePath(pathname);
  const match = FYI_ARTICLE_SLUG.exec(target);
  return match ? target.slice('/fyi/'.length, -1) : null;
}

/**
 * Generic article metadata. Every field is replaced once the post loads; the
 * values here only matter for the brief window before it does.
 */
export const FYI_ARTICLE_ROUTE: RouteMeta = {
  path: FYI_PATH,
  file: '',
  title: 'FYI · Writing on backend engineering & automation | Damtowise',
  description:
    'Field notes on TypeScript, Node.js, API design and n8n workflow automation, written up as systems are built.',
  ogType: 'article',
  ogImage: '/og/default.png',
  ogImageAlt: 'Damtowise FYI — notes on backend engineering and n8n workflow automation',
  dynamic: true,
};

/**
 * `/admin` is excluded everywhere: not prerendered, not in the sitemap, not in
 * robots.txt, and served with an `X-Robots-Tag: noindex, nofollow` header by
 * `vercel.json`. It is reachable only by chord or by direct URL.
 */
export const ADMIN_ROUTE: RouteMeta = {
  path: ADMIN_PATH,
  file: '',
  title: 'Admin · FYI | Damtowise',
  description: 'Private writing console for the FYI blog.',
  ogType: 'website',
  ogImage: '/og/default.png',
  ogImageAlt: 'Damtowise FYI admin console',
  noindex: true,
  dynamic: true,
};

/**
 * Collapses duplicate slashes and guarantees exactly one trailing slash on
 * non-root paths, so `/fyi` and `/fyi/` resolve to the same route. The client
 * router needs this because `history.pushState` does not normalise.
 */
function normalisePath(pathname: string): string {
  const path = (pathname || HOME_PATH).replace(/\/{2,}/g, '/');
  return path === HOME_PATH ? HOME_PATH : `${path.replace(/\/+$/, '')}/`;
}

export function canonicalFor(route: RouteMeta): string {
  return absoluteUrl(route.path);
}

export function breadcrumbSchema(route: RouteMeta) {
  if (!route.breadcrumb?.length) return undefined;

  const items = [
    { name: 'Home', path: HOME_PATH },
    ...route.breadcrumb.filter((crumb) => crumb.path !== HOME_PATH),
  ];

  return {
    '@type': 'BreadcrumbList',
    '@id': `${canonicalFor(route)}#breadcrumb`,
    itemListElement: items.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: absoluteUrl(crumb.path),
    })),
  };
}

/**
 * A schema.org node. Typed loosely because the graph mixes WebSite, Person,
 * ProfilePage, ItemList and BreadcrumbList entries — all valid inside @graph.
 */
export type JsonLdNode = Record<string, unknown>;

/** WebSite + Person are emitted on every page so the graph stays connected. */
export function baseGraph(): JsonLdNode[] {
  return [webSiteSchema() as JsonLdNode, personSchema() as JsonLdNode];
}

export const SITE_META = {
  origin: SITE.origin,
  locale: SITE.locale,
  themeColor: SITE.themeColor,
  owner: PERSON.name,
};
