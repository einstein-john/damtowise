import React from 'react';

interface TechCardProps {
  name: string;
  icon: React.ReactNode;
  description: string;
}

function TechCard({ name, icon, description }: TechCardProps) {
  return (
    <div className="group relative bg-[#0a0a0a] border border-[#333] rounded-lg p-6 sm:p-8 hover:border-[#ff6600] transition-all duration-300 cursor-pointer">
      <div className="absolute inset-0 bg-gradient-to-br from-[#ff6600]/0 to-[#ff6600]/0 group-hover:from-[#ff6600]/5 group-hover:to-[#ff6600]/10 rounded-lg transition-all duration-300"></div>

      <div className="relative z-10 space-y-3 sm:space-y-4">
        <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center text-[#999] group-hover:text-[#ff6600] transition-colors duration-300">
          {icon}
        </div>

        <h3 className="text-xl sm:text-2xl group-hover:text-[#ff6600] transition-colors duration-300">
          {name}
        </h3>

        <p className="text-sm sm:text-base text-[#999] leading-relaxed">{description}</p>
      </div>
    </div>
  );
}

export function TechStack() {
  const technologies = [
    {
      name: 'TypeScript',
      description:
        'Type-safe development with modern JavaScript, ensuring robust and maintainable code.',
      icon: (
        <svg viewBox="0 0 256 256" className="w-full h-full" fill="currentColor">
          <rect width="256" height="256" fill="currentColor" fillOpacity="0.1" rx="28" />
          <path
            d="M20 20h216v216H20V20zm198.5 188.5l-52-180.5h-15l52 180.5h15zM128 128h-48v15h48v-15zm-48-30h48v-15h-48v15zm48 75h-48v15h48v-15z"
            fill="currentColor"
          />
          <text
            x="128"
            y="160"
            fontSize="120"
            fontWeight="600"
            textAnchor="middle"
            fill="currentColor"
            fontFamily="Arial, sans-serif"
          >
            TS
          </text>
        </svg>
      ),
    },
    {
      name: 'Node.js',
      description: 'Building fast, scalable server-side applications with JavaScript runtime.',
      icon: (
        <svg viewBox="0 0 256 256" className="w-full h-full" fill="currentColor">
          <path d="M128 18.5c-5.9 0-11.7 1.6-16.8 4.5L36.9 66.8c-10.4 6-16.8 17.1-16.8 29.2v64c0 12.1 6.4 23.2 16.8 29.2l74.3 43.8c5.1 2.9 10.9 4.5 16.8 4.5s11.7-1.6 16.8-4.5l74.3-43.8c10.4-6 16.8-17.1 16.8-29.2V96c0-12.1-6.4-23.2-16.8-29.2l-74.3-43.8c-5.1-2.9-10.9-4.5-16.8-4.5zm0 20c3.4 0 6.8.9 9.7 2.6l74.3 43.8c6 3.5 9.7 9.9 9.7 16.9v64c0 7-3.7 13.4-9.7 16.9L137.7 226c-2.9 1.7-6.3 2.6-9.7 2.6s-6.8-.9-9.7-2.6l-74.3-43.8c-6-3.5-9.7-9.9-9.7-16.9V96c0-7 3.7-13.4 9.7-16.9l74.3-43.8c2.9-1.7 6.3-2.6 9.7-2.6z" />
        </svg>
      ),
    },
    {
      name: 'n8n',
      description: 'Workflow automation platform for connecting apps and services seamlessly.',
      icon: (
        <svg viewBox="0 0 256 256" className="w-full h-full" fill="currentColor">
          <path d="M128 32L32 96v64l96 64 96-64V96L128 32zm0 28l68 45.3v42.4L128 193l-68-45.3v-42.4L128 60z" />
          <circle cx="80" cy="128" r="16" />
          <circle cx="128" cy="90" r="16" />
          <circle cx="176" cy="128" r="16" />
          <circle cx="128" cy="166" r="16" />
          <line x1="80" y1="128" x2="128" y2="90" stroke="currentColor" strokeWidth="4" />
          <line x1="128" y1="90" x2="176" y2="128" stroke="currentColor" strokeWidth="4" />
          <line x1="176" y1="128" x2="128" y2="166" stroke="currentColor" strokeWidth="4" />
          <line x1="128" y1="166" x2="80" y2="128" stroke="currentColor" strokeWidth="4" />
        </svg>
      ),
    },
  ];

  return (
    <section className="py-20 px-6 relative">
      {/* Section divider with gradient */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#ff6600] to-transparent"></div>

      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-4xl lg:text-5xl">
            Tech <span className="text-[#ff6600]">Stack</span>
          </h2>
          <p className="text-[#999] text-lg max-w-2xl mx-auto">
            Specialized tools and technologies I use to build powerful automation and backend
            solutions
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {technologies.map((tech) => (
            <TechCard
              key={tech.name}
              name={tech.name}
              icon={tech.icon}
              description={tech.description}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
