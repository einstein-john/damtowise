/**
 * Single source of truth for site-wide SEO data: canonical URLs, social profiles
 * and the person identity that every page (portfolio, projects, FYI articles)
 * points back to. Keeping it here means the JSON-LD, the meta tags and the
 * visible copy can never drift apart.
 */

export const SITE = {
  name: 'Damtowise',
  /** Apex domain. Every canonical URL in the app is derived from this. */
  origin: 'https://damtowise.xyz',
  locale: 'en',
  themeColor: '#0A0A0A',
  defaultOgImage: '/og/home.png',
  /** Used by the sitemap and any page that needs an absolute URL. */
  paths: {
    home: '/',
    projects: '/projects',
    fyi: '/fyi',
  },
} as const;

export const PERSON = {
  id: `${SITE.origin}/#person`,
  name: 'Damtowise',
  jobTitle: 'Backend & Automation Engineer',
  tagline: 'Building scalable backend systems and intelligent automation workflows',
  email: 'damtowise@damtowise.xyz',
  image: `${SITE.origin}${SITE.defaultOgImage}`,
  profiles: {
    github: 'https://github.com/einstein-john',
    linkedin: 'https://linkedin.com/in/einstein-john',
  },
  knowsAbout: [
    'TypeScript',
    'Node.js',
    'n8n',
    'REST APIs',
    'Workflow Automation',
    'Backend Development',
    'API Design',
  ],
} as const;

/** Absolute URL helper so canonical/OG tags never miss the origin. */
export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE.origin}${path.startsWith('/') ? path : `/${path}`}`;
}

export function personSchema() {
  return {
    '@type': 'Person',
    '@id': PERSON.id,
    name: PERSON.name,
    jobTitle: PERSON.jobTitle,
    url: `${SITE.origin}/`,
    image: PERSON.image,
    sameAs: [PERSON.profiles.github, PERSON.profiles.linkedin],
    knowsAbout: [...PERSON.knowsAbout],
    email: `mailto:${PERSON.email}`,
    worksFor: { '@type': 'Organization', name: SITE.name },
  };
}

export function webSiteSchema() {
  return {
    '@type': 'WebSite',
    '@id': `${SITE.origin}/#website`,
    name: SITE.name,
    url: `${SITE.origin}/`,
    inLanguage: SITE.locale,
    publisher: { '@id': PERSON.id },
  };
}

export function profilePageSchema() {
  return {
    '@type': 'ProfilePage',
    '@id': `${SITE.origin}/#profile`,
    mainEntity: { '@id': PERSON.id },
    isPartOf: { '@id': `${SITE.origin}/#website` },
    description: `${PERSON.jobTitle} portfolio specialising in TypeScript, Node.js and n8n workflow automation.`,
  };
}
