import React, { lazy, Suspense, useEffect, useState } from 'react';
import { usePostHog } from '@posthog/react';
import { TerminalWindow } from './TerminalWindow';
import { ArrowRight } from 'lucide-react';

const PixelBlast = lazy(() => import('./PixelBlast'));

export function Hero({ onContact }: { onContact: () => void }) {
  const posthog = usePostHog();
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    // Only load heavy WebGL Three.js on desktop screens and when reduced-motion is not requested
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isDesktopQuery = window.matchMedia('(min-width: 768px)');

    if (isDesktopQuery.matches && !prefersReducedMotion) {
      if ('requestIdleCallback' in window) {
        const id = (
          window as Window & {
            requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number;
          }
        ).requestIdleCallback(() => setIsDesktop(true), { timeout: 1500 });
        return () => {
          if ('cancelIdleCallback' in window) {
            (window as Window & { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(
              id,
            );
          }
        };
      } else {
        const timer = setTimeout(() => setIsDesktop(true), 300);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const scrollToProjects = () => {
    posthog?.capture('view_projects_clicked');
    const projectsSection = document.getElementById('projects');
    if (projectsSection) {
      projectsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      className="min-h-screen flex items-center justify-center px-6 pt-28 pb-20 relative overflow-hidden"
      aria-labelledby="hero-title"
    >
      {/* Ambient background glow (CSS-based, 0 overhead for mobile & initial paint) */}
      <div
        className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(255,102,0,0.15),transparent)] pointer-events-none"
        style={{ zIndex: 0 }}
      />

      {/* Pixel Blast Background (Desktop only, lazy loaded after idle) */}
      {isDesktop && (
        <div className="absolute inset-0 opacity-80 pointer-events-none" style={{ zIndex: 0 }}>
          <Suspense fallback={null}>
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
          </Suspense>
        </div>
      )}

      {/* Dark overlay for better text contrast */}
      <div
        className="absolute inset-0 bg-black/60 pointer-events-none"
        style={{ zIndex: 1 }}
        aria-hidden="true"
      ></div>

      {/* Background gradient effect */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-[#ff6600]/5 via-transparent to-transparent pointer-events-none"
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

            <h1
              id="hero-title"
              className="text-5xl lg:text-6xl xl:text-7xl tracking-tight leading-[1.1]"
            >
              Backend &amp;
              <br />
              <span className="text-[#ff6600]">Automation</span>
              <br />
              Engineer
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-[#999] max-w-full leading-relaxed break-words min-h-[4rem] sm:min-h-0">
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
                className="w-full sm:w-auto justify-center px-6 py-3 bg-[#ff6600] text-black rounded-lg hover:bg-[#ff7722] transition-all duration-300 flex items-center gap-2 group cursor-pointer"
              >
                View Projects
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <button
                onClick={() => {
                  posthog?.capture('contact_modal_opened', { source: 'hero' });
                  onContact();
                }}
                className="w-full sm:w-auto px-6 py-3 border-3 border-[#ff6600]/30 text-[#ff6600] rounded-lg hover:bg-[#ff6600]/10 transition-all duration-300 cursor-pointer"
              >
                Contact Me
              </button>
            </div>
          </div>

          {/* Right content - Terminal */}
          <div className="relative">
            <div
              className="absolute -inset-4 bg-[#ff6600]/20 blur-3xl rounded-full pointer-events-none -z-10"
              aria-hidden="true"
              style={{ contain: 'paint' }}
            ></div>
            <TerminalWindow />
          </div>
        </div>
      </div>
    </section>
  );
}
