import React from 'react';
import { usePostHog } from '@posthog/react';
import { Github, Linkedin } from './BrandIcons';

interface NavItem {
  label: string;
  href: string;
  external?: boolean;
}

/**
 * Site header. Every destination is a real anchor so crawlers and social
 * scrapers can follow the site's internal link graph from any page.
 */
const NAV_ITEMS: NavItem[] = [
  { label: 'Stack', href: '/#stack' },
  { label: 'Projects', href: '/#projects' },
  { label: 'FYI', href: '/fyi/' },
];

export function SiteHeader() {
  const posthog = usePostHog();

  return (
    <header className="fixed top-0 inset-x-0 z-40 border-b border-[#1a1a1a] bg-black/80 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-6">
        <a
          href="/"
          className="font-mono text-base sm:text-lg whitespace-nowrap hover:text-[#ff6600] transition-colors duration-300"
          aria-label="Damtowise home"
          onClick={() => posthog?.capture('header_brand_clicked')}
        >
          <span className="text-[#ff6600]">{'<'}</span>Damtowise
          <span className="text-[#ff6600]">{' />'}</span>
        </a>

        <nav aria-label="Primary" className="flex items-center gap-4 sm:gap-6">
          <ul className="flex items-center gap-4 sm:gap-6 list-none text-sm sm:text-base">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="text-[#999] hover:text-[#ff6600] transition-colors duration-300"
                  {...(item.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  onClick={() =>
                    posthog?.capture('header_nav_clicked', { label: item.label, href: item.href })
                  }
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>

          <a
            href="https://github.com/einstein-john"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex w-9 h-9 items-center justify-center border border-[#333] rounded-lg text-[#999] hover:border-[#ff6600] hover:text-[#ff6600] transition-all duration-300"
            aria-label="GitHub profile"
            onClick={() => posthog?.capture('header_social_clicked', { platform: 'GitHub' })}
          >
            <Github className="w-4 h-4" aria-hidden="true" />
          </a>
          <a
            href="https://linkedin.com/in/einstein-john"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex w-9 h-9 items-center justify-center border border-[#333] rounded-lg text-[#999] hover:border-[#ff6600] hover:text-[#ff6600] transition-all duration-300"
            aria-label="LinkedIn profile"
            onClick={() => posthog?.capture('header_social_clicked', { platform: 'LinkedIn' })}
          >
            <Linkedin className="w-4 h-4" aria-hidden="true" />
          </a>
        </nav>
      </div>
    </header>
  );
}
