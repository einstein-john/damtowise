import React from 'react';
import {
  DataFlowIcon,
  BranchFlowIcon,
  LoopFlowIcon,
  ApiFlowIcon,
} from '@/app/components/LogicFlowIcons';
import { ArrowUpRight, Github } from 'lucide-react';

interface ProjectCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  tags: string[];
  link?: string;
  githubLink?: string;
}

function ProjectCard({ title, description, icon, tags, link, githubLink }: ProjectCardProps) {
  return (
    <div className="group bg-[#0a0a0a] border border-[#333] rounded-lg p-6 hover:border-[#ff6600] transition-all duration-300 relative overflow-hidden">
      {/* Hover gradient effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#ff6600]/0 via-transparent to-[#ff6600]/0 group-hover:from-[#ff6600]/5 group-hover:to-[#ff6600]/10 transition-all duration-300"></div>

      <div className="relative z-10 space-y-4">
        {/* Icon */}
        <div className="w-20 h-20 flex items-center justify-center text-[#999] group-hover:text-[#ff6600] transition-colors duration-300">
          {icon}
        </div>

        {/* Title */}
        <h3 className="text-2xl group-hover:text-[#ff6600] transition-colors duration-300">
          {title}
        </h3>

        {/* Description */}
        <p className="text-[#999] leading-relaxed">{description}</p>

        {/* Tags */}
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

        {/* Links */}
        <div className="flex gap-3 pt-2">
          {link && (
            <button className="flex items-center gap-2 text-[#ff6600] hover:gap-3 transition-all duration-300">
              View Project
              <ArrowUpRight className="w-4 h-4" />
            </button>
          )}
          {githubLink && (
            <button className="flex items-center gap-2 text-[#999] hover:text-[#ff6600] transition-colors duration-300">
              <Github className="w-4 h-4" />
              Code
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function Projects() {
  const projects = [
    {
      title: 'API Gateway System',
      description:
        'Built a scalable API gateway handling 10K+ requests/min with rate limiting, authentication, and request transformation.',
      icon: <ApiFlowIcon className="w-full h-full" />,
      tags: ['TypeScript', 'Node.js', 'Redis', 'REST API'],
      link: '#',
      githubLink: '#',
    },
    {
      title: 'Workflow Automation Platform',
      description:
        'Designed and implemented custom n8n workflows automating data synchronization across multiple services.',
      icon: <BranchFlowIcon className="w-full h-full" />,
      tags: ['n8n', 'Webhooks', 'Integration', 'Automation'],
      link: '#',
      githubLink: '#',
    },
    {
      title: 'Data Pipeline Processor',
      description:
        'Created ETL pipelines processing millions of records daily with error handling and data validation.',
      icon: <DataFlowIcon className="w-full h-full" />,
      tags: ['Node.js', 'PostgreSQL', 'Queue', 'ETL'],
      link: '#',
      githubLink: '#',
    },
    {
      title: 'Real-time Event System',
      description:
        'Developed event-driven architecture with WebSocket support for real-time data streaming and notifications.',
      icon: <LoopFlowIcon className="w-full h-full" />,
      tags: ['WebSocket', 'Event-Driven', 'TypeScript', 'Scalability'],
      link: '#',
      githubLink: '#',
    },
  ];

  return (
    <section id="projects" className="py-20 px-6 relative">
      {/* Section divider with gradient */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#ff6600] to-transparent"></div>

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl lg:text-5xl">
            Featured <span className="text-[#ff6600]">Projects</span>
          </h2>
          <p className="text-[#999] text-lg max-w-2xl mx-auto">
            A showcase of automation systems and backend solutions I've architected and built
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
