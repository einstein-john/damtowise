import React from 'react';

/**
 * Client-side fallback for unknown paths.
 *
 * On a static host the real 404 response is served by public/404.html before
 * this ever runs; this exists so a client-side navigation to a dead URL still
 * shows something coherent instead of a blank page.
 */
export function NotFoundPage() {
  return (
    <section className="px-6 pt-32 pb-24 min-h-[70vh] flex items-center">
      <div className="max-w-xl mx-auto text-center space-y-6">
        <p className="text-[#ff6600] font-mono text-sm">404</p>
        <h1 className="text-4xl lg:text-5xl">
          That page <span className="text-[#ff6600]">doesn&apos;t exist</span>
        </h1>
        <p className="text-[#999] leading-relaxed">
          It may have moved, or the link that brought you here was wrong. Everything on the site is
          reachable from the sections below.
        </p>
        <div className="flex flex-wrap gap-4 justify-center pt-2">
          <a
            href="/"
            className="px-6 py-3 bg-[#ff6600] text-black rounded-lg hover:bg-[#ff7722] transition-all duration-300"
          >
            Home
          </a>
          <a
            href="/fyi/"
            className="px-6 py-3 border-3 border-[#ff6600]/30 text-[#ff6600] rounded-lg hover:bg-[#ff6600]/10 transition-all duration-300"
          >
            FYI
          </a>
        </div>
      </div>
    </section>
  );
}
