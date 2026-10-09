import React from 'react';
import { usePostHog } from '@posthog/react';
import { DataFlowIcon, BranchFlowIcon, ApiFlowIcon } from './LogicFlowIcons';
import { ExternalLink } from 'lucide-react';
import { Github } from './BrandIcons';
import { PROJECTS, type Project } from '@/app/data/projects';

/** Decorative diagram per project — visuals only, hidden from assistive tech. */
function projectIcon(project: Project): React.ReactNode {
  const className = 'w-full h-full';
  switch (project.slug) {
    case 'api-scanner':
      return <ApiFlowIcon className={className} />;
    case 'compressor-service':
      return <DataFlowIcon className={className} />;
    default:
      return <BranchFlowIcon className={className} />;
  }
}

function ProjectCard({ project }: { project: Project }) {
  const posthog = usePostHog();
  const { title, summary, tags, githubUrl, liveUrl, path } = project;

  /**
   * The dedicated /projects/:slug case studies are phase 3 of the SEO plan.
   * Until they exist, cards point at a destination that actually resolves so
   * the home page never emits a link into a 404. Flip `projectPageLive` to
   * true once those routes ship.
   */
  const projectPageLive = false;
  const primaryHref = githubUrl ?? liveUrl ?? path;
  const primaryIsExternal = Boolean(githubUrl ?? liveUrl);

  const track = (destination: string, href: string) =>
    posthog?.capture('project_link_clicked', {
      project_title: title,
      project_slug: project.slug,
      destination,
      href,
    });

  return (
    <article className="group bg-[#0a0a0a] border border-[#333] rounded-lg relative overflow-hidden transition-all duration-300 hover:border-[#ff6600]">
      <div className="absolute inset-0 bg-gradient-to-br from-[#ff6600]/0 via-transparent to-[#ff6600]/0 group-hover:from-[#ff6600]/5 group-hover:to-[#ff6600]/10 transition-all duration-300 pointer-events-none" />

      <div className="relative p-6 space-y-4">
        <div
          className="w-20 h-20 flex items-center justify-center text-[#999] group-hover:text-[#ff6600] transition-colors duration-300"
          aria-hidden="true"
        >
          {projectIcon(project)}
        </div>

        <h3 className="text-2xl transition-colors duration-300">
          <a
            href={primaryHref}
            {...(primaryIsExternal ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
            className="before:absolute before:inset-0 before:content-[''] group-hover:text-[#ff6600] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff6600] rounded-sm"
            onClick={() =>
              track(
                primaryIsExternal ? (githubUrl ? 'github' : 'live') : 'project_page',
                primaryHref,
              )
            }
          >
            {title}
          </a>
        </h3>

        <p className="text-[#999] leading-relaxed">{summary}</p>

        <ul className="flex flex-wrap gap-2 pt-2 list-none" aria-label={`${title} technology tags`}>
          {tags.map((tag) => (
            <li
              key={tag}
              className="px-3 py-1 bg-[#1a1a1a] border border-[#333] rounded-full text-sm text-[#999] group-hover:border-[#ff6600]/30 group-hover:text-[#ff6600] transition-all duration-300"
            >
              {tag}
            </li>
          ))}
        </ul>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 relative z-10">
          {githubUrl && (
            <a
              href={githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[#999] hover:text-[#ff6600] transition-colors duration-300"
              aria-label={`View ${title} source code on GitHub`}
              onClick={() => track('github', githubUrl)}
            >
              <Github className="w-4 h-4" aria-hidden="true" />
              Code
            </a>
          )}
          {liveUrl && (
            <a
              href={liveUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[#999] hover:text-[#ff6600] transition-colors duration-300"
              aria-label={`Visit ${title} live site`}
              onClick={() => track('live', liveUrl)}
            >
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
              Live site
            </a>
          )}
          {projectPageLive && (
            <a
              href={path}
              className="inline-flex items-center gap-2 text-[#999] hover:text-[#ff6600] transition-colors duration-300"
              onClick={() => track('project_page', path)}
            >
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
              Case study
            </a>
          )}
        </div>
      </div>
    </article>
  );
}

function ProjectGrid({ projects }: { projects: Project[] }) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {projects.map((project) => (
        <ProjectCard key={project.slug} project={project} />
      ))}
    </div>
  );
}

const GROUP_LABELS: Record<Project['group'], { heading: string; blurb: string }> = {
  backend: {
    heading: 'Backend',
    blurb: 'APIs, services and automation tooling built with TypeScript and Node.js.',
  },
  frontend: {
    heading: 'Frontend',
    blurb: 'Client-facing interfaces with semantic HTML and a focus on performance.',
  },
};

export function Projects() {
  const groups = (Object.keys(GROUP_LABELS) as Project['group'][]).map((group) => ({
    group,
    ...GROUP_LABELS[group],
    projects: PROJECTS.filter((project) => project.group === group),
  }));

  return (
    <section
      id="projects"
      className="py-20 px-6 relative scroll-mt-20"
      aria-labelledby="projects-title"
    >
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#ff6600] to-transparent"></div>

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 id="projects-title" className="text-4xl lg:text-5xl">
            Featured <span className="text-[#ff6600]">Projects</span>
          </h2>
          <p className="text-[#999] text-lg max-w-2xl mx-auto">
            Backend services and automation tooling, plus selected frontend and client work
          </p>
        </div>

        <div className="space-y-14">
          {groups.map(({ group, heading, blurb, projects }) => (
            <section key={group} aria-labelledby={`${group}-projects-title`} className="space-y-8">
              <div className="text-center space-y-2">
                <h3 id={`${group}-projects-title`} className="text-2xl lg:text-3xl">
                  <span className="text-[#ff6600]">{heading}</span> Projects
                </h3>
                <p className="text-[#999] max-w-xl mx-auto">{blurb}</p>
              </div>
              <ProjectGrid projects={projects} />
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
