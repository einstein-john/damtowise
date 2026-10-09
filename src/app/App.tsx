import React from 'react';
import { DocumentHead } from '@/app/components/DocumentHead';
import { SiteHeader } from '@/app/components/SiteHeader';
import { Footer } from '@/app/components/Footer';
import { ContactModal } from '@/app/components/ContactModal';
import { HomePage } from '@/app/pages/HomePage';
import { FyiPage } from '@/app/pages/FyiPage';
import { NotFoundPage } from '@/app/pages/NotFoundPage';
import { useRoute } from '@/app/lib/router';

/**
 * Chrome shared by every route lives here so pages only supply their own
 * content — that way the header, footer and contact modal can never drift
 * between the portfolio and /fyi.
 */
export default function App() {
  const { meta, isNotFound } = useRoute();
  const [isContactModalOpen, setIsContactModalOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-black text-white">
      <DocumentHead meta={meta} />

      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-4 focus:left-4 focus:px-4 focus:py-2 focus:bg-[#ff6600] focus:text-black focus:rounded-lg"
      >
        Skip to content
      </a>

      <SiteHeader />

      <main id="main">
        {isNotFound ? (
          <NotFoundPage />
        ) : meta?.path === '/fyi/' ? (
          <FyiPage />
        ) : (
          <HomePage onContact={() => setIsContactModalOpen(true)} />
        )}
      </main>

      <Footer />

      <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />
    </div>
  );
}
