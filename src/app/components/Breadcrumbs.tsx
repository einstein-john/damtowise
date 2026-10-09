import React from 'react';
import { ChevronRight } from 'lucide-react';

export interface Crumb {
  name: string;
  path: string;
}

/**
 * Visible breadcrumb trail.
 *
 * Kept in step with the BreadcrumbList JSON-LD emitted for the route — the
 * `crumbs` passed here are the same array the structured data is built from,
 * so the visible trail and the markup a crawler reads cannot disagree.
 *
 * The final crumb is the current page, so it is rendered as plain text rather
 * than a link to itself.
 */
export function Breadcrumbs({ crumbs }: { crumbs: Crumb[] }) {
  if (crumbs.length < 2) return null;

  return (
    <nav aria-label="Breadcrumb" className="px-6 pt-28">
      <ol className="max-w-7xl mx-auto flex flex-wrap items-center gap-1 text-sm font-mono">
        {crumbs.map((crumb, index) => {
          const isLast = index === crumbs.length - 1;
          return (
            <li key={crumb.path} className="flex items-center gap-1">
              {index > 0 && <ChevronRight className="w-3 h-3 text-[#444]" aria-hidden="true" />}
              {isLast ? (
                <span aria-current="page" className="text-[#ff6600]">
                  {crumb.name}
                </span>
              ) : (
                <a href={crumb.path} className="text-[#666] hover:text-[#ff6600] transition-colors">
                  {crumb.name}
                </a>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
