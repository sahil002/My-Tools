import { useState, useId } from 'react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { GuideCard } from '../components/GuideCard';
import { SEOHelmet } from '../components/SEOHelmet';
import { GUIDES } from '../data/guides';
import { CATEGORIES } from '../data/categories';
import { getSiteUrl } from '../data/siteConfig';
import { AdSlot } from '../components/AdSlotPlaceholder';
import { Search, X, BookOpen } from 'lucide-react';

export function GuidesDirectoryView() {
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

  // Dynamic filter against the central guides registry
  const filteredGuides = GUIDES.filter((guide) => {
    const matchesCategory =
      selectedCategory === 'all' || guide.category === selectedCategory;

    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesCategory;

    const matchesSearch =
      guide.title.toLowerCase().includes(q) ||
      guide.description.toLowerCase().includes(q) ||
      guide.category.toLowerCase().includes(q) ||
      (guide.relatedTools &&
        guide.relatedTools.some((toolId) => toolId.toLowerCase().includes(q)));

    return matchesCategory && matchesSearch;
  });

  const isFiltered = selectedCategory !== 'all' || searchQuery.trim().length > 0;
  const resultCountText = isFiltered
    ? `Showing ${filteredGuides.length} of ${GUIDES.length} guides`
    : `Showing ${filteredGuides.length} guides`;

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Guides – Step-by-Step Formulas & Practical Explanations',
    description:
      'Learn how to calculate, convert, and use everyday online tools with clear explanations, examples, and step-by-step instructions.',
    url: `${getSiteUrl()}/guides`,
  };

  return (
    <div className="space-y-6">
      <SEOHelmet
        title="Guides – Step-by-Step Formulas & Practical Explanations"
        description="Learn how to calculate, convert, and use everyday online tools with clear explanations, examples, and step-by-step instructions."
        canonicalPath="/guides"
        breadcrumbs={[{ label: 'Guides', path: '/guides' }]}
        schema={schema}
      />

      {/* 1. Breadcrumb: Home → Guides */}
      <Breadcrumbs items={[{ label: 'Guides', path: '/guides' }]} />

      {/* 2. Compact Header */}
      <header className="border-b border-[#EDE9FE] pb-5 space-y-1.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center border border-[#DDD6FE]">
            <BookOpen className="w-3.5 h-3.5" />
          </div>
          <h1 className="text-xl sm:text-2xl font-heading font-bold text-[#1E1035] tracking-tight">
            Guides &amp; Tutorials
          </h1>
        </div>
        <p className="text-xs sm:text-sm font-sans text-[#6D6582] max-w-3xl leading-relaxed">
          Learn how to calculate, convert, and use everyday online utilities with clear mathematical explanations, working formulas, and step-by-step instructions.
        </p>
      </header>

      {/* 3. Search & 4. Category Filters Section */}
      <section aria-label="Search and filter guides" className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-4 sm:p-5 shadow-[0_2px_12px_rgba(124,58,237,0.03)] space-y-4">
        {/* Prominent Search Field */}
        <div>
          <label
            htmlFor={searchInputId}
            className="block text-xs font-heading font-semibold uppercase tracking-wider text-[#1E1035] mb-1.5"
          >
            Find a Guide
          </label>
          <div className="relative w-full max-w-xl">
            <Search
              className="w-4 h-4 text-[#7C3AED] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id={searchInputId}
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guides..."
              className="w-full bg-[#FFFFFF] border border-[#DDD6FE] rounded-xl pl-10 pr-9 py-2.5 text-sm text-[#1E1035] placeholder-[#9D95B3] focus:outline-hidden focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 transition-all font-sans"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search query"
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 text-[#9D95B3] hover:text-[#1E1035] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Category Filters Toolbar */}
        <div className="space-y-2 pt-1 border-t border-[#EDE9FE]">
          {/* Mobile Select Control */}
          <div className="sm:hidden pt-2">
            <label htmlFor={categorySelectId} className="sr-only">
              Filter by category
            </label>
            <select
              id={categorySelectId}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full bg-[#FFFFFF] border border-[#EDE9FE] rounded-xl px-3 py-2 text-sm text-[#1E1035] font-sans font-medium focus:outline-hidden focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
            >
              <option value="all">All Guides ({GUIDES.length})</option>
              {CATEGORIES.map((cat) => {
                const count = GUIDES.filter((g) => g.category === cat.id).length;
                return (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({count})
                  </option>
                );
              })}
            </select>
          </div>

          {/* Desktop & Tablet Horizontally Scrollable Pills with Dynamic Counts */}
          <div
            role="toolbar"
            aria-label="Filter guides by category"
            className="flex items-center gap-1.5 overflow-x-auto pt-2 pb-1 text-xs font-heading font-medium no-scrollbar"
          >
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 rounded-xl border transition-colors cursor-pointer whitespace-nowrap ${
                selectedCategory === 'all'
                  ? 'bg-[#7C3AED] text-white border-[#7C3AED] font-semibold shadow-xs'
                  : 'bg-[#FAF9FE] text-[#6D6582] border-[#EDE9FE] hover:text-[#1E1035] hover:bg-[#F5F3FF]'
              }`}
            >
              All Guides ({GUIDES.length})
            </button>
            {CATEGORIES.map((cat) => {
              const count = GUIDES.filter((g) => g.category === cat.id).length;
              const isActive = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-1.5 rounded-xl border transition-colors cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-[#7C3AED] text-white border-[#7C3AED] font-semibold shadow-xs'
                      : 'bg-[#FAF9FE] text-[#6D6582] border-[#EDE9FE] hover:text-[#1E1035] hover:bg-[#F5F3FF]'
                  }`}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Result Count */}
        <div className="flex items-center justify-between pt-2 border-t border-[#EDE9FE]">
          <p className="text-xs sm:text-sm font-sans font-medium text-[#6D6582]">
            {resultCountText}
          </p>
          {isFiltered && (
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
              }}
              className="text-xs text-[#7C3AED] hover:text-[#6D28D9] hover:underline font-heading font-semibold cursor-pointer"
            >
              Reset filters
            </button>
          )}
        </div>
      </section>

      {/* Blog Listing Ad Slot (Below Hero) */}
      <AdSlot
        id="guides-directory-ad"
        type="top-leaderboard"
      />

      {/* 5. Guides Card Grid */}
      {filteredGuides.length > 0 ? (
        <section aria-label="Available Guides">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredGuides.map((guide) => (
              <GuideCard key={guide.slug} guide={guide} />
            ))}
          </div>
        </section>
      ) : (
        /* Empty State */
        <div className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-8 sm:p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-heading font-bold text-[#1E1035]">
            No guides match your search
          </h2>
          <p className="text-xs sm:text-sm font-sans text-[#6D6582] max-w-sm mx-auto">
            Try adjusting your search terms or selecting a different category filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setSelectedCategory('all');
              setSearchQuery('');
            }}
            className="mt-2 inline-flex items-center px-4 py-2 rounded-xl text-xs font-heading font-semibold bg-[#7C3AED] text-white hover:bg-[#6D28D9] transition-colors cursor-pointer"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}
