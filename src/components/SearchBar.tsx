import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Calculator, BookOpen, ArrowRight } from 'lucide-react';
import { TOOLS } from '../data/tools';
import { GUIDES } from '../data/guides';
import { CATEGORIES } from '../data/categories';
import { useRouter } from '../context/RouterContext';
import { ToolItem, GuideArticle } from '../types';

interface SearchBarProps {
  placeholder?: string;
  autoFocus?: boolean;
  className?: string;
  isHero?: boolean;
  showButton?: boolean;
  buttonText?: string;
  onSelect?: () => void;
}

export function SearchBar({
  placeholder = 'Search calculators, converters, text tools, guides...',
  autoFocus = false,
  className = '',
  isHero = false,
  showButton = false,
  buttonText = 'Search',
  onSelect,
}: SearchBarProps) {
  const { navigate } = useRouter();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const cleanQuery = query.trim().toLowerCase();

  // Search results grouping (matched against name, description, category, and keywords)
  const matchedTools: ToolItem[] = cleanQuery
    ? TOOLS.filter((t) => {
        const catObj = CATEGORIES.find((c) => c.id === t.category);
        const catName = catObj ? catObj.name.toLowerCase() : '';
        return (
          t.name.toLowerCase().includes(cleanQuery) ||
          t.description.toLowerCase().includes(cleanQuery) ||
          t.category.toLowerCase().includes(cleanQuery) ||
          catName.includes(cleanQuery) ||
          (t.keywords && t.keywords.some((k) => k.toLowerCase().includes(cleanQuery)))
        );
      }).slice(0, 6)
    : [];

  const matchedGuides: GuideArticle[] = cleanQuery
    ? GUIDES.filter(
        (g) =>
          g.title.toLowerCase().includes(cleanQuery) ||
          g.description.toLowerCase().includes(cleanQuery) ||
          g.category.toLowerCase().includes(cleanQuery)
      ).slice(0, 4)
    : [];

  const hasResults = matchedTools.length > 0 || matchedGuides.length > 0;

  // Click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelectTool = (tool: ToolItem) => {
    navigate(`/${tool.category}/${tool.slug}`);
    setIsOpen(false);
    setQuery('');
    if (onSelect) onSelect();
  };

  const handleSelectGuide = (guide: GuideArticle) => {
    navigate(`/guides/${guide.slug}`);
    setIsOpen(false);
    setQuery('');
    if (onSelect) onSelect();
  };

  const executeSearch = () => {
    if (matchedTools.length > 0) {
      handleSelectTool(matchedTools[0]);
    } else if (matchedGuides.length > 0) {
      handleSelectGuide(matchedGuides[0]);
    } else if (cleanQuery) {
      setIsOpen(false);
      navigate(`/tools?q=${encodeURIComponent(cleanQuery)}`);
      if (onSelect) onSelect();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
    } else if (e.key === 'Enter') {
      executeSearch();
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <div
        className={`flex items-center w-full transition-all duration-200 ${
          isHero
            ? 'bg-[#FFFFFF] rounded-full py-0.5 pl-3.5 pr-1 shadow-[0_2px_12px_rgba(124,58,237,0.06)] hover:shadow-[0_4px_18px_rgba(124,58,237,0.1)] border border-[#EDE9FE] hover:border-[#DDD6FE] h-10 sm:h-10.5'
            : 'bg-[#FFFFFF] border border-[#EDE9FE] rounded-xl py-1.5 px-3 text-sm hover:border-[#DDD6FE]'
        } ${
          isOpen
            ? 'ring-2 ring-[#7C3AED]/40 border-transparent shadow-md'
            : ''
        }`}
      >
        <Search
          className={`${
            isHero ? 'w-4 h-4 text-[#7C3AED]' : 'w-4 h-4 text-[#9D95B3]'
          } shrink-0 mr-2`}
          aria-hidden="true"
        />
        <input
          id={isHero ? 'hero-search-input' : 'header-search-input'}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          autoFocus={autoFocus}
          placeholder={placeholder}
          className="w-full bg-transparent text-[#1E1035] placeholder-[#9D95B3] focus:outline-hidden text-xs sm:text-[13px] font-normal font-sans py-0.5"
          autoComplete="off"
          aria-label="Search tools and guides"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="search-results-dropdown"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setIsOpen(false);
            }}
            className="p-1 text-[#9D95B3] hover:text-[#1E1035] transition-colors rounded-sm cursor-pointer mr-1"
            aria-label="Clear search query"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
        {(showButton || isHero) && (
          <button
            type="button"
            onClick={executeSearch}
            className="shrink-0 bg-[#7C3AED] hover:bg-[#6D28D9] active:bg-[#5B21B6] text-white font-heading font-semibold text-xs px-3 sm:px-3.5 py-1.5 rounded-full transition-all shadow-2xs cursor-pointer ml-1"
          >
            {buttonText}
          </button>
        )}
      </div>

      {/* Grouped Search Results Dropdown */}
      {isOpen && cleanQuery.length > 0 && (
        <div
          id="search-results-dropdown"
          role="listbox"
          className="absolute z-50 left-0 right-0 mt-2 bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl shadow-[0_12px_36px_rgba(124,58,237,0.12)] max-h-[480px] overflow-y-auto divide-y divide-[#EDE9FE]"
        >
          {hasResults ? (
            <>
              {/* Tools Group */}
              {matchedTools.length > 0 && (
                <div className="p-3">
                  <div className="text-xs font-heading font-semibold uppercase tracking-wider text-[#6D6582] px-2 py-1 flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5 text-[#7C3AED]" />
                    Tools &amp; Calculators ({matchedTools.length})
                  </div>
                  <div className="mt-1 space-y-1">
                    {matchedTools.map((tool) => (
                      <button
                        key={tool.id}
                        type="button"
                        onClick={() => handleSelectTool(tool)}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#F5F3FF] transition-colors flex items-center justify-between group cursor-pointer"
                      >
                        <div>
                          <div className="text-sm font-heading font-semibold text-[#1E1035] group-hover:text-[#7C3AED] transition-colors">
                            {tool.name}
                          </div>
                          <div className="text-xs font-sans text-[#6D6582] line-clamp-1">
                            {tool.description}
                          </div>
                        </div>
                        <span className="text-xs text-[#9D95B3] font-heading font-semibold shrink-0 ml-2 group-hover:text-[#7C3AED] flex items-center gap-1">
                          Open <ArrowRight className="w-3 h-3" />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Guides Group */}
              {matchedGuides.length > 0 && (
                <div className="p-3 bg-[#FAF9FE]">
                  <div className="text-xs font-heading font-semibold uppercase tracking-wider text-[#6D6582] px-2 py-1 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5 text-[#7C3AED]" />
                    Guides &amp; Formulas ({matchedGuides.length})
                  </div>
                  <div className="mt-1 space-y-1">
                    {matchedGuides.map((guide) => (
                      <button
                        key={guide.slug}
                        type="button"
                        onClick={() => handleSelectGuide(guide)}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-[#FFFFFF] transition-colors flex items-center justify-between group cursor-pointer"
                      >
                        <div>
                          <div className="text-sm font-heading font-semibold text-[#1E1035] group-hover:text-[#7C3AED] transition-colors">
                            {guide.title}
                          </div>
                          <div className="text-xs font-sans text-[#6D6582] line-clamp-1">
                            {guide.description}
                          </div>
                        </div>
                        <span className="text-xs text-[#9D95B3] font-heading font-semibold shrink-0 ml-2 group-hover:text-[#7C3AED] flex items-center gap-1">
                          Read <ArrowRight className="w-3 h-3" />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="p-6 text-center text-sm font-sans text-[#6D6582]">
              No tools or guides found matching &quot;<span className="font-heading font-medium text-[#1E1035]">{query}</span>&quot;.
              <div className="mt-2 text-xs font-sans text-[#9D95B3]">
                Try searching for &quot;percentage&quot;, &quot;loan&quot;, &quot;word&quot;, or &quot;json&quot;.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
