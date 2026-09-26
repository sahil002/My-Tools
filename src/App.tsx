import { RouterProvider, useRouter, Link } from './context/RouterContext';
import { ThemeProvider } from './context/ThemeContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomeView } from './views/HomeView';
import { ToolsDirectoryView } from './views/ToolsDirectoryView';
import { CategoryView } from './views/CategoryView';
import { ToolView } from './views/ToolView';
import { GuidesDirectoryView } from './views/GuidesDirectoryView';
import { GuideArticleView } from './views/GuideArticleView';
import { AboutView } from './views/AboutView';
import { ContactView } from './views/ContactView';
import { PrivacyView } from './views/PrivacyView';
import { TermsView } from './views/TermsView';
import { CookiePolicyView } from './views/CookiePolicyView';
import { SitemapView } from './views/SitemapView';
import { AdminLoginView } from './views/AdminLoginView';
import { AdminDashboardView } from './views/AdminDashboardView';
import { AdminToolsView } from './views/AdminToolsView';
import { AdminAnalyticsView } from './views/AdminAnalyticsView';
import { AdminCommentsView } from './views/AdminCommentsView';
import { AdminRequestsView } from './views/AdminRequestsView';
import { AdminFavoritesView } from './views/AdminFavoritesView';
import { AdminAdsView } from './views/AdminAdsView';
import { AdminSeoView } from './views/AdminSeoView';
import { AdminSettingsView } from './views/AdminSettingsView';
import { RequestToolView } from './views/RequestToolView';
import { FavoritesView } from './views/FavoritesView';
import { getAdminLoginRoute } from './services/adminAuth';
import { CATEGORIES, getCategoryBySlug } from './data/categories';
import { getToolBySlug } from './data/tools';
import { getGuideBySlug } from './data/guides';
import { SEOHelmet } from './components/SEOHelmet';
import { AdminRouteGuard } from './components/admin/AdminRouteGuard';
import { AlertCircle, Home, Search } from 'lucide-react';

