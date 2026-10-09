import React from 'react';
import { usePostHog } from '@posthog/react';
import { Mail } from 'lucide-react';
import { Github, Linkedin } from './BrandIcons';
import { PERSON } from '@/app/data/site';

const SOCIAL_LINKS = [
  {
    label: 'GitHub',
    value: PERSON.profiles.github,
    icon: <Github className="w-5 h-5" aria-hidden="true" />,
  },
  {
    label: 'LinkedIn',
    value: PERSON.profiles.linkedin,
    icon: <Linkedin className="w-5 h-5" aria-hidden="true" />,
  },
];

export function Footer() {
  const posthog = usePostHog();
  const year = new Date().getFullYear();

  return (
    <footer className="py-12 px-4 sm:px-6 relative">
      {/* Section divider with gradient */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#ff6600] to-transparent"></div>

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-10">
          <div className="space-y-2 text-center md:text-left">
            <p className="text-lg sm:text-xl font-mono">
              <span className="text-[#ff6600]">{'<'}</span>Backend Engineer
              <span className="text-[#ff6600]">{' />'}</span>
            </p>
            <p className="text-[#999] text-sm max-w-sm">
              {PERSON.jobTitle} building backend services and n8n workflow automation for remote
              teams.
            </p>
          </div>

          <nav aria-label="Footer" className="text-sm">
            <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 list-none">
              <li>
                <a
                  href="/#stack"
                  className="text-[#999] hover:text-[#ff6600] transition-colors duration-300"
                >
                  Tech Stack
                </a>
              </li>
              <li>
                <a
                  href="/#projects"
                  className="text-[#999] hover:text-[#ff6600] transition-colors duration-300"
                >
                  Projects
                </a>
              </li>
              <li>
                <a
                  href="/fyi/"
                  className="text-[#999] hover:text-[#ff6600] transition-colors duration-300"
                >
                  FYI
                </a>
              </li>
              <li>
                <a
                  href={`mailto:${PERSON.email}`}
                  className="text-[#999] hover:text-[#ff6600] transition-colors duration-300"
                >
                  Contact
                </a>
              </li>
            </ul>
          </nav>

          <ul className="flex gap-4 list-none" aria-label="Social profiles">
            {SOCIAL_LINKS.map((link) => (
              <li key={link.label}>
                <a
                  href={link.value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 flex items-center justify-center border border-[#333] rounded-lg text-[#999] hover:border-[#ff6600] hover:text-[#ff6600] transition-all duration-300"
                  aria-label={`${link.label} profile`}
                  onClick={() =>
                    posthog?.capture('footer_social_clicked', {
                      platform: link.label,
                      href: link.value,
                    })
                  }
                >
                  {link.icon}
                </a>
              </li>
            ))}
            <li>
              <a
                href={`mailto:${PERSON.email}`}
                className="w-10 h-10 flex items-center justify-center border border-[#333] rounded-lg text-[#999] hover:border-[#ff6600] hover:text-[#ff6600] transition-all duration-300"
                aria-label="Send an email"
                onClick={() => posthog?.capture('footer_social_clicked', { platform: 'Email' })}
              >
                <Mail className="w-5 h-5" aria-hidden="true" />
              </a>
            </li>
          </ul>
        </div>

        <div className="border-t border-[#1a1a1a] pt-6 text-center">
          <p className="text-[#666] text-sm">
            &copy; {year} Damtowise. Built with TypeScript, React and n8n.
          </p>
        </div>
      </div>
    </footer>
  );
}
