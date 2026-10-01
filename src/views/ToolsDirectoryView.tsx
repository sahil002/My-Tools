import { useState, useId } from 'react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { ToolCard } from '../components/ToolCard';
import { CategoryCard } from '../components/CategoryCard';
import { FAQAccordion } from '../components/FAQAccordion';
import { SEOHelmet } from '../components/SEOHelmet';
import { AdSlot } from '../components/AdSlotPlaceholder';
import { useMergedTools } from '../services/toolRegistryService';
import { useCategories } from '../data/categories';
import { getSiteUrl } from '../data/siteConfig';
import { Link } from '../context/RouterContext';
import {
  Search,
  X,
  RotateCcw,
  Compass,
  Wrench,
  Sparkles,
  Zap,
  Shield,
  Smartphone,
  CheckCircle2,
  LayoutGrid,
  ArrowRight,
  BookOpen,
} from 'lucide-react';

const TOOLS_DIRECTORY_FAQS = [
  {
    question: 'How do the online tools and calculators work?',
    answer:
      'All our utilities run entirely client-side inside your modern web browser. When you enter numbers, text, or formulas, computation scripts calculate results immediately without waiting for server responses or slow page reloads.',
  },
  {
    question: 'Are my inputs and calculations kept private and secure?',
    answer:
      'Yes, 100%. Because all calculations execute directly on your local device within secure sandboxed environments, none of your sensitive financial, personal, or mathematical inputs are ever transmitted, tracked, or saved on our servers.',
  },
  {
    question: 'Do I need to sign up or pay to use any tool?',
    answer:
      'No. Every single utility on PRBSolver is completely free to access with zero sign-up, zero subscriptions, and no trial limits. You can compute unlimited times across all categories.',
  },
  {
    question: 'Can I bookmark or favorite tools for quick access?',
    answer:
      'Yes! Click the heart bookmark icon in the top right of any tool card or tool page. Your favorite utilities are instantly saved to your browser so you can access them from the "Favorites" tab anytime.',
  },
  {
    question: 'What if a tool or converter I need is missing?',
    answer:
      'We welcome community requests! Visit our "Request a Tool" page from the footer navigation to suggest any calculator, unit converter, or developer helper. Our team reviews all suggestions to build requested tools.',
  },
];

