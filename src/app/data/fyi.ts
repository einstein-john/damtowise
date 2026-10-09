/**
 * FYI (blog) teaser data for the portfolio home page.
 *
 * TODO: replace the static list below with a fetch against the FYI API
 * (or a build-time fetch when the site moves to SSG) so the teaser always
 * reflects the three most recent published posts.
 */

export interface FyiPostPreview {
  slug: string;
  title: string;
  excerpt: string;
  /** ISO 8601 date. */
  date: string;
  tags: string[];
  readTime: string;
}

export const RECENT_POSTS: FyiPostPreview[] = [
  {
    slug: 'building-an-api-scanner',
    title: 'Building an API Scanner with TypeScript and n8n',
    excerpt:
      'How to build tooling that discovers and catalogs REST endpoints automatically — from OpenAPI spec parsing to an n8n workflow that runs the scan on a schedule.',
    date: '2026-09-15',
    tags: ['TypeScript', 'n8n', 'API', 'Automation'],
    readTime: '8 min read',
  },
  {
    slug: 'compressor-service-architecture',
    title: 'Architecture of a File Compression Microservice',
    excerpt:
      'Streaming PDF compression, video encoding and WebP conversion behind one Node.js API — and why keeping memory flat matters more than raw throughput.',
    date: '2026-08-22',
    tags: ['Node.js', 'Microservices', 'WebP', 'Performance'],
    readTime: '12 min read',
  },
  {
    slug: 'fitlocka-backend-lessons',
    title: 'Lessons from Building the Fitlocka Backend',
    excerpt:
      'Real-world patterns for authentication, subscription billing and webhook handling in a production TypeScript and Node.js API.',
    date: '2026-07-30',
    tags: ['TypeScript', 'PostgreSQL', 'Architecture', 'APIs'],
    readTime: '10 min read',
  },
];
