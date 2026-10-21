import { useMemo, useState } from 'react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { SEOHelmet } from '../components/SEOHelmet';
import { DynamicIcon } from '../components/DynamicIcon';
import { Link } from '../context/RouterContext';
import { useCategories } from '../data/categories';
import { useMergedTools } from '../services/toolRegistryService';
import { Search, Layers, ArrowRight } from 'lucide-react';
import { getSiteUrl } from '../data/siteConfig';

export function CategoriesDirectoryView() {
  const categories = useCategories();
  const { tools } = useMergedTools();
  const [query, setQuery] = useState('');
  const mainCategories = categories.filter((category) => !category.parentCategoryId);
  const normalizedQuery = query.trim().toLowerCase();
  const visibleMainCategories = useMemo(() => mainCategories.filter((main) => {
    const children = categories.filter((category) => category.parentCategoryId === main.id);
    if (!normalizedQuery) return true;
    return [main.name, main.description, main.slug, ...children.flatMap((child) => [child.name, child.description, child.slug])]
      .some((value) => String(value || '').toLowerCase().includes(normalizedQuery));
  }), [mainCategories, categories, normalizedQuery]);

  const totalTools = tools.filter((tool) => tool.status !== 'inactive').length;
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'All Tool Categories | PRB Solver',
    description: 'Explore all PRB Solver categories and subject areas, from calculators and text tools to advanced math and science tools.',
    url: `${getSiteUrl().replace(/\/+$/, '')}/categories`,
  };

  return (
    <div className="space-y-7 sm:space-y-9">
      <SEOHelmet
        title="All Tool Categories – Browse Tools by Topic | PRB Solver"
        description="Explore PRB Solver categories and subject areas. Find calculators, converters, education tools, math solvers, statistics, physics, chemistry, and more."
        canonicalPath="/categories"
        breadcrumbs={[{ label: 'Home', path: '/' }, { label: 'All Categories', path: '/categories' }]}
        schema={schema}
      />
      <Breadcrumbs items={[{ label: 'Home', path: '/' }, { label: 'All Categories', path: '/categories' }]} />

      <section className="relative overflow-hidden rounded-3xl border border-[#EDE9FE] bg-white p-5 sm:p-8">
        <div className="absolute right-0 top-0 h-36 w-36 rounded-full bg-[#F5F3FF] blur-3xl pointer-events-none" />
        <div className="relative max-w-3xl">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#DDD6FE] bg-[#F5F3FF] px-3 py-1 text-xs font-semibold text-[#7C3AED]">
            <Layers className="h-3.5 w-3.5" /> Browse by topic
          </div>
          <h1 className="mt-3 text-2xl sm:text-3xl font-heading font-extrabold tracking-tight text-[#1E1035]">
            Find the right tool, faster.
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[#6D6582]">
            Explore our main categories and their subject areas. Choose a topic to discover its dedicated tools and resources.
          </p>
          <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3 max-w-xl">
            <div className="rounded-xl border border-[#EDE9FE] bg-[#FAF9FE] p-3">
              <span className="block text-xl font-heading font-extrabold text-[#1E1035]">{mainCategories.length}</span>
              <span className="text-[11px] sm:text-xs text-[#6D6582]">Main categories</span>
            </div>
            <div className="rounded-xl border border-[#EDE9FE] bg-[#FAF9FE] p-3">
              <span className="block text-xl font-heading font-extrabold text-[#1E1035]">{categories.length - mainCategories.length}</span>
              <span className="text-[11px] sm:text-xs text-[#6D6582]">Subject areas</span>
            </div>
            <div className="rounded-xl border border-[#EDE9FE] bg-[#FAF9FE] p-3">
              <span className="block text-xl font-heading font-extrabold text-[#1E1035]">{totalTools}</span>
              <span className="text-[11px] sm:text-xs text-[#6D6582]">Available tools</span>
            </div>
          </div>
          <label className="relative mt-5 block max-w-xl">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7C3AED]" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search categories or subjects..."
              aria-label="Search categories or subjects"
              className="w-full rounded-xl border border-[#DDD6FE] bg-white py-3 pl-10 pr-4 text-sm text-[#1E1035] outline-none transition focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/10"
            />
          </label>
        </div>
      </section>

      {visibleMainCategories.length === 0 ? (
        <section className="rounded-2xl border border-[#EDE9FE] bg-white p-10 text-center">
          <Search className="mx-auto h-8 w-8 text-[#9D95B3]" />
          <h2 className="mt-3 font-heading text-lg font-bold text-[#1E1035]">No matching categories</h2>
          <p className="mt-1 text-sm text-[#6D6582]">Try a different keyword or clear your search.</p>
          <button onClick={() => setQuery('')} className="mt-4 rounded-xl bg-[#7C3AED] px-4 py-2 text-sm font-semibold text-white hover:bg-[#6D28D9]">Clear search</button>
        </section>
      ) : (
        <div className="space-y-7">
          {visibleMainCategories.map((main) => {
            const children = categories.filter((category) => category.parentCategoryId === main.id)
              .filter((category) => !normalizedQuery || [category.name, category.description, category.slug, main.name].some((value) => String(value || '').toLowerCase().includes(normalizedQuery)));
            const isDirectMatch = !normalizedQuery || [main.name, main.description, main.slug].some((value) => String(value || '').toLowerCase().includes(normalizedQuery));
            if (normalizedQuery && !isDirectMatch && children.length === 0) return null;
            return (
              <section key={main.id} className="space-y-3.5">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#DDD6FE] bg-[#F5F3FF] text-[#7C3AED]">
                      <DynamicIcon name={main.iconName || 'Grid2X2'} className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="font-heading text-lg sm:text-xl font-bold text-[#1E1035]">{main.name}</h2>
                      <p className="text-xs sm:text-sm text-[#6D6582] line-clamp-2">{main.description}</p>
                    </div>
                  </div>
                  <Link href={`/${main.slug}`} className="inline-flex shrink-0 items-center gap-1 text-xs sm:text-sm font-semibold text-[#7C3AED] hover:text-[#6D28D9]">
                    View <ArrowRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {children.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 pl-0 sm:pl-4 sm:border-l-2 sm:border-[#EDE9FE]">
                    {children.map((child) => {
                      const count = tools.filter((tool) => [child.id, child.slug, child.name].some((value) => String(tool.category || '').toLowerCase() === String(value).toLowerCase())).length;
                      return (
                        <Link key={child.id} href={`/${child.slug}`} className="group flex items-start gap-3 rounded-2xl border border-[#EDE9FE] bg-white p-4 transition hover:border-[#C4B5FD] hover:bg-[#FCFAFF]">
                          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#DDD6FE] bg-[#F5F3FF] text-[#7C3AED] group-hover:bg-[#7C3AED] group-hover:text-white transition-colors">
                            <DynamicIcon name={child.iconName || 'Grid2X2'} className="h-5 w-5" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="flex items-center justify-between gap-2">
                              <span className="font-heading text-sm font-bold text-[#1E1035] group-hover:text-[#7C3AED]">{child.name}</span>
                              <span className="whitespace-nowrap rounded-full border border-[#DDD6FE] bg-[#F5F3FF] px-2 py-0.5 text-[10px] font-semibold text-[#7C3AED]">{count} {count === 1 ? 'tool' : 'tools'}</span>
                            </span>
                            <span className="mt-1 block text-xs leading-relaxed text-[#6D6582]">{child.description || `Browse ${child.name.toLowerCase()} tools.`}</span>
                            <span className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-[#7C3AED]">Explore subject <ArrowRight className="h-3 w-3" /></span>
                          </span>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      <section className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-[#EDE9FE] bg-[#FAF9FE] p-5">
        <div>
          <h2 className="font-heading font-bold text-[#1E1035]">Can’t find the tool you need?</h2>
          <p className="mt-1 text-xs sm:text-sm text-[#6D6582]">Suggest a tool and help us expand the directory.</p>
        </div>
        <Link href="/request-a-tool" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#6D28D9]">
          Request a tool <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </div>
  );
}
