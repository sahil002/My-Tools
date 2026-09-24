import { useState, useEffect } from 'react';
import { ToolItem } from '../types';
import { Link } from '../context/RouterContext';
import { DynamicIcon } from './DynamicIcon';
import { ArrowRight, Zap, Play, Heart } from 'lucide-react';
import { CATEGORIES } from '../data/categories';
import { getCategoryTheme } from '../utils/categoryColors';
import {
  isToolFavorited,
  toggleToolFavorite,
  FAVORITES_UPDATED_EVENT,
} from '../services/userFavoritesService';

interface ToolCardProps {
  tool: ToolItem;
  hidePopularBadge?: boolean;
  compact?: boolean;
}

export function ToolCard({ tool, hidePopularBadge = false, compact = false }: ToolCardProps) {
  const toolUrl = `/${tool.category}/${tool.slug}`;
  const categoryName = CATEGORIES.find((c) => c.id === tool.category)?.name || tool.category;
  const theme = getCategoryTheme(tool.category || tool.slug);
  const [isFav, setIsFav] = useState(() => isToolFavorited(tool.id) || isToolFavorited(tool.slug));

  useEffect(() => {
    const handleFavUpdate = () => {
      setIsFav(isToolFavorited(tool.id) || isToolFavorited(tool.slug));
    };
    window.addEventListener(FAVORITES_UPDATED_EVENT, handleFavUpdate);
    return () => window.removeEventListener(FAVORITES_UPDATED_EVENT, handleFavUpdate);
  }, [tool.id, tool.slug]);

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newStatus = toggleToolFavorite(tool.id);
    setIsFav(newStatus);
  };

  return (
    <div
      id={`tool-card-${tool.id}`}
      className="group relative bg-[#FFFFFF] border border-[#EDE9FE] hover:border-[#DDD6FE] rounded-2xl h-full flex flex-col justify-between p-3.5 sm:p-4 transition-all duration-200 shadow-[0_2px_10px_rgba(124,58,237,0.03)] hover:shadow-[0_10px_25px_rgba(124,58,237,0.08)] hover:-translate-y-0.5"
    >
      <div>
        {/* Top Header Row: Category Badge, Popular pill & Favorite Button */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div
            className="w-8.5 h-8.5 rounded-xl bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center shrink-0 border border-[#DDD6FE] shadow-2xs group-hover:bg-[#7C3AED] group-hover:text-white transition-colors duration-200"
          >
            <DynamicIcon name={tool.iconName} className="w-4 h-4" />
          </div>

          <div className="flex items-center gap-1.5 flex-wrap justify-end">
            <span
              className="text-[10px] font-heading font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]"
            >
              {categoryName}
            </span>

            {!hidePopularBadge && tool.popular && (
              <span
                className="inline-flex items-center gap-1 text-[10px] font-heading font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#EDE9FE] text-[#6D28D9] border border-[#DDD6FE]"
              >
                <Zap className="w-2.5 h-2.5 fill-current text-[#7C3AED]" />
                Popular
              </span>
            )}

            {/* Direct Favorite Heart Icon */}
            <button
              type="button"
              onClick={handleFavoriteClick}
              className={`p-1.5 rounded-lg border transition-colors cursor-pointer relative z-10 ${
                isFav
                  ? 'bg-[#F5F3FF] text-[#7C3AED] border-[#DDD6FE]'
                  : 'bg-white text-[#9D95B3] hover:text-[#7C3AED] hover:bg-[#F5F3FF] border-[#EDE9FE]'
              }`}
              title={isFav ? 'Remove from favorites' : 'Save to favorites'}
              aria-label={isFav ? 'Remove from favorites' : 'Save to favorites'}
            >
              <Heart className={`w-3.5 h-3.5 ${isFav ? 'fill-[#7C3AED] text-[#7C3AED]' : ''}`} />
            </button>
          </div>
        </div>

        {/* Tool Name */}
        <h3 className="font-heading font-bold text-[#1E1035] group-hover:text-[#7C3AED] transition-colors leading-snug text-[13.5px] sm:text-sm mb-1">
          <Link href={toolUrl} className="focus:outline-hidden after:absolute after:inset-0 hover:underline">
            {tool.name}
          </Link>
        </h3>

        {/* Short Tool Purpose */}
        <p className="font-sans text-[#6D6582] text-xs line-clamp-2 leading-relaxed mb-2.5">
          {tool.description}
        </p>
      </div>

      {/* Interactive Tool Footer Row */}
      <div className="border-t border-[#EDE9FE] pt-2 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1 text-[10.5px] font-medium text-[#9D95B3]">
          <Play className="w-2.5 h-2.5 text-[#7C3AED]" />
          <span>Instant calc</span>
        </span>

        <span
          className="inline-flex items-center gap-1 font-heading font-semibold transition-all duration-150 shadow-xs text-white bg-[#7C3AED] group-hover:bg-[#6D28D9] px-2.5 py-1 rounded-lg text-[11px]"
        >
          <span>Run Tool</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </span>
      </div>
    </div>
  );
}
