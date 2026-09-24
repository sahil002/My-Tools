import { useState, useId } from 'react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { ToolCard } from '../components/ToolCard';
import { SEOHelmet } from '../components/SEOHelmet';
import { AdSlot } from '../components/AdSlotPlaceholder';
import { TOOLS } from '../data/tools';
import { CATEGORIES } from '../data/categories';
import { getSiteUrl } from '../data/siteConfig';
import { Search, X, RotateCcw, Compass } from 'lucide-react';

export function ToolsDirectoryView() {
  const searchInputId = useId();
  const categorySelectId = useId();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('q') || '';
    }
    return '';
  });

  // Filter tools by category, name, description, category name, and keywords
  const filteredTools = TOOLS.filter((tool) => {
    const matchesCategory =
      selectedCategory === 'all' || tool.category === selectedCategory;

    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesCategory;

    const catObj = CATEGORIES.find((c) => c.id === tool.category);
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
    ? `Showing ${filteredTools.length} of ${TOOLS.length} tools`
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
    <div className="space-y-6 sm:space-y-7">
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
            Explore Tools
          </h1>
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-heading font-semibold bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]">
            {TOOLS.length} Tools Available
          </span>
        </div>
        <p className="text-xs sm:text-sm font-sans text-[#6D6582] max-w-3xl leading-relaxed">
          Explore our complete directory of online calculators, developer converters, text formatters, and everyday utilities with instant results.
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
              <option value="all">All Tools ({TOOLS.length})</option>
              {CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name} ({cat.toolCount})
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
                {TOOLS.length}
              </span>
            </button>
            {CATEGORIES.map((cat) => {
              const isActive = selectedCategory === cat.id;
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
                    {cat.toolCount}
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

      {/* 5. Tool Cards Grid */}
      {filteredTools.length > 0 ? (
        <section aria-label="Tools List">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
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
    </div>
  );
}
