import { PERSON, SITE, absoluteUrl } from './site';

export type ProjectGroup = 'backend' | 'frontend';

export interface Project {
  slug: string;
  title: string;
  /** Short card description, 140–180 characters. */
  summary: string;
  /** Longer description used on the project page and in meta descriptions. */
  description: string;
  tags: string[];
  group: ProjectGroup;
  githubUrl?: string;
  liveUrl?: string;
  /** Canonical path for the dedicated project page. */
  path: string;
}

/**
 * Project registry. Drives the home page cards, the sitemap, the JSON-LD
 * ItemList and (later) the individual /projects/:slug pages — one entry,
 * no duplicated strings.
 */
export const PROJECTS: Project[] = [
  {
    slug: 'api-scanner',
    title: 'API Scanner',
    summary:
      'TypeScript tooling to probe, catalog and validate REST and OpenAPI endpoints — automated discovery, schema validation and quick visibility into the API surface area you own.',
    description:
      'API Scanner is a TypeScript and Node.js tool that discovers, probes and catalogs REST and OpenAPI endpoints. It parses OpenAPI specifications, probes running services, validates schemas and reports the full surface area so you can see what a backend actually exposes before you integrate with it.',
    tags: ['REST', 'OpenAPI', 'Automation', 'Backend tooling', 'TypeScript'],
    group: 'backend',
    githubUrl: 'https://github.com/einstein-john/api-scanner',
    path: '/projects/api-scanner',
  },
  {
    slug: 'compressor-service',
    title: 'Compressor Service',
    summary:
      'Node.js microservice for PDF compression, video encoding and WebP image conversion — one streaming API for file optimisation instead of juggling separate tools.',
    description:
      'The Compressor Service is a Node.js microservice that compresses PDFs, encodes video and converts images to WebP behind a single streaming API. Configurable quality presets and streaming responses keep memory flat on large files, so teams stop juggling a patchwork of one-off CLI tools.',
    tags: ['PDF', 'Video', 'WebP', 'Compression', 'Node.js', 'Microservice'],
    group: 'backend',
    githubUrl: 'https://github.com/einstein-john/Compression_service',
    path: '/projects/compressor-service',
  },
  {
    slug: 'fitlocka-backend',
    title: 'Fitlocka Backend',
    summary:
      'Production TypeScript and Node.js API for the Fitlocka fitness platform — authentication, business logic, subscription billing and webhook integrations.',
    description:
      'The Fitlocka backend is a production TypeScript and Node.js API powering a fitness product. It handles authentication, business logic, subscription billing and third-party integrations, with webhook processing and a documented REST surface the mobile client consumes.',
    tags: ['API', 'Backend', 'Fitness', 'Services', 'TypeScript'],
    group: 'backend',
    githubUrl: 'https://github.com/einstein-john/fitloka-backend',
    path: '/projects/fitlocka-backend',
  },
  {
    slug: 'mustafa-website',
    title: "Mustafa's Website",
    summary:
      'Responsive marketing and portfolio site — semantic HTML, fluid layouts and optimised asset delivery for client-facing content built with modern frontend tooling.',
    description:
      "Mustafa's website is a marketing and portfolio presence built with semantic HTML, a fluid responsive layout and carefully tuned typography. The build ships optimised assets and fast first paint, giving a client-facing site that stays quick on real mobile connections.",
    tags: ['Web', 'UI', 'Responsive', 'Client project', 'Performance'],
    group: 'frontend',
    liveUrl: 'https://mustafa-tech.com',
    path: '/projects/mustafa-website',
  },
];

export const FEATURED_PROJECTS = PROJECTS;

export function projectBySlug(slug: string): Project | undefined {
  return PROJECTS.find((project) => project.slug === slug);
}

/**
 * JSON-LD ItemList of the featured projects.
 *
 * The canonical `url` deliberately points at a page that resolves today (the
 * repository or the live site). Once /projects/:slug ships, switch these back
 * to `absoluteUrl(project.path)` so each entry canonicalises to its own case
 * study.
 */
export function projectsItemListSchema() {
  return {
    '@type': 'ItemList',
    '@id': `${SITE.origin}/#projects`,
    name: 'Featured Projects',
    description:
      'Selected backend services, automation tooling and client projects built with TypeScript, Node.js and n8n.',
    numberOfItems: PROJECTS.length,
    itemListElement: PROJECTS.map((project, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'CreativeWork',
        name: project.title,
        description: project.summary,
        url: project.githubUrl ?? project.liveUrl ?? absoluteUrl(project.path),
        keywords: project.tags.join(', '),
        author: { '@id': PERSON.id },
      },
    })),
  };
}
