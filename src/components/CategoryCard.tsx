import { CategoryInfo } from '../types';
import { Link } from '../context/RouterContext';
import { DynamicIcon } from './DynamicIcon';
import { ArrowRight, Layers } from 'lucide-react';
import { getToolsByCategory } from '../data/tools';
import { getCategoryTheme } from '../utils/categoryColors';

interface CategoryCardProps {
  category: CategoryInfo;
}

export function CategoryCard({ category }: CategoryCardProps) {
  const categoryUrl = `/${category.slug}`;
  const toolsInCategory = getToolsByCategory(category.id);
  const theme = getCategoryTheme(category.id || category.slug);

  return (
    <div
      id={`category-card-${category.id}`}
      className="group relative bg-[#FFFFFF] border border-[#EDE9FE] hover:border-[#DDD6FE] rounded-2xl p-4 sm:p-4.5 flex flex-col justify-between transition-all duration-200 shadow-2xs hover:shadow-[0_8px_24px_rgba(124,58,237,0.08)] hover:-translate-y-0.5 h-full"
    >
      <div>
        {/* Top Row: Icon and Tool Count Badge */}
        <div className="flex items-center justify-between gap-2 mb-2.5">
          <div
            className="w-8.5 h-8.5 rounded-xl bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center border border-[#DDD6FE] shrink-0 group-hover:bg-[#7C3AED] group-hover:text-white transition-colors duration-200"
          >
            <DynamicIcon name={category.iconName} className="w-4 h-4" />
          </div>

          <span className="text-xs font-heading font-semibold px-2.5 py-0.5 rounded-full bg-[#FAF9FE] text-[#7C3AED] border border-[#DDD6FE]">
            {category.toolCount} {category.toolCount === 1 ? 'tool' : 'tools'}
          </span>
        </div>

        {/* Category Title */}
        <h3 className="font-heading font-bold text-sm sm:text-base text-[#1E1035] group-hover:text-[#7C3AED] transition-colors leading-snug">
          <Link href={categoryUrl} className="focus:outline-hidden after:absolute after:inset-0">
            {category.name}
          </Link>
        </h3>

        {/* Category Description */}
        <p className="font-sans text-xs text-[#6D6582] line-clamp-2 leading-relaxed mt-1">
          {category.description}
        </p>
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
