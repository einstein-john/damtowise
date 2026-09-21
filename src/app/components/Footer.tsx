import React from 'react';
import { usePostHog } from '@posthog/react';
import { Mail } from 'lucide-react';
import { Github, Linkedin } from './BrandIcons';

export function Footer() {
  const posthog = usePostHog();
  const socialLinks = [
    {
      name: 'GitHub',
      icon: <Github className="w-5 h-5" />,
      url: 'https://github.com/einstein-john',
    },
    {
      name: 'LinkedIn',
      icon: <Linkedin className="w-5 h-5" />,
      url: 'https://linkedin.com/in/einstein-john',
    },
    { name: 'Email', icon: <Mail className="w-5 h-5" />, url: 'mailto:damtowise@damtowise.xyz' },
  ];

  return (
    <footer className="py-12 px-4 sm:px-6 relative">
      {/* Section divider with gradient */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#ff6600] to-transparent"></div>

      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          {/* Brand */}
          <div className="space-y-2 text-center md:text-left">
            <h3 className="text-lg sm:text-xl">
              <span className="text-[#ff6600]">{'<'}</span>
              Backend Engineer
              <span className="text-[#ff6600]">{' />'}</span>
            </h3>
            <p className="text-[#999] text-sm">Building automation & backend solutions</p>
          </div>

          {/* Social Links */}
          <div className="flex gap-4">
            {socialLinks.map((link) => (
              <a
                key={link.name}
                href={link.url}
                target={link.url.startsWith('http') ? '_blank' : undefined}
                rel={link.url.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="w-10 h-10 flex items-center justify-center border border-[#333] rounded-lg text-[#999] hover:border-[#ff6600] hover:text-[#ff6600] transition-all duration-300"
                aria-label={link.name}
                onClick={() =>
                  posthog?.capture('footer_social_clicked', { platform: link.name, href: link.url })
                }
              >
                {link.icon}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
