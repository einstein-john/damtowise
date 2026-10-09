import React from 'react';
import { usePostHog } from '@posthog/react';
import { ArrowRight } from 'lucide-react';
import { RECENT_POSTS } from '@/app/data/fyi';

const dateFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  timeZone: 'UTC',
});

export function FyiTeaser() {
  const posthog = usePostHog();

  return (
    <section
      id="fyi-teaser"
      className="py-20 px-6 relative scroll-mt-20"
      aria-labelledby="fyi-teaser-title"
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#ff6600] to-transparent"></div>

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div className="space-y-3">
            <h2 id="fyi-teaser-title" className="text-4xl lg:text-5xl">
              Latest from <span className="text-[#ff6600]">FYI</span>
            </h2>
            <p className="text-[#999] text-lg max-w-2xl">
              Notes on backend engineering, API design and n8n workflow automation — written up as I
              build.
            </p>
          </div>
          <a
            href="/fyi"
            className="inline-flex items-center gap-2 self-start md:self-auto text-[#ff6600] hover:text-[#ff8833] transition-colors duration-300 font-mono text-sm md:text-base px-4 py-2 border border-[#ff6600]/30 rounded-lg hover:bg-[#ff6600]/10"
            onClick={() => posthog?.capture('fyi_teaser_view_all_clicked')}
          >
            All FYI posts
            <ArrowRight className="w-4 h-4" aria-hidden="true" />
          </a>
        </div>

        <ul className="grid md:grid-cols-3 gap-6 list-none">
          {RECENT_POSTS.map((post) => (
            <li key={post.slug}>
              <article className="group h-full bg-[#0a0a0a] border border-[#333] rounded-lg p-6 hover:border-[#ff6600] transition-all duration-300">
                <p className="text-xs text-[#666] font-mono mb-3">
                  <time dateTime={post.date}>{dateFormatter.format(new Date(post.date))}</time>
                  <span aria-hidden="true"> · </span>
                  <span>{post.readTime}</span>
                </p>

                <h3 className="text-xl mb-3">
                  <a
                    href={`/fyi/${post.slug}`}
                    className="before:absolute before:inset-0 before:content-[''] group-hover:text-[#ff6600] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6600] rounded-sm"
                    onClick={() =>
                      posthog?.capture('fyi_teaser_clicked', { slug: post.slug, title: post.title })
                    }
                  >
                    {post.title}
                  </a>
                </h3>

                <p className="text-[#999] text-sm leading-relaxed mb-4">{post.excerpt}</p>

                <ul
                  className="flex flex-wrap gap-2 mb-4 list-none"
                  aria-label={`${post.title} tags`}
                >
                  {post.tags.map((tag) => (
                    <li
                      key={tag}
                      className="px-2 py-0.5 bg-[#1a1a1a] border border-[#333] rounded text-xs text-[#666] group-hover:border-[#ff6600]/30 group-hover:text-[#ff6600] transition-all duration-300"
                    >
                      {tag}
                    </li>
                  ))}
                </ul>

                <span className="inline-flex items-center gap-1 text-[#ff6600] font-mono text-sm">
                  Read article
                  <ArrowRight
                    className="w-3 h-3 group-hover:translate-x-1 transition-transform"
                    aria-hidden="true"
                  />
                </span>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
