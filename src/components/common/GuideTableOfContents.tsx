import React, { useState } from 'react';
import { Bookmark, ChevronDown, ChevronUp, Compass, ArrowUpRight } from 'lucide-react';

export interface TOCItem {
  id: string;
  text: string;
  level: number;
}

interface GuideTableOfContentsProps {
  items: TOCItem[];
  readingTime?: string;
}

export function GuideTableOfContents({ items, readingTime }: GuideTableOfContentsProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  if (!items || items.length === 0) return null;

  const handleScrollTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const yOffset = -90; // Offset for sticky navbar
      const y = el.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });

      // Briefly flash target element
      el.classList.add('ring-2', 'ring-[#7C3AED]', 'rounded-lg');
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-[#7C3AED]', 'rounded-lg');
      }, 1500);
    }
  };

  return (
    <nav
      aria-label="Table of Contents"
      className="my-6 p-4 sm:p-5 bg-gradient-to-br from-[#FAF9FE] via-[#FFFFFF] to-[#F5F3FF] border border-[#DDD6FE] rounded-2xl shadow-2xs transition-all font-sans"
    >
      {/* Header bar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#FAF5FF] border border-[#DDD6FE] text-[#7C3AED] flex items-center justify-center shadow-2xs">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <span className="font-heading font-extrabold text-sm sm:text-[15px] text-[#1E1035] flex items-center gap-2">
              <span>In This Guide</span>
              <span className="text-[10px] font-mono font-bold text-[#7C3AED] bg-[#FAF5FF] px-2 py-0.5 rounded-full border border-[#DDD6FE]">
                {items.length} Sections
              </span>
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {readingTime && (
            <span className="text-[11px] font-medium text-[#6D6582] hidden sm:inline">
              Est. {readingTime}
            </span>
          )}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded-lg text-[#6D6582] hover:text-[#7C3AED] hover:bg-white border border-transparent hover:border-[#DDD6FE] cursor-pointer transition-colors"
            title={isExpanded ? 'Collapse Table of Contents' : 'Expand Table of Contents'}
          >
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Items list */}
      {isExpanded && (
        <div className="mt-3.5 pt-3.5 border-t border-[#EDE9FE] animate-in fade-in">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 text-xs sm:text-[13px]">
            {items.map((item, idx) => (
              <a
                key={idx}
                href={`#${item.id}`}
                onClick={(e) => handleScrollTo(e, item.id)}
                className={`group flex items-start gap-2 py-1 px-2 rounded-lg hover:bg-white hover:text-[#7C3AED] transition-colors ${
                  item.level === 3 ? 'ml-3 text-[#6D6582]' : 'text-[#372E4C] font-medium'
                }`}
              >
                <span className="text-[#9D95B3] group-hover:text-[#7C3AED] font-mono text-[11px] mt-0.5 shrink-0">
                  {idx + 1}.
                </span>
                <span className="line-clamp-1 leading-snug flex-1 group-hover:underline">
                  {item.text}
                </span>
                <ArrowUpRight className="w-3 h-3 text-[#DDD6FE] group-hover:text-[#7C3AED] opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-0.5" />
              </a>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
