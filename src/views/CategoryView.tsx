import { useState, useId } from 'react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { ToolCard } from '../components/ToolCard';
import { GuideCard } from '../components/GuideCard';
import { FAQAccordion } from '../components/FAQAccordion';
import { SEOHelmet } from '../components/SEOHelmet';
import { AdSlot } from '../components/AdSlotPlaceholder';
import { Link } from '../context/RouterContext';
import { getCategoryBySlug, CATEGORIES } from '../data/categories';
import { getToolsByCategory } from '../data/tools';
import { GUIDES } from '../data/guides';
import { getSiteUrl } from '../data/siteConfig';
import { DynamicIcon } from '../components/DynamicIcon';
import { getCategoryTheme } from '../utils/categoryColors';
import { Search, ChevronRight, X } from 'lucide-react';

interface CategoryViewProps {
  categorySlug: string;
}

export function CategoryView({ categorySlug }: CategoryViewProps) {
  const searchInputId = useId();
  const category = getCategoryBySlug(categorySlug);
  const [filterQuery, setFilterQuery] = useState('');

  if (!category) {
    return (
      <div className="py-16 text-center">
        <h1 className="text-2xl font-heading font-bold text-[#1E1035]">Category Not Found</h1>
        <p className="mt-2 text-sm font-sans text-[#6D6582]">
          The requested category could not be found.
        </p>
        <Link
          href="/tools"
          className="mt-4 inline-block px-4 py-2 bg-[#7C3AED] text-white rounded-xl text-sm font-heading font-semibold hover:bg-[#6D28D9] transition-colors shadow-2xs"
        >
          Return to Tools
        </Link>
      </div>
    );
  }

  const theme = getCategoryTheme(category.id);

  // Tools in this category from central registry
  const allCategoryTools = getToolsByCategory(category.id);

  // Filter tools by search query
  const q = filterQuery.toLowerCase().trim();
  const filteredTools = allCategoryTools.filter((t) => {
    if (!q) return true;
    return (
      t.name.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      (t.keywords && t.keywords.some((k) => k.toLowerCase().includes(q)))
    );
  });

  // Relevant guides from central registry (matching category or linked to tools in this category)
  const categoryToolIds = allCategoryTools.map((t) => t.id);
  const relevantGuides = GUIDES.filter(
    (g) =>
      g.category === category.id ||
      g.relatedTools?.some((rtId) => categoryToolIds.includes(rtId))
  );

  // Other categories for exploration (excluding current category)
  const otherCategories = CATEGORIES.filter((c) => c.id !== category.id);

  // Dynamic count text
  const isFiltered = q.length > 0;
  const countText = isFiltered
    ? `Showing ${filteredTools.length} of ${allCategoryTools.length} ${category.name.toLowerCase()}`
    : `Showing ${filteredTools.length} ${category.name.toLowerCase()}`;

  // Structured Data Schema for Category Page
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: category.seoTitle,
    description: category.seoDescription,
    url: `${getSiteUrl()}/${category.slug}`,
  };

  const breadcrumbItems = [
    { label: 'Explore Tools', path: '/tools' },
    { label: category.name, path: `/${category.slug}` },
  ];

  return (
    <div className="space-y-6 sm:space-y-7">
      <SEOHelmet
        title={category.seoTitle}
        description={category.seoDescription}
        canonicalPath={`/${category.slug}`}
        breadcrumbs={breadcrumbItems}
        schema={schema}
      />

      {/* 1. Breadcrumb: Home → Tools → Category Name */}
      <Breadcrumbs items={breadcrumbItems} />

      {/* 2. Category Header with Dynamic Count & 3. Optional Search */}
      <header className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-5 sm:p-6 shadow-[0_2px_12px_rgba(124,58,237,0.03)]">
        <div className="flex items-start gap-3.5">
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-[#DDD6FE] shadow-2xs ${theme.iconClass}`}>
            <DynamicIcon name={category.iconName} className="w-5.5 h-5.5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-heading font-extrabold text-[#1E1035] tracking-tight">
                {category.name}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-heading font-semibold bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]">
                {allCategoryTools.length} tools
              </span>
            </div>
            <p className="mt-1.5 text-xs sm:text-sm font-sans text-[#6D6582] leading-relaxed max-w-3xl">
              {category.description}
            </p>
          </div>
        </div>

        {/* Dynamic Count and Category Search */}
        <div className="mt-5 pt-4 border-t border-[#EDE9FE] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs sm:text-sm font-sans text-[#6D6582] font-medium">
            {countText}
          </p>
          <div className="relative w-full sm:w-60">
            <label htmlFor={searchInputId} className="sr-only">
              Search {category.name.toLowerCase()}
            </label>
            <Search
              className="w-3.5 h-3.5 text-[#7C3AED] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              id={searchInputId}
              type="search"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder={`Search ${category.name.toLowerCase()}...`}
              className="w-full bg-[#FAF9FE] border border-[#EDE9FE] rounded-xl pl-8.5 pr-7 py-1.5 text-xs text-[#1E1035] placeholder-[#9D95B3] focus:bg-[#FFFFFF] focus:outline-hidden focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] font-sans"
            />
            {filterQuery && (
              <button
                type="button"
                onClick={() => setFilterQuery('')}
                aria-label="Clear filter"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-[#9D95B3] hover:text-[#1E1035] transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 4. Architecture-ready Ad Slot */}
      <AdSlot id="category-top-ad" type="top-leaderboard" />

      {/* 5. All Tools in Category */}
      <section aria-labelledby="category-tools-heading">
        <h2 id="category-tools-heading" className="text-lg sm:text-xl font-heading font-bold text-[#1E1035] mb-4">
          All {category.name}
        </h2>
        {filteredTools.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {filteredTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl text-sm text-[#6D6582] space-y-3 shadow-2xs">
            <p className="text-base font-heading font-semibold text-[#1E1035]">
              No tools found matching &ldquo;{filterQuery}&rdquo;.
            </p>
            <p className="text-xs font-sans text-[#6D6582]">
              Try clearing the search field or check our other categories.
            </p>
            <button
              type="button"
              onClick={() => setFilterQuery('')}
              className="inline-flex items-center px-4 py-2 bg-[#7C3AED] text-white rounded-xl text-xs font-heading font-semibold hover:bg-[#6D28D9] transition-colors cursor-pointer shadow-2xs"
            >
              Clear Search
            </button>
          </div>
        )}
      </section>

      {/* 6. Helpful Guides */}
      {relevantGuides.length > 0 && (
        <section aria-labelledby="related-guides-heading" className="pt-2">
          <div className="mb-4">
            <h2 id="related-guides-heading" className="text-lg sm:text-xl font-heading font-bold text-[#1E1035]">
              Helpful Guides &amp; Tutorials
            </h2>
            <p className="text-xs sm:text-sm font-sans text-[#6D6582] mt-1">
              Step-by-step guides, formulas, and practical examples for {category.name.toLowerCase()}.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {relevantGuides.map((guide) => (
              <GuideCard key={guide.slug} guide={guide} />
            ))}
          </div>
        </section>
      )}

      {/* 7. Category-Specific FAQ */}
      {category.faq && category.faq.length > 0 && (
        <FAQAccordion
          items={category.faq}
          title={`${category.name} FAQ`}
          description={`Common answers regarding accuracy, calculation logic, and privacy for our ${category.name.toLowerCase()}.`}
        />
      )}

      {/* Architecture-ready Ad Slot at bottom */}
      <AdSlot id="category-bottom-ad" type="bottom-leaderboard" />

      {/* 8. Explore Other Categories */}
      <section aria-labelledby="other-categories-heading" className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-6 shadow-[0_2px_12px_rgba(124,58,237,0.03)]">
        <h2 id="other-categories-heading" className="text-base font-heading font-bold text-[#1E1035] mb-3">
          Explore Other Categories
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {otherCategories.map((cat) => (
            <Link
              key={cat.id}
              href={`/${cat.slug}`}
              className="p-3 bg-[#FAF9FE] border border-[#EDE9FE] rounded-xl hover:border-[#7C3AED] hover:bg-white transition-colors group text-left"
            >
              <div className="text-xs font-heading font-semibold text-[#1E1035] group-hover:text-[#7C3AED] transition-colors flex items-center justify-between">
                <span>{cat.name}</span>
                <ChevronRight className="w-3.5 h-3.5 text-[#9D95B3] group-hover:text-[#7C3AED] transition-colors" />
              </div>
              <div className="text-[11px] font-sans text-[#6D6582] mt-0.5">
                {cat.toolCount} {cat.toolCount === 1 ? 'tool' : 'tools'}
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
