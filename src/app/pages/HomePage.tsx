import React from 'react';
import { Hero } from '@/app/components/Hero';
import { About } from '@/app/components/About';
import { TechStack } from '@/app/components/TechStack';
import { Projects } from '@/app/components/Projects';

export function HomePage({ onContact }: { onContact: () => void }) {
  return (
    <>
      <Hero onContact={onContact} />
      <About />
      <TechStack />
      <Projects />
    </>
  );
}
