import { Breadcrumbs } from '../components/Breadcrumbs';
import { SEOHelmet } from '../components/SEOHelmet';
import { Link } from '../context/RouterContext';
import { CATEGORIES } from '../data/categories';
import { TOOLS } from '../data/tools';
import { GUIDES } from '../data/guides';
import { FileText, Compass, FolderTree, Wrench, BookOpen, ShieldCheck } from 'lucide-react';

export function SitemapView() {
  const mainPages = [
    { label: 'Home', path: '/', description: 'The main homepage with popular tools, quick search, and category shortcuts.' },
    { label: 'All Tools', path: '/tools', description: 'Complete directory of all calculators, converters, and utilities with search and filters.' },
    { label: 'Guides', path: '/guides', description: 'Step-by-step guides, formulas, practical examples, and everyday tips.' },
    { label: 'About', path: '/about', description: 'Information about our platform, computational approach, and design principles.' },
    { label: 'Contact', path: '/contact', description: 'Get in touch for feedback, suggestions, questions, or bug reports.' },
  ];

  const legalPages = [
    { label: 'About', path: '/about', description: 'Platform overview and mission.' },
    { label: 'Contact', path: '/contact', description: 'Inquiry and feedback channels.' },
    { label: 'Privacy Policy', path: '/privacy-policy', description: 'How your data is handled and processed locally in your browser.' },
    { label: 'Terms of Service', path: '/terms', description: 'Terms governing the use of our calculation tools and guides.' },
    { label: 'Cookie Policy', path: '/cookie-policy', description: 'Details on cookies, local browser storage, and third-party services.' },
    { label: 'Sitemap', path: '/sitemap', description: 'Human-readable navigation index for all pages, categories, and tools.' },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <SEOHelmet
        title="Sitemap – Online Tools"
        description="Browse the main pages, categories, tools, and guides available on Online Tools."
        canonicalPath="/sitemap"
      />

      {/* 1. Breadcrumb: Home → Sitemap */}
      <Breadcrumbs items={[{ label: 'Sitemap', path: '/sitemap' }]} />

      {/* 2. Header */}
      <header className="border-b border-[#E4E8EF] pb-6">
        <h1 className="text-2xl sm:text-3xl font-heading font-extrabold text-[#131A2B] tracking-tight">
          Sitemap
        </h1>
        <p className="mt-2 text-sm sm:text-base font-sans text-[#5B6577] leading-relaxed">
          Browse the main pages, categories, tools, and guides available on Online Tools.
        </p>
      </header>

      {/* 3. Main Page Groups */}
      <div className="space-y-8 font-sans">
        {/* Main Pages */}
        <section aria-labelledby="main-pages-heading" className="bg-[#FFFFFF] border border-[#E4E8EF] rounded-2xl p-6 shadow-2xs">
          <div className="flex items-center gap-2 mb-4">
            <Compass className="w-5 h-5 text-[#2563EB]" aria-hidden="true" />
            <h2 id="main-pages-heading" className="text-lg font-heading font-bold text-[#131A2B]">
              Main Pages
            </h2>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {mainPages.map((page) => (
              <li key={page.path} className="p-3 rounded-xl border border-[#E4E8EF] hover:border-[#CBD5E1] bg-[#F4F6F9] transition-colors">
                <Link
                  href={page.path}
                  className="font-heading font-semibold text-sm text-[#2563EB] hover:text-[#1D4ED8] hover:underline"
                >
                  {page.label}
                </Link>
                <p className="text-xs text-[#5B6577] mt-1 leading-relaxed">
                  {page.description}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* Categories */}
        <section aria-labelledby="categories-heading" className="bg-[#FFFFFF] border border-[#E4E8EF] rounded-2xl p-6 shadow-2xs">
          <div className="flex items-center gap-2 mb-4">
            <FolderTree className="w-5 h-5 text-[#2563EB]" aria-hidden="true" />
            <h2 id="categories-heading" className="text-lg font-heading font-bold text-[#131A2B]">
              Categories
            </h2>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CATEGORIES.map((cat) => (
              <li key={cat.id} className="p-3 rounded-xl border border-[#E4E8EF] hover:border-[#CBD5E1] bg-[#F4F6F9] transition-colors">
                <div className="flex items-center justify-between">
                  <Link
                    href={`/${cat.slug}`}
                    className="font-heading font-semibold text-sm text-[#2563EB] hover:text-[#1D4ED8] hover:underline"
                  >
                    {cat.name}
                  </Link>
                  <span className="text-xs text-[#5B6577] bg-[#FFFFFF] px-2 py-0.5 rounded border border-[#E4E8EF]">
                    {cat.toolCount} {cat.toolCount === 1 ? 'tool' : 'tools'}
                  </span>
                </div>
                <p className="text-xs text-[#5B6577] mt-1 line-clamp-2 leading-relaxed">
                  {cat.description}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* Tools (Dynamically Generated from Registry) */}
        <section aria-labelledby="tools-heading" className="bg-[#FFFFFF] border border-[#E4E8EF] rounded-2xl p-6 space-y-6 shadow-2xs">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-[#2563EB]" aria-hidden="true" />
            <h2 id="tools-heading" className="text-lg font-heading font-bold text-[#131A2B]">
              Tools
            </h2>
          </div>

          <div className="space-y-6">
            {CATEGORIES.map((cat) => {
              const categoryTools = TOOLS.filter((t) => t.category === cat.id);
              if (categoryTools.length === 0) return null;

              return (
                <div key={cat.id} className="space-y-2.5">
                  <h3 className="text-sm font-heading font-semibold text-[#131A2B] flex items-center gap-2">
                    <span>{cat.name}</span>
                    <span className="text-xs font-normal text-[#5B6577]">
                      ({categoryTools.length})
                    </span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {categoryTools.map((tool) => (
                      <Link
                        key={tool.id}
                        href={`/${tool.category}/${tool.slug}`}
                        className="p-3 rounded-xl border border-[#E4E8EF] hover:border-[#CBD5E1] bg-[#F4F6F9] block transition-colors group"
                      >
                        <div className="font-heading font-semibold text-xs sm:text-sm text-[#2563EB] group-hover:text-[#1D4ED8] group-hover:underline">
                          {tool.name}
                        </div>
                        <p className="text-xs text-[#5B6577] mt-0.5 line-clamp-2 leading-relaxed">
                          {tool.description}
                        </p>
                      </Link>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Guides (Dynamically Generated from Registry) */}
        <section aria-labelledby="guides-heading" className="bg-[#FFFFFF] border border-[#E4E8EF] rounded-2xl p-6 shadow-2xs">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-[#2563EB]" aria-hidden="true" />
            <h2 id="guides-heading" className="text-lg font-heading font-bold text-[#131A2B]">
              Guides
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {GUIDES.map((guide) => (
              <Link
                key={guide.slug}
                href={`/guides/${guide.slug}`}
                className="p-3 rounded-xl border border-[#E4E8EF] hover:border-[#CBD5E1] bg-[#F4F6F9] block transition-colors group"
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-heading font-semibold text-xs sm:text-sm text-[#2563EB] group-hover:text-[#1D4ED8] group-hover:underline line-clamp-1">
                    {guide.title}
                  </span>
                  <span className="text-[11px] text-[#5B6577] shrink-0 bg-[#FFFFFF] px-1.5 py-0.5 rounded border border-[#E4E8EF]">
                    {guide.readingTime}
                  </span>
                </div>
                <p className="text-xs text-[#5B6577] line-clamp-2 leading-relaxed">
                  {guide.description}
                </p>
              </Link>
            ))}
          </div>
        </section>

        {/* Company & Legal */}
        <section aria-labelledby="legal-heading" className="bg-[#FFFFFF] border border-[#E4E8EF] rounded-2xl p-6 shadow-2xs">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-5 h-5 text-[#2563EB]" aria-hidden="true" />
            <h2 id="legal-heading" className="text-lg font-heading font-bold text-[#131A2B]">
              Company &amp; Legal
            </h2>
          </div>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {legalPages.map((page) => (
              <li key={page.path} className="p-3 rounded-xl border border-[#E4E8EF] hover:border-[#CBD5E1] bg-[#F4F6F9] transition-colors">
                <Link
                  href={page.path}
                  className="font-heading font-semibold text-sm text-[#2563EB] hover:text-[#1D4ED8] hover:underline"
                >
                  {page.label}
                </Link>
                <p className="text-xs text-[#5B6577] mt-1 leading-relaxed">
                  {page.description}
                </p>
              </li>
            ))}
          </ul>
        </section>

        {/* Machine-Readable Endpoints Note */}
        <section aria-label="Machine-Readable Indexes" className="p-4 rounded-xl bg-[#FFFFFF] border border-[#E4E8EF] text-xs text-[#5B6577] flex flex-wrap items-center justify-between gap-3 shadow-2xs font-sans">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#5B6577]" aria-hidden="true" />
            <span>Looking for machine-readable search engine crawlers files?</span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="/sitemap.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="font-heading font-semibold text-[#2563EB] hover:underline"
            >
              sitemap.xml
            </a>
            <span aria-hidden="true">•</span>
            <a
              href="/robots.txt"
              target="_blank"
              rel="noopener noreferrer"
              className="font-heading font-semibold text-[#2563EB] hover:underline"
            >
              robots.txt
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
