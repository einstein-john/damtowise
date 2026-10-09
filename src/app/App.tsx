import React from 'react';
import { SiteHeader } from '@/app/components/SiteHeader';
import { Hero } from '@/app/components/Hero';
import { About } from '@/app/components/About';
import { TechStack } from '@/app/components/TechStack';
import { Projects } from '@/app/components/Projects';
import { FyiTeaser } from '@/app/components/FyiTeaser';
import { Footer } from '@/app/components/Footer';
import { ContactModal } from '@/app/components/ContactModal';

export default function App() {
  const [isContactModalOpen, setIsContactModalOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-black text-white">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-[#ff6600] focus:text-black focus:rounded-lg"
      >
        Skip to content
      </a>

      <SiteHeader />

      <main id="main">
        <Hero onContact={() => setIsContactModalOpen(true)} />
        <About />
        <TechStack />
        <Projects />
        <FyiTeaser />
      </main>

      <Footer />

      <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />
    </div>
  );
}