function AppContent() {
  const { currentPath, navigate } = useRouter();

  // Clean path segments
  const cleanPath = currentPath.split('?')[0].replace(/\/+$/, '') || '/';
  const segments = cleanPath.split('/').filter(Boolean);
  const adminLoginRoute = getAdminLoginRoute();

  // Router dispatcher
  const renderView = () => {
    // 0. Private Admin Authentication Routes
    if (cleanPath === adminLoginRoute || cleanPath === '/admin/login' || cleanPath === '/panel-access') {
      return <AdminLoginView />;
    }

    if (segments[0] === 'admin') {
      if (segments[1] === 'login') {
        return <AdminLoginView />;
      }

      const adminContent = (() => {
        if (segments[1] === 'tools') {
          return <AdminToolsView />;
        }
        if (segments[1] === 'analytics') {
          return <AdminAnalyticsView />;
        }
        if (segments[1] === 'comments') {
          return <AdminCommentsView />;
        }
        if (segments[1] === 'requests') {
          return <AdminRequestsView />;
        }
        if (segments[1] === 'favorites') {
          return <AdminFavoritesView />;
        }
        if (segments[1] === 'ads') {
          return <AdminAdsView />;
        }
        if (segments[1] === 'seo') {
          return <AdminSeoView />;
        }
        if (segments[1] === 'settings') {
          return <AdminSettingsView />;
        }
        return <AdminDashboardView />;
      })();

      return <AdminRouteGuard>{adminContent}</AdminRouteGuard>;
    }

    // 1. Root Homepage
    if (segments.length === 0) {
      return <HomeView />;
    }

    const firstSegment = segments[0];

    // 2. Tools Directory
    if (firstSegment === 'tools' && segments.length === 1) {
      return <ToolsDirectoryView />;
    }

    // 3. Guides Hub & Guide Articles
    if (firstSegment === 'guides') {
      if (segments.length === 1) {
        return <GuidesDirectoryView />;
      }
      if (segments.length === 2) {
        return <GuideArticleView slug={segments[1]} />;
      }
    }

    // 4. Quality & Legal Pages
    if (firstSegment === 'favorites' && segments.length === 1) {
      return <FavoritesView />;
    }
    if (firstSegment === 'about' && segments.length === 1) {
      return <AboutView />;
    }
    if (firstSegment === 'contact' && segments.length === 1) {
      return <ContactView />;
    }
    if (firstSegment === 'request-a-tool' && segments.length === 1) {
      return <RequestToolView />;
    }
    if (firstSegment === 'privacy-policy' && segments.length === 1) {
      return <PrivacyView />;
    }
    if (firstSegment === 'terms' && segments.length === 1) {
      return <TermsView />;
    }
    if (firstSegment === 'cookie-policy' && segments.length === 1) {
      return <CookiePolicyView />;
    }
    if (firstSegment === 'sitemap' && segments.length === 1) {
      return <SitemapView />;
    }

    // 5. Category Pages: /calculators, /text-tools, /converters, etc.
    const matchedCategory = getCategoryBySlug(firstSegment);
    if (matchedCategory && segments.length === 1) {
      return <CategoryView categorySlug={firstSegment} />;
    }

    // 6. Tool Pages: /tools/percentage-calculator, /calculators/percentage-calculator, etc.
    if (segments.length === 2) {
      const toolSlug = segments[1];
      return <ToolView toolSlug={toolSlug} />;
    }

    // 7. Direct tool access fallback (e.g., /percentage-calculator)
    if (segments.length === 1) {
      const matchedTool = getToolBySlug(firstSegment);
      if (matchedTool) {
        return <ToolView toolSlug={firstSegment} />;
      }
    }

    // 8. 404 Fallback
    return (
      <div className="py-16 text-center max-w-lg mx-auto">
        <SEOHelmet
          title="Page Not Found (404) – Online Tools"
          description="The page you requested could not be found. Search our calculators and tools directory."
          canonicalPath="/404"
          noindex={true}
        />
        <div className="w-12 h-12 rounded-full bg-[#FFFBEB] text-[#F59E0B] flex items-center justify-center mx-auto mb-3 border border-[#F59E0B]/20">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h1 className="text-xl sm:text-2xl font-heading font-bold text-[#1E1035]">Page Not Found</h1>
        <p className="mt-1.5 text-xs sm:text-sm font-sans text-[#6D6582] leading-relaxed">
          We could not locate the utility, guide, or page at <code className="text-xs bg-[#FAF9FE] px-2 py-0.5 rounded border border-[#EDE9FE] text-[#1E1035]">{cleanPath}</code>.
        </p>

        <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#7C3AED] text-[#FFFFFF] rounded-xl text-xs font-heading font-semibold hover:bg-[#6D28D9] cursor-pointer transition-colors shadow-xs"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Return Home</span>
          </button>
          <button
            type="button"
            onClick={() => navigate('/tools')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#FFFFFF] border border-[#EDE9FE] text-[#1E1035] rounded-xl text-xs font-heading font-semibold hover:border-[#7C3AED] hover:text-[#7C3AED] cursor-pointer transition-colors"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search Tools Directory</span>
          </button>
        </div>
      </div>
    );
  };

  const isAdminView = segments[0] === 'admin';

  if (isAdminView) {
    return (
      <div id="admin-shell-root" className="min-h-screen bg-[#FAF9FE] text-[#1E1035] antialiased">
        {renderView()}
      </div>
    );
  }

  const isHomeView = segments.length === 0;

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF9FE] text-[#1E1035] antialiased">
      <Header />
      {isHomeView ? (
        <main id="main-content" className="flex-1 w-full">
          {renderView()}
        </main>
      ) : (
        <main id="main-content" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          {renderView()}
        </main>
      )}
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <RouterProvider>
        <AppContent />
      </RouterProvider>
    </ThemeProvider>
  );
}
