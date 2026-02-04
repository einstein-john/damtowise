import { Hero } from '@/app/components/Hero';
import { TechStack } from '@/app/components/TechStack';
import { Projects } from '@/app/components/Projects';
import { Footer } from '@/app/components/Footer';

export default function App() {
  return (
    <div className="min-h-screen bg-black text-white">
      <Hero />
      <TechStack />
      <Projects />
      <Footer />
    </div>
  );
}
