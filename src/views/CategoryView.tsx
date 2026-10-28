import { useState, useId, useEffect } from 'react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { ToolCard } from '../components/ToolCard';
import { GuideCard } from '../components/GuideCard';
import { FAQAccordion } from '../components/FAQAccordion';
import { SEOHelmet } from '../components/SEOHelmet';
import { AdSlot } from '../components/AdSlotPlaceholder';
import { Link } from '../context/RouterContext';
import { useCategories } from '../data/categories';
import { useMergedTools } from '../services/toolRegistryService';
import { getAllMergedGuidesSync, syncGuidesFromSupabase, GUIDES_UPDATED_EVENT } from '../services/guideStorageDB';
import { getSiteUrl } from '../data/siteConfig';
import { DynamicIcon } from '../components/DynamicIcon';
import { getCategoryTheme } from '../utils/categoryColors';
import { Search, ChevronRight, X, Wrench } from 'lucide-react';

interface CategoryViewProps {
  categorySlug: string;
}

export function CategoryView({ categorySlug }: CategoryViewProps) {
  const searchInputId = useId();
  const categories = useCategories();
  const { tools } = useMergedTools();
  const [availableGuides, setAvailableGuides] = useState(() => getAllMergedGuidesSync());
  useEffect(() => {
    let active = true;
    const refreshGuides = () => setAvailableGuides(getAllMergedGuidesSync());
    window.addEventListener(GUIDES_UPDATED_EVENT, refreshGuides);
    void syncGuidesFromSupabase().then(() => {
      if (active) refreshGuides();
    });
    return () => {
      active = false;
      window.removeEventListener(GUIDES_UPDATED_EVENT, refreshGuides);
    };
  }, []);
  const category = categories.find((c) => c.slug === categorySlug || c.id === categorySlug);
  const [filterQuery, setFilterQuery] = useState('');

  if (!category) {
    return (
      <div className="py-16 text-center">
        <SEOHelmet
          title="Category Not Found | PRBSolver"
          description="The requested category could not be found. Browse available PRBSolver tools."
          canonicalPath={typeof window !== 'undefined' ? window.location.pathname.replace(/\/+$/, '') || '/' : '/categories'}
          noindex={true}
        />
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
  const parentCategory = category.parentCategoryId ? categories.find((item) => item.id === category.parentCategoryId) : undefined;
  const subcategories = categories.filter((item) => item.parentCategoryId === category.id);

  // Normalize labels so tools saved with category names, IDs, or slugs
  // all appear in the correct category (including Finance & Business).
  const normalizeSearchText = (value: unknown) =>
    String(value ?? '')
      .normalize('NFKD')
      .replace(/[\\u0300-\\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();

  const categoryKeys = new Set(
    [category.id, category.slug, category.name]
      .map(normalizeSearchText)
      .filter(Boolean)
  );

  // Tools in this category from the merged built-in + Supabase registry.
  const allCategoryTools = tools.filter((tool) => {
    const savedCategory = normalizeSearchText(tool.category);
    return categoryKeys.has(savedCategory) ||
      categoryKeys.has(normalizeSearchText(savedCategory.replace(/ /g, '-'))) ||
      [...categoryKeys].some((key) => key.replace(/ /g, '-') === String(tool.category ?? '').toLowerCase().trim());
  });

  // Search across tool names, descriptions, slugs, categories, and keywords.
  const q = normalizeSearchText(filterQuery);
  const filteredTools = allCategoryTools.filter((tool) => {
    if (!q) return true;
    const searchableText = [
      tool.name,
      tool.description,
      tool.slug,
      tool.id,
      tool.category,
      ...(tool.keywords || []),
    ].map(normalizeSearchText).join(' ');
    return searchableText.includes(q);
  });

  // Relevant guides from central registry (matching category or linked to tools in this category)
  const categoryToolIds = new Set(allCategoryTools.flatMap((tool) => [tool.id, tool.slug]));
  const relevantGuides = availableGuides.filter((guide) =>
    categoryKeys.has(normalizeSearchText(guide.category)) ||
    guide.relatedTools?.some((toolId) => categoryToolIds.has(toolId))
  );

  // Other categories for exploration (excluding current category)
  const otherCategories = categories.filter((c) => c.id !== category.id && c.parentCategoryId === (parentCategory?.id ?? undefined));

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
    ...(parentCategory ? [{ label: parentCategory.name, path: `/${parentCategory.slug}` }] : []),
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
            <div className="flex flex-nowrap items-center gap-2 min-w-0">
              <h1 className="whitespace-nowrap text-lg sm:text-2xl font-heading font-extrabold text-[#1E1035] tracking-tight shrink-0">
                {category.name}
              </h1>
              <span className="shrink-0 whitespace-nowrap px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-heading font-semibold bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] leading-tight">
                {allCategoryTools.length} {allCategoryTools.length === 1 ? 'tool' : 'tools'}
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
              className="w-full bg-[#FAF9FE] border border-[#EDE9FE] rounded-xl pl-8.5 pr-7 py-1.5 text-xs text-[#1E1035] placeholder-[#9D95B3] focus:bg-[#FFFFFF] outline-none focus:outline-none focus:border-[#7C3AED] focus:ring-1 focus:ring-[#7C3AED] font-sans"
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

      {/* Child categories appear as a clear subject directory under each main category. */}
      {subcategories.length > 0 && (
        <section aria-labelledby="subcategory-heading" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
            <div>
              <p className="text-xs font-heading font-bold uppercase tracking-wider text-[#7C3AED]">Explore by subject</p>
              <h2 id="subcategory-heading" className="text-lg sm:text-xl font-heading font-bold text-[#1E1035] mt-1">
                {category.name} Subjects
              </h2>
              <p className="text-xs sm:text-sm text-[#6D6582] mt-1">Choose a subject to browse its dedicated tools and resources.</p>
            </div>
            <span className="text-xs text-[#6D6582]">{subcategories.length} subjects</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {subcategories.map((sub) => {
              const count = tools.filter((tool) => {
                const saved = normalizeSearchText(tool.category);
                return saved === normalizeSearchText(sub.slug) || saved === normalizeSearchText(sub.id) || saved === normalizeSearchText(sub.name);
              }).length;
              return (
                <Link key={sub.id} href={`/${sub.slug}`}
                  className="group flex items-start gap-3 rounded-2xl border border-[#EDE9FE] bg-white p-4 hover:border-[#C4B5FD] hover:bg-[#FCFAFF] transition-all">
                  <span className="w-10 h-10 shrink-0 rounded-xl border border-[#DDD6FE] bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center group-hover:bg-[#7C3AED] group-hover:text-white transition-colors">
                    <DynamicIcon name={sub.iconName || 'Grid2X2'} className="w-5 h-5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center justify-between gap-2">
                      <span className="font-heading text-sm font-bold text-[#1E1035] group-hover:text-[#7C3AED]">{sub.name}</span>
                      <span className="text-[10px] rounded-full border border-[#DDD6FE] bg-[#F5F3FF] text-[#7C3AED] px-2 py-0.5 whitespace-nowrap">{count} {count === 1 ? 'tool' : 'tools'}</span>
                    </span>
                    <span className="block mt-1 text-xs text-[#6D6582] leading-relaxed">{sub.description || `Browse ${sub.name.toLowerCase()} tools and resources.`}</span>
                    <span className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-[#7C3AED]">Explore subject <span aria-hidden="true">→</span></span>
                  </span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* 4. Architecture-ready Ad Slot */}
      <AdSlot id="category-top-ad" type="top-leaderboard" />

      {/* 5. All Tools in Category */}
      <section aria-labelledby="category-tools-heading">
        <h2 id="category-tools-heading" className="text-lg sm:text-xl font-heading font-bold text-[#1E1035] mb-4">
          All {category.name}
        </h2>
        {allCategoryTools.length === 0 ? (
          <div className="p-10 text-center bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl text-sm text-[#6D6582] space-y-3 shadow-2xs">
            <div className="w-12 h-12 rounded-2xl bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] flex items-center justify-center mx-auto">
              <Wrench className="w-6 h-6" />
            </div>
            <h3 className="text-base font-heading font-bold text-[#1E1035]">
              No Tools in {category.name} Yet
            </h3>
            <p className="text-xs font-sans text-[#6D6582] max-w-sm mx-auto">
              You can upload ZIP tool packages or configure new utilities in the Admin Dashboard.
            </p>
            <div className="pt-1">
              <Link
                href="/admin/tools"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#7C3AED] text-white rounded-xl text-xs font-heading font-semibold hover:bg-[#6D28D9] transition-all shadow-xs"
              >
                <Wrench className="w-3.5 h-3.5" />
                <span>Upload Tool in Admin</span>
              </Link>
            </div>
          </div>
        ) : filteredTools.length > 0 ? (
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
