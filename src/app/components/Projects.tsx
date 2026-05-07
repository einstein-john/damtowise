import React from 'react';
import { DataFlowIcon, BranchFlowIcon, ApiFlowIcon } from '@/app/components/LogicFlowIcons';
import { Github } from 'lucide-react';

interface ProjectCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  tags: string[];
  link?: string;
  githubLink?: string;
}

interface ProjectEntry {
  title: string;
  description: string;
  icon: React.ReactNode;
  tags: string[];
  link?: string;
  githubLink?: string;
}

function ProjectCard({ title, description, icon, tags, link, githubLink }: ProjectCardProps) {
  const liveHref = link && link !== '#' ? link : undefined;
  const codeHref = githubLink && githubLink !== '#' ? githubLink : undefined;
  const cardHref = liveHref ?? codeHref;
  /** When both URLs differ, overlay links to primary; elevated link goes to repo. */
  const secondHref = liveHref && codeHref && liveHref !== codeHref ? codeHref : undefined;

  return (
    <div className="group bg-[#0a0a0a] border border-[#333] rounded-lg relative overflow-hidden transition-all duration-300 hover:border-[#ff6600]">
      {/* Full-card hit area (primary destination) */}
      {cardHref && (
        <a
          href={cardHref}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute inset-0 z-10 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-[#ff6600] focus-visible:ring-offset-2 focus-visible:ring-offset-[#0a0a0a]"
          aria-label={`Open ${title}`}
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-br from-[#ff6600]/0 via-transparent to-[#ff6600]/0 group-hover:from-[#ff6600]/5 group-hover:to-[#ff6600]/10 transition-all duration-300 pointer-events-none" />

      <div className="relative z-[1] p-6 space-y-4">
        <div className="w-20 h-20 flex items-center justify-center text-[#999] group-hover:text-[#ff6600] transition-colors duration-300">
          {icon}
        </div>

        <h3 className="text-2xl group-hover:text-[#ff6600] transition-colors duration-300">
          {title}
        </h3>

        <p className="text-[#999] leading-relaxed">{description}</p>

        <div className="flex flex-wrap gap-2 pt-2">
          {tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-[#1a1a1a] border border-[#333] rounded-full text-sm text-[#999] group-hover:border-[#ff6600]/30 group-hover:text-[#ff6600] transition-all duration-300"
            >
              {tag}
            </span>
          ))}
        </div>

        {secondHref && (
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 relative z-20">
            <a
              href={secondHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[#999] hover:text-[#ff6600] transition-colors duration-300"
            >
              <Github className="w-4 h-4" />
              Code
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export function Projects() {
  const projects: ProjectEntry[] = [
    {
      title: 'API Scanner',
      description:
        'Tooling to probe and catalog REST and OpenAPI endpoints—discovery, sanity checks, and quick visibility into surface area for backends you own or integrate with.',
      icon: <ApiFlowIcon className="w-full h-full" />,
      tags: ['REST', 'OpenAPI', 'Automation', 'Backend tooling'],
      link: 'https://scan.damtowise.xyz',
    },
    {
      title: "Mustafa's website",
      description:
        'Marketing and portfolio presence for Mustafa—layout, typography, responsive structure, and performant delivery for client-facing content.',
      icon: <BranchFlowIcon className="w-full h-full" />,
      tags: ['Web', 'UI', 'Responsive', 'Client project'],
      link: 'https://mustafa-tech.com',
    },
    {
      title: 'Compressor service',
      description:
        'Compress PDFs and videos, and convert images to WebP—lighter files and faster loads without juggling separate tools.',
      icon: <DataFlowIcon className="w-full h-full" />,
      tags: ['PDF', 'Video', 'WebP', 'Compression'],
      link: 'https://comp.damtowise.xyz',
    },
  ];

  return (
    <section id="projects" className="py-20 px-6 relative">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#ff6600] to-transparent"></div>

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl lg:text-5xl">
            Featured <span className="text-[#ff6600]">Projects</span>
          </h2>
          <p className="text-[#999] text-lg max-w-2xl mx-auto">
            Automation and backend work, plus selected tools and client sites I've shipped
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {projects.map((project) => (
            <ProjectCard
              key={project.title}
              title={project.title}
              description={project.description}
              icon={project.icon}
              tags={project.tags}
              link={project.link}
              githubLink={project.githubLink}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
