import { CategoryInfo } from '../types';
import { Link } from '../context/RouterContext';
import { DynamicIcon } from './DynamicIcon';
import { ArrowRight, Layers } from 'lucide-react';
import { getCategoryTheme } from '../utils/categoryColors';
import { useMergedTools } from '../services/toolRegistryService';
import { useCategories } from '../data/categories';

interface CategoryCardProps {
  category: CategoryInfo;
}

export function CategoryCard({ category }: CategoryCardProps) {
  const categoryUrl = `/${category.slug}`;
  const { tools } = useMergedTools();
  const categories = useCategories();
  const subcategories = categories.filter((item) => item.parentCategoryId === category.id);
  const theme = getCategoryTheme(category.id || category.slug);

  // Dynamically calculate accurate tool count for this category from merged tools
  const matchingToolsCount = tools.filter((t) => {
    if (!t) return false;
    const toolCat = (t.category || '').toLowerCase().trim();
    const catId = (category.id || '').toLowerCase().trim();
    const catSlug = (category.slug || '').toLowerCase().trim();
    const catName = (category.name || '').toLowerCase().trim();
    return (
      toolCat === catId ||
      toolCat === catSlug ||
      toolCat === catName ||
      toolCat.replace(/-/g, ' ') === catName ||
      toolCat === catSlug.replace(/-/g, ' ')
    );
  }).length;

  const displayCount = matchingToolsCount > 0 ? matchingToolsCount : (category.toolCount || 0);

  return (
    <div
      id={`category-card-${category.id}`}
      className="group/card relative bg-[#FFFFFF] border border-[#EDE9FE] hover:border-[#DDD6FE] rounded-2xl p-4 sm:p-4.5 flex flex-col justify-between transition-all duration-200 shadow-2xs hover:shadow-[0_8px_24px_rgba(124,58,237,0.08)] hover:-translate-y-0.5 h-full"
    >
      <div>
        {/* Top Row: Icon and Tool Count Badge */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div
            className="w-8.5 h-8.5 rounded-xl bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center border border-[#DDD6FE] shrink-0 border transition-colors duration-200 group-hover/card:bg-[#7C3AED] group-hover/card:border-[#7C3AED] group-hover/card:text-white"
          >
            <DynamicIcon name={category.iconName || 'Grid2X2'} className="w-4 h-4 shrink-0 text-[#7C3AED] group-hover/card:text-white transition-colors duration-200" aria-hidden="true" />
          </div>

          <span className="text-xs font-heading font-semibold px-2.5 py-0.5 rounded-full bg-[#FAF9FE] text-[#7C3AED] border border-[#DDD6FE]">
            {displayCount} {displayCount === 1 ? 'tool' : 'tools'}
          </span>
        </div>

        {/* Category Title */}
        <h3 className="font-heading font-bold text-sm sm:text-base text-[#1E1035] group-hover/card:text-[#7C3AED] transition-colors duration-200 leading-snug">
          <Link href={categoryUrl} className="focus:outline-hidden after:absolute after:inset-0">
            {category.name}
          </Link>
        </h3>

        {/* Category Description */}
        <p className="font-sans text-xs text-[#6D6582] line-clamp-2 leading-relaxed mt-1">
          {category.description}
        </p>

        {subcategories.length > 0 && (
          <div className="relative z-10 mt-3 pt-3 border-t border-[#EDE9FE]">
            <p className="text-[10px] font-heading font-bold uppercase tracking-wide text-[#9D95B3] mb-2">
              Explore subjects
            </p>
            <div className="flex flex-wrap gap-1.5">
              {subcategories.slice(0, 4).map((sub) => (
                <Link
                  key={sub.id}
                  href={`/${sub.slug}`}
                  className="inline-flex items-center gap-1 rounded-lg border border-[#EDE9FE] bg-[#FAF9FE] px-2 py-1 text-[10px] font-semibold text-[#6D6582] hover:border-[#7C3AED] hover:bg-[#F5F3FF] hover:text-[#7C3AED] transition-colors"
                >
                  {sub.name}
                  <ArrowRight className="w-2.5 h-2.5" />
                </Link>
              ))}
              {subcategories.length > 4 && (
                <span className="text-[10px] text-[#6D6582] px-1 py-1">+{subcategories.length - 4} more</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Footer Row */}
      <div className="pt-2.5 mt-3 border-t border-[#F5F3FF] flex items-center justify-between text-xs">
        <span className="text-[11px] font-medium text-[#9D95B3] flex items-center gap-1">
          <Layers className="w-3 h-3 text-[#7C3AED]" />
          <span>Category Hub</span>
        </span>

        <span className="inline-flex items-center gap-1 font-heading font-semibold text-xs text-[#7C3AED] group-hover:translate-x-0.5 transition-transform">
          <span>Explore</span>
          <ArrowRight className="w-3 h-3" />
        </span>
      </div>
    </div>
  );
}