export function ToolsDirectoryView() {
  const searchInputId = useId();
  const categorySelectId = useId();
  const { tools } = useMergedTools();
  const categories = useCategories();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('q') || '';
    }
    return '';
  });

  // Filter tools by category, name, description, category name, and keywords
  const filteredTools = tools.filter((tool) => {
    const matchesCategory =
      selectedCategory === 'all' || tool.category === selectedCategory;

    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesCategory;

    const catObj = categories.find((c) => c.id === tool.category || c.slug === tool.category);
    const catName = catObj ? catObj.name.toLowerCase() : '';

    const matchesSearch =
      tool.name.toLowerCase().includes(q) ||
      tool.description.toLowerCase().includes(q) ||
      tool.category.toLowerCase().includes(q) ||
      catName.includes(q) ||
      (tool.keywords && tool.keywords.some((k) => k.toLowerCase().includes(q)));

    return matchesCategory && matchesSearch;
  });

  const isFiltered = selectedCategory !== 'all' || searchQuery.trim().length > 0;
  const resultCountText = isFiltered
    ? `Showing ${filteredTools.length} of ${tools.length} tools`
    : `Showing ${filteredTools.length} tools`;

  const directorySchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Explore Tools Directory',
    description:
      'Browse calculators, converters, text tools, date and time utilities, education tools, and developer tools in one place.',
    url: `${getSiteUrl()}/tools`,
  };

  return (
    <div className="space-y-8 sm:space-y-10">
      <SEOHelmet
        title="Explore Tools – All Calculators, Converters & Utilities"
        description="Browse calculators, converters, text tools, date and time utilities, education tools, and developer tools in one place."
        canonicalPath="/tools"
        schema={directorySchema}
      />

      {/* 1. Breadcrumb: Home → Explore Tools */}
      <Breadcrumbs items={[{ label: 'Explore Tools', path: '/tools' }]} />

      {/* 2. Header */}
      <header className="border-b border-[#EDE9FE] pb-5 space-y-2">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center border border-[#DDD6FE]">
            <Compass className="w-3.5 h-3.5" />
          </div>
          <h1 className="text-xl sm:text-2xl font-heading font-bold text-[#1E1035] tracking-tight">
            Explore Tools Directory
          </h1>
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-heading font-semibold bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]">
            {tools.length} Tools Available
          </span>
        </div>
        <p className="text-xs sm:text-sm font-sans text-[#6D6582] max-w-3xl leading-relaxed">
          Explore our complete directory of online calculators, developer converters, text formatters, and everyday utilities with instant results and verified mathematical accuracy.
        </p>
      </header>

      {/* 3. Search & 4. Category Filters Section */}
      <section aria-label="Tool search and filters" className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-4 sm:p-5 shadow-[0_2px_12px_rgba(124,58,237,0.03)] space-y-4">
        {/* Prominent Search Field */}
        <div>
          <label
            htmlFor={searchInputId}
            className="block text-xs font-heading font-semibold uppercase tracking-wider text-[#1E1035] mb-1.5"
          >
            Find a tool
          </label>
          <div className="relative w-full max-w-2xl">
            <Search
              className="w-5 h-5 text-[#7C3AED] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id={searchInputId}
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search calculators, converters, text tools..."
              className="w-full bg-[#FFFFFF] border border-[#DDD6FE] rounded-xl pl-11 pr-10 py-2.5 text-sm sm:text-base text-[#1E1035] placeholder-[#9D95B3] shadow-xs focus:outline-hidden focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 transition-all font-sans"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search query"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[#9D95B3] hover:text-[#1E1035] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Controls */}
        <div className="space-y-2 pt-1 border-t border-[#EDE9FE]">
          {/* Mobile Select Control */}
          <div className="sm:hidden pt-2">
            <label
              htmlFor={categorySelectId}
              className="sr-only"
            >
              Filter by category
            </label>
            <select
              id={categorySelectId}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-[#FFFFFF] border border-[#EDE9FE] rounded-xl px-3 py-2 text-sm text-[#1E1035] font-sans font-medium focus:outline-hidden focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
            >
              <option value="all">All Tools ({tools.length})</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({tools.filter((t) => t.category === cat.id || t.category === cat.slug).length})
                </option>
              ))}
            </select>
          </div>

          {/* Desktop & Mobile Horizontally Scrollable Pills */}
          <div
            role="toolbar"
            aria-label="Category filters"
            className="flex items-center gap-2 overflow-x-auto pt-2 pb-1 text-xs font-heading font-medium no-scrollbar"
          >
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5 ${
                selectedCategory === 'all'
                  ? 'bg-[#7C3AED] text-white border-[#7C3AED] font-semibold shadow-xs'
                  : 'bg-white text-[#6D6582] border-[#EDE9FE] hover:bg-[#F5F3FF] hover:text-[#1E1035]'
              }`}
            >
              <span>All Tools</span>
              <span
                className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                  selectedCategory === 'all'
                    ? 'bg-white/20 text-white'
                    : 'bg-[#EDE9FE] text-[#7C3AED]'
                }`}
              >
                {tools.length}
              </span>
            </button>
            {categories.map((cat) => {
              const isActive = selectedCategory === cat.id;
              const catToolsCount = tools.filter((t) => t.category === cat.id || t.category === cat.slug).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl border transition-all cursor-pointer whitespace-nowrap inline-flex items-center gap-1.5 ${
                    isActive
                      ? 'bg-[#7C3AED] text-white border-[#7C3AED] font-semibold shadow-xs'
                      : 'bg-white text-[#6D6582] border-[#EDE9FE] hover:bg-[#F5F3FF] hover:text-[#1E1035]'
                  }`}
                >
                  <span>{cat.name}</span>
                  <span
                    className={`text-[11px] px-1.5 py-0.2 rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : 'bg-[#EDE9FE] text-[#7C3AED]'
                    }`}
                  >
                    {catToolsCount}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Counter & Active Filter Indicators */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#EDE9FE] text-xs font-sans text-[#6D6582]">
          <span className="font-medium text-[#1E1035]">{resultCountText}</span>
          {isFiltered && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="inline-flex items-center gap-1 text-[#7C3AED] hover:text-[#6D28D9] font-heading font-semibold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset filters</span>
            </button>
          )}
        </div>
      </section>

      {/* AD SLOT */}
      <AdSlot id="tools-directory-ad" type="top-leaderboard" />

      {/* 5. Tool Cards Grid with Featured Spotlight Card */}
      {filteredTools.length > 0 ? (
        <section aria-label="Tools List" className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {/* Featured Spotlight Card matching the homepage Explore All Categories styling */}
            <div className="group relative bg-gradient-to-br from-[#3B0764] via-[#5B21B6] to-[#7C3AED] text-white rounded-2xl p-4 sm:p-5 flex flex-col justify-between shadow-[0_4px_16px_rgba(124,58,237,0.14)] hover:shadow-[0_12px_32px_rgba(124,58,237,0.22)] hover:-translate-y-0.5 transition-all duration-200 border border-purple-300/25 h-full">
              <div>
                <div className="flex items-center justify-between gap-2 mb-2.5">
                  <div className="w-8.5 h-8.5 rounded-xl bg-white/15 backdrop-blur-xs flex items-center justify-center border border-white/20 shrink-0">
                    <Wrench className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-[10px] font-heading font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-white/20 text-white border border-white/25 shadow-2xs">
                    {tools.length} Tools Live
                  </span>
                </div>

                <h3 className="font-heading font-bold text-base sm:text-lg text-white leading-snug mb-1">
                  Most Used Everyday Tools
                </h3>
                <p className="font-sans text-purple-100/90 text-xs sm:text-[13px] line-clamp-2 leading-relaxed mb-3">
                  Directly runnable in-browser calculators, converters, and utilities with real-time results and zero setup.
                </p>
              </div>

              {/* Footer Row */}
              <div className="pt-2.5 mt-auto border-t border-white/15 flex items-center justify-between text-xs">
                <span className="text-[11px] text-purple-200 font-medium flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-purple-200" />
                  <span>Instant Compute</span>
                </span>

                <a
                  href="#categories-directory-block"
                  className="inline-flex items-center gap-1 font-heading font-semibold text-xs text-[#4C1D95] bg-white hover:bg-purple-50 px-3 py-1 rounded-lg transition-all shadow-2xs"
                >
                  <span>Categories</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            {/* Rendered Tool Cards */}
            {filteredTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>
      ) : (
        /* Empty State */
        <div className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-heading font-bold text-[#1E1035]">
            No matching tools found
          </h3>
          <p className="text-xs sm:text-sm font-sans text-[#6D6582] max-w-md mx-auto">
            We couldn&apos;t find any tools matching your criteria. Try adjusting your search query or selecting a different category.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="px-4 py-2 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl text-xs font-heading font-semibold transition-colors cursor-pointer"
            >
              Clear all filters
            </button>
          </div>
        </div>
      )}

      {/* 6. BROWSE BY CATEGORY SECTION */}
      <section
        id="categories-directory-block"
        aria-labelledby="tools-categories-heading"
        className="rounded-3xl p-5 sm:p-7 bg-white border border-[#EDE9FE] shadow-[0_2px_14px_rgba(124,58,237,0.03)] space-y-5"
      >
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3 border-b border-[#EDE9FE]">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-heading font-semibold text-[#7C3AED] bg-[#F5F3FF] border border-[#DDD6FE] mb-2 shadow-2xs">
              <LayoutGrid className="w-3.5 h-3.5 text-[#7C3AED]" />
              <span>Directory Categories</span>
            </div>
            <h2 id="tools-categories-heading" className="font-heading font-bold text-xl sm:text-2xl text-[#1E1035] tracking-tight">
              Browse Tools by Category
            </h2>
            <p className="font-sans text-xs sm:text-sm text-[#6D6582] mt-0.5 max-w-2xl">
              Explore specialized modules across mathematics, developer workflows, text manipulation, and unit conversions.
            </p>
          </div>
          <span className="text-xs font-heading font-bold px-3 py-1 rounded-full bg-[#F5F3FF] border border-[#DDD6FE] text-[#7C3AED] shrink-0 shadow-2xs">
            {categories.length} Categories Available
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {categories.map((cat) => (
            <CategoryCard key={cat.id} category={cat} />
          ))}
        </div>
      </section>

      {/* 7. WHY CHOOSE OUR ONLINE TOOLS */}
      <section
        aria-labelledby="tools-benefits-heading"
        className="rounded-3xl p-5 sm:p-8 bg-[#FAF9FE] border border-[#EDE9FE] space-y-6"
      >
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-heading font-semibold text-[#7C3AED] bg-[#F5F3FF] border border-[#DDD6FE] shadow-2xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#7C3AED]" />
            <span>Built for Speed &amp; Precision</span>
          </div>
          <h2 id="tools-benefits-heading" className="text-xl sm:text-2xl font-heading font-bold text-[#1E1035] tracking-tight">
            Why Professionals &amp; Students Rely on OnlineTools
          </h2>
          <p className="text-xs sm:text-sm font-sans text-[#6D6582]">
            Modern web utilities engineered for instant calculation without bloat, popups, or tracking.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <div className="bg-white border border-[#EDE9FE] rounded-2xl p-5 space-y-2.5 shadow-2xs hover:border-[#DDD6FE] transition-colors">
            <div className="w-9 h-9 rounded-xl bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] flex items-center justify-center">
              <Zap className="w-4.5 h-4.5" />
            </div>
            <h3 className="font-heading font-bold text-sm text-[#1E1035]">0ms Network Latency</h3>
            <p className="text-xs text-[#6D6582] leading-relaxed">
              Every tool executes in your local browser sandbox with immediate responses on every keystroke.
            </p>
          </div>

          <div className="bg-white border border-[#EDE9FE] rounded-2xl p-5 space-y-2.5 shadow-2xs hover:border-[#DDD6FE] transition-colors">
            <div className="w-9 h-9 rounded-xl bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0] flex items-center justify-center">
              <Shield className="w-4.5 h-4.5" />
            </div>
            <h3 className="font-heading font-bold text-sm text-[#1E1035]">100% Private Computing</h3>
            <p className="text-xs text-[#6D6582] leading-relaxed">
              Zero server logging. Financial numbers, formulas, and text inputs never leave your device.
            </p>
          </div>

          <div className="bg-white border border-[#EDE9FE] rounded-2xl p-5 space-y-2.5 shadow-2xs hover:border-[#DDD6FE] transition-colors">
            <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] text-[#2563EB] border border-[#BFDBFE] flex items-center justify-center">
              <Smartphone className="w-4.5 h-4.5" />
            </div>
            <h3 className="font-heading font-bold text-sm text-[#1E1035]">Every Screen Ready</h3>
            <p className="text-xs text-[#6D6582] leading-relaxed">
              Touch-friendly inputs and responsive layouts designed for mobile, tablet, and desktop monitors.
            </p>
          </div>

          <div className="bg-white border border-[#EDE9FE] rounded-2xl p-5 space-y-2.5 shadow-2xs hover:border-[#DDD6FE] transition-colors">
            <div className="w-9 h-9 rounded-xl bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] flex items-center justify-center">
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
            <h3 className="font-heading font-bold text-sm text-[#1E1035]">Verified Precision</h3>
            <p className="text-xs text-[#6D6582] leading-relaxed">
              Standardized formulas and verified mathematical libraries ensure dependable calculations every time.
            </p>
          </div>
        </div>
      </section>

      {/* 8. COMPREHENSIVE FAQS */}
      <FAQAccordion
        items={TOOLS_DIRECTORY_FAQS}
        title="Frequently Asked Questions About Our Tools"
        description="Find clear answers about browser computing, formula reliability, data privacy, and requesting new tools."
      />

      {/* 9. BOTTOM ACTION BANNER */}
      <section className="bg-gradient-to-r from-[#1E1035] via-[#2A1647] to-[#1E1035] text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-lg">
        <div className="space-y-1.5 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full text-[11px] font-heading font-semibold text-[#DDD6FE] bg-white/10 border border-white/15">
            <Sparkles className="w-3.5 h-3.5 text-[#DDD6FE]" />
            <span>Community Driven Platform</span>
          </div>
          <h2 className="text-lg sm:text-xl font-heading font-bold text-white">
            Need a Calculation Utility We Haven&apos;t Built Yet?
          </h2>
          <p className="text-xs sm:text-sm text-purple-200/90 max-w-xl">
            Tell us about your formula or conversion workflow. Our engineering team reviews all submissions and builds tools for free.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <Link
            href="/request-a-tool"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl text-xs font-heading font-semibold transition-all shadow-md cursor-pointer"
          >
            <span>Request a Tool</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href="/guides"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-heading font-semibold border border-white/20 transition-all cursor-pointer"
          >
            <BookOpen className="w-3.5 h-3.5 text-purple-200" />
            <span>Read Calculation Guides</span>
          </Link>
        </div>
      </section>
    </div>
  );
}
