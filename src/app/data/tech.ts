export interface Tech {
  name: string;
  /** One or two sentences that read naturally and carry the keywords. */
  description: string;
  /** Accessible name for the decorative logo mark. */
  iconAlt: string;
}

export const TECH_STACK: Tech[] = [
  {
    name: 'TypeScript',
    iconAlt: 'TypeScript logo',
    description:
      'Type-safe backend development with modern TypeScript — strict typing, generics and inference for robust, maintainable APIs and automation workflows.',
  },
  {
    name: 'Node.js',
    iconAlt: 'Node.js logo',
    description:
      'Fast, scalable server-side applications with Node.js — event-driven architecture, streaming and native TypeScript support for backend services.',
  },
  {
    name: 'n8n',
    iconAlt: 'n8n logo',
    description:
      'Workflow automation with n8n — visual node-based orchestration for connecting APIs, databases and SaaS tools without writing custom glue code.',
  },
];
