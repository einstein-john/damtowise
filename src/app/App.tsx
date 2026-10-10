import React from 'react';
import { DocumentHead } from '@/app/components/DocumentHead';
import { SiteHeader } from '@/app/components/SiteHeader';
import { Footer } from '@/app/components/Footer';
import { ContactModal } from '@/app/components/ContactModal';
import { HomePage } from '@/app/pages/HomePage';
import { NotFoundPage } from '@/app/pages/NotFoundPage';
import { FyiPage } from '@/app/pages/fyi/FyiIndexPage';
import { FyiArticlePage } from '@/app/pages/fyi/FyiArticlePage';
import { AdminConsole } from '@/app/pages/admin/AdminConsole';
import { AdminAuthProvider } from '@/app/lib/admin/auth';
import { FyiCatalogProvider } from '@/app/lib/fyi/store';
import { navigate, useRoute } from '@/app/lib/router';
import { ADMIN_PATH, isFyiArticlePath } from '@/app/data/routes';
import { useAdminHotkey } from '@/app/lib/admin/hotkey';

/**
 * Chrome shared by every route lives here so pages only supply their own
 * content — that way the header, footer and contact modal can never drift
 * between the portfolio and /fyi.
 */
export default function App() {
  const { meta, isNotFound, path } = useRoute();
  const [isContactModalOpen, setIsContactModalOpen] = React.useState(false);

  /**
   * The chord that opens the console. Registered once, here, so it works on
   * every route — the FYI index, an article, the 404 — without any page having
   * to know the admin app exists.
   *
   * It is deliberately not exposed as a link anywhere: `/admin` is disallowed
   * in robots.txt and served with `X-Robots-Tag: noindex, nofollow`, and the
   * console itself renders nothing until a token is verified.
   */
  const openAdmin = React.useCallback(() => {
    if (isAdminPath(path)) return;
    navigate(ADMIN_PATH);
  }, [path]);

  useAdminHotkey(openAdmin);

  // `/admin` is a full-page console: no portfolio header, no footer, no contact
  // modal. It should not look like a page of the site, because it is not one.
  if (isAdminPath(path)) {
    return (
      <div className="min-h-screen bg-fyi-canvas text-fyi-ink">
        <DocumentHead meta={meta} />
        <AdminAuthProvider>
          <AdminConsole path={path} />
        </AdminAuthProvider>
      </div>
    );
  }

  const isArticle = isFyiArticlePath(path);

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
        ) : isArticle ? (
          <FyiCatalogProvider>
            <FyiArticlePage path={path} />
          </FyiCatalogProvider>
        ) : meta?.path === '/fyi/' ? (
          <FyiCatalogProvider>
            <FyiPage />
          </FyiCatalogProvider>
        ) : (
          <HomePage onContact={() => setIsContactModalOpen(true)} />
        )}
      </main>

      <Footer />

      <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />
    </div>
  );
}

function isAdminPath(path: string): boolean {
  return path === ADMIN_PATH || path.startsWith(ADMIN_PATH);
}
