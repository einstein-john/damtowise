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
}

export const HOME_PATH = '/';

/**
 * FYI has no published posts yet. The page exists (so the URL resolves and the
 * nav link is not broken) but stays out of the index until there is something
 * to rank for. Flip this when the first post ships.
 */
export const FYI_HAS_POSTS = false;

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
  return ROUTES.find((route) => route.path === target);
}

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
