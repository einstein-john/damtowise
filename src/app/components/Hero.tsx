import React from 'react';
import { usePostHog } from '@posthog/react';
import { TerminalWindow } from './TerminalWindow';
import PixelBlast from './PixelBlast';
import { ArrowRight } from 'lucide-react';

export function Hero({ onContact }: { onContact: () => void }) {
  const posthog = usePostHog();

  const scrollToProjects = () => {
    posthog?.capture('view_projects_clicked');
    const projectsSection = document.getElementById('projects');
    if (projectsSection) {
      projectsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      className="min-h-screen flex items-center justify-center px-6 pt-28 pb-20 relative"
      aria-labelledby="hero-title"
    >
      {/* Pixel Blast Background */}
      <div className="absolute inset-0 opacity-80" style={{ zIndex: 0 }}>
        <PixelBlast
          variant="square"
          pixelSize={4}
          color="#ff6600"
          patternScale={2}
          patternDensity={0.6}
          pixelSizeJitter={0}
          enableRipples
          rippleSpeed={0.4}
          rippleThickness={0.12}
          rippleIntensityScale={1.5}
          liquid={false}
          liquidStrength={0.12}
          liquidRadius={1.2}
          liquidWobbleSpeed={5}
          speed={0.5}
          edgeFade={0.4}
          transparent
        />
      </div>

      {/* Dark overlay for better text contrast */}
      <div className="absolute inset-0 bg-black/60" style={{ zIndex: 1 }} aria-hidden="true"></div>

      {/* Background gradient effect */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#ff6600]/5 via-transparent to-transparent"
        style={{ zIndex: 2 }}
        aria-hidden="true"
      ></div>

      <div className="max-w-7xl mx-auto w-full relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left content */}
          <div className="space-y-6">
            <p className="inline-block px-4 py-2 bg-[#ff6600]/10 border border-[#ff6600]/30 rounded-full">
              <span className="text-[#ff6600] text-sm font-mono">
                Available for remote opportunities
              </span>
            </p>

            <h1 id="hero-title" className="text-5xl lg:text-6xl xl:text-7xl tracking-tight">
              Backend &amp;
              <br />
              <span className="text-[#ff6600]">Automation</span>
              <br />
              Engineer
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-[#999] max-w-full leading-relaxed break-words">
              I build <strong className="text-white">scalable backend systems</strong> and{' '}
              <strong className="text-white">intelligent automation workflows</strong> with{' '}
              <strong className="text-white">TypeScript</strong>,{' '}
              <strong className="text-white">Node.js</strong> and{' '}
              <strong className="text-white">n8n</strong> — APIs, services and pipelines that remove
              the manual work from complex processes.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <button
                onClick={scrollToProjects}
                className="w-full sm:w-auto justify-center px-6 py-3 bg-[#ff6600] text-black rounded-lg hover:bg-[#ff7722] transition-all duration-300 flex items-center gap-2 group"
              >
                View Projects
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => {
                  posthog?.capture('contact_modal_opened', { source: 'hero' });
                  onContact();
                }}
                className="w-full sm:w-auto px-6 py-3 border-3 border-[#ff6600]/30 text-[#ff6600] rounded-lg hover:bg-[#ff6600]/10 transition-all duration-300"
              >
                Contact Me
              </button>
            </div>
          </div>

          {/* Right content - Terminal */}
          <div className="relative">
            <div
              className="absolute -inset-4 bg-[#ff6600]/20 blur-3xl rounded-full"
              aria-hidden="true"
            ></div>
            <TerminalWindow />
          </div>
        </div>
      </div>
    </section>
  );
}
