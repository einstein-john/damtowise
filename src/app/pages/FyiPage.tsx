import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Breadcrumbs } from '@/app/components/Breadcrumbs';
import { ROUTES } from '@/app/data/routes';

const TOPICS = [
  {
    title: 'API design',
    body: 'REST and OpenAPI contracts, versioning, pagination, and the error shapes that keep clients from breaking.',
  },
  {
    title: 'Node.js services',
    body: 'Streaming, queues, backpressure and the observability work that decides whether a service survives production traffic.',
  },
  {
    title: 'n8n automation',
    body: 'Treating workflows as production code — versioned, retried, observable — instead of one-off glue.',
  },
  {
    title: 'TypeScript practice',
    body: 'Strictness, generics and the type-level techniques that catch real bugs before they reach a runtime.',
  },
];

/**
 * FYI placeholder.
 *
 * The blog has no published posts yet, so this page does one job honestly:
 * it explains what FYI will cover and gives the visitor somewhere real to go.
 * It ships `noindex` (see FYI_HAS_POSTS in data/routes.ts) until there is
 * article content to rank for.
 */
export function FyiPage() {
  // Same array the BreadcrumbList JSON-LD is generated from.
  const route = ROUTES.find((entry) => entry.path === '/fyi/');

  return (
    <>
      {route?.breadcrumb && <Breadcrumbs crumbs={route.breadcrumb} />}

      <section className="px-6 pt-16 pb-20 relative" aria-labelledby="fyi-title">
        <div
          className="absolute inset-0 bg-gradient-to-b from-[#ff6600]/5 via-transparent to-transparent"
          aria-hidden="true"
        ></div>

        <div className="max-w-3xl mx-auto relative space-y-6 text-center">
          <p className="inline-block px-4 py-2 bg-[#ff6600]/10 border border-[#ff6600]/30 rounded-full">
            <span className="text-[#ff6600] text-sm font-mono">Currently being written</span>
          </p>

          <h1 id="fyi-title" className="text-5xl lg:text-6xl tracking-tight">
            FYI
          </h1>

          <p className="text-lg text-[#999] leading-relaxed">
            The Damtowise blog: field notes on backend engineering and automation, written up as I
            build rather than after the fact.
          </p>

          <p className="text-base text-[#666] leading-relaxed">
            Nothing is published yet. The first posts are being written now, and this page will list
            them as soon as they're live.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <a
              href="/#projects"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#ff6600] text-black rounded-lg hover:bg-[#ff7722] transition-all duration-300"
            >
              See the projects these posts will cover
              <ArrowRight className="w-4 h-4" aria-hidden="true" />
            </a>
            <a
              href="/"
              className="inline-flex items-center justify-center px-6 py-3 border-3 border-[#ff6600]/30 text-[#ff6600] rounded-lg hover:bg-[#ff6600]/10 transition-all duration-300"
            >
              Back to portfolio
            </a>
          </div>
        </div>
      </section>

      <section className="py-20 px-6 relative" aria-labelledby="fyi-topics-title">
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#ff6600] to-transparent"></div>

        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14 space-y-4">
            <h2 id="fyi-topics-title" className="text-3xl lg:text-4xl">
              What FYI <span className="text-[#ff6600]">will cover</span>
            </h2>
            <p className="text-[#999] text-lg max-w-2xl mx-auto">
              The same stack as the portfolio above, explained from the decisions rather than the
              tutorials.
            </p>
          </div>

          <ul className="grid sm:grid-cols-2 gap-6 list-none">
            {TOPICS.map((topic) => (
              <li key={topic.title}>
                <article className="h-full bg-[#0a0a0a] border border-[#333] rounded-lg p-6">
                  <h3 className="text-xl mb-3 text-[#ff6600]">{topic.title}</h3>
                  <p className="text-[#999] leading-relaxed">{topic.body}</p>
                </article>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
