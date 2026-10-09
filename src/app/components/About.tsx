import React from 'react';
import { usePostHog } from '@posthog/react';
import { Mail } from 'lucide-react';
import { Github, Linkedin } from './BrandIcons';
import { PERSON } from '@/app/data/site';

const CONTACT_LINKS = [
  {
    label: 'Email',
    value: PERSON.email,
    href: `mailto:${PERSON.email}`,
    icon: <Mail className="w-4 h-4" aria-hidden="true" />,
  },
  {
    label: 'GitHub',
    value: 'github.com/einstein-john',
    href: PERSON.profiles.github,
    icon: <Github className="w-4 h-4" aria-hidden="true" />,
  },
  {
    label: 'LinkedIn',
    value: 'linkedin.com/in/einstein-john',
    href: PERSON.profiles.linkedin,
    icon: <Linkedin className="w-4 h-4" aria-hidden="true" />,
  },
];

export function About() {
  const posthog = usePostHog();

  return (
    <section id="about" className="py-20 px-6 relative scroll-mt-20" aria-labelledby="about-title">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#ff6600] to-transparent"></div>

      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <h2 id="about-title" className="text-4xl lg:text-5xl">
            About <span className="text-[#ff6600]">Me</span>
          </h2>
          <p className="text-[#999] text-lg">
            Remote backend &amp; automation engineer, available for contract and permanent roles.
          </p>
        </div>

        <div className="space-y-6 text-[#ccc] leading-relaxed">
          <p>
            I'm a <strong className="text-white">backend and automation engineer</strong> who works
            primarily in <strong className="text-[#ff6600]">TypeScript</strong> and{' '}
            <strong className="text-[#ff6600]">Node.js</strong>, wiring services together with{' '}
            <strong className="text-[#ff6600]">n8n</strong> workflow automation. I'm based remotely
            and collaborate with distributed teams across Australia, Europe and the US, which means
            async-friendly documentation and clear, reviewable pull requests are part of my normal
            working style rather than an afterthought.
          </p>

          <p>
            My work usually starts with an API: designing REST and OpenAPI interfaces, shaping the
            data model behind them, and deciding what belongs in a queue, a cron job or an n8n
            workflow. I care about type safety, sensible observability and APIs that stay
            predictable after the first hundred calls. On the automation side, I treat workflows as
            production code — versioned, tested and observable — rather than a pile of glue nobody
            wants to touch.
          </p>

          <p>
            The projects below are the ones I'm happy to be judged on: an API discovery tool, a
            file-compression microservice and a production backend for a fitness product. A few of
            them are client work, so I've kept the public detail to what I'm cleared to share. I
            write up the engineering decisions and the things that broke along the way on{' '}
            <a
              href="/fyi"
              className="text-[#ff6600] hover:text-[#ff8833] underline underline-offset-4"
            >
              FYI
            </a>
            .
          </p>
        </div>

        <address className="not-italic">
          <p className="sr-only">Contact details</p>
          <ul className="flex flex-wrap justify-center gap-x-8 gap-y-3 list-none pt-2">
            {CONTACT_LINKS.map((link) => (
              <li key={link.label}>
                <a
                  href={link.href}
                  {...(link.href.startsWith('http')
                    ? { target: '_blank', rel: 'noopener noreferrer' }
                    : {})}
                  className="inline-flex items-center gap-2 text-[#999] hover:text-[#ff6600] transition-colors duration-300"
                  aria-label={`${link.label} — ${link.value}`}
                  onClick={() =>
                    posthog?.capture('about_contact_clicked', {
                      platform: link.label,
                      href: link.href,
                    })
                  }
                >
                  {link.icon}
                  <span>{link.value}</span>
                </a>
              </li>
            ))}
          </ul>
        </address>
      </div>
    </section>
  );
}
