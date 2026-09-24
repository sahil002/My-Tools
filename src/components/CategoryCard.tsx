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
      className="group relative bg-[#FFFFFF] border border-[#EDE9FE] hover:border-[#DDD6FE] rounded-xl p-3 sm:p-3.5 flex flex-col justify-between transition-all duration-200 shadow-2xs hover:shadow-[0_4px_16px_rgba(124,58,237,0.06)] hover:-translate-y-0.5 h-full min-h-[110px]"
    >
      <div>
        {/* Top Row: Compact Icon and Tool Count Badge */}
        <div className="flex items-center justify-between gap-1.5 mb-1.5">
          <div
            className="w-7 h-7 rounded-lg bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center border border-[#DDD6FE] shrink-0 group-hover:bg-[#7C3AED] group-hover:text-white transition-colors duration-200"
          >
            <DynamicIcon name={category.iconName} className="w-3.5 h-3.5" />
          </div>

          <span className="text-[10px] font-heading font-medium px-2 py-0.5 rounded-full bg-[#FAF9FE] text-[#7C3AED] border border-[#DDD6FE]">
            {category.toolCount} {category.toolCount === 1 ? 'tool' : 'tools'}
          </span>
        </div>

        {/* Category Title */}
        <h3 className="font-heading font-bold text-xs sm:text-[13px] text-[#1E1035] group-hover:text-[#7C3AED] transition-colors leading-snug">
          <Link href={categoryUrl} className="focus:outline-hidden after:absolute after:inset-0">
            {category.name}
          </Link>
        </h3>

        {/* Short 1-line Description */}
        <p className="font-sans text-[11px] text-[#6D6582] line-clamp-1 leading-normal mt-0.5">
          {category.description}
        </p>
      </div>

      {/* Footer Row: Compact Explore Link */}
      <div className="pt-1.5 mt-1.5 border-t border-[#F5F3FF] flex items-center justify-between text-[11px]">
        <span className="text-[10px] font-medium text-[#9D95B3] flex items-center gap-1">
          <Layers className="w-2.5 h-2.5 text-[#7C3AED]" />
          <span>Category</span>
        </span>

        <span className="inline-flex items-center gap-0.5 font-heading font-semibold text-[11px] text-[#7C3AED] group-hover:translate-x-0.5 transition-transform">
          <span>Explore</span>
          <ArrowRight className="w-2.5 h-2.5" />
        </span>
      </div>
    </div>
  );
}
