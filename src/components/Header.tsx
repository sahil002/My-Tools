import { useState, useEffect, useRef } from 'react';
import { Link, useRouter } from '../context/RouterContext';
import {
  Menu,
  X,
  ChevronDown,
  Wrench,
  Heart,
  Sparkles,
  ArrowRight,
  Calculator,
  FileText,
  RefreshCw,
  Code2,
  Trash2,
  ExternalLink,
  Compass,
  Home,
  Calendar,
  GraduationCap,
} from 'lucide-react';
import { CATEGORIES } from '../data/categories';
import { getToolsByCategory } from '../data/tools';
import {
  getUserFavorites,
  getFavoritedTools,
  FAVORITES_UPDATED_EVENT,
  toggleToolFavorite,
} from '../services/userFavoritesService';
import { Tool } from '../types';

export function Header() {
  const { currentPath, navigate } = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoriesMegaOpen, setCategoriesMegaOpen] = useState(false);
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [favoritesCount, setFavoritesCount] = useState<number>(0);
  const [favoriteToolsList, setFavoriteToolsList] = useState<Tool[]>([]);

  const megaMenuRef = useRef<HTMLDivElement>(null);
  const favoritesRef = useRef<HTMLDivElement>(null);

  // Sync favorites
  useEffect(() => {
    const updateFavs = () => {
      const favs = getUserFavorites();
      setFavoritesCount(favs.length);
      setFavoriteToolsList(getFavoritedTools());
    };

    updateFavs();
    window.addEventListener(FAVORITES_UPDATED_EVENT, updateFavs);
    return () => window.removeEventListener(FAVORITES_UPDATED_EVENT, updateFavs);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (megaMenuRef.current && !megaMenuRef.current.contains(event.target as Node)) {
        setCategoriesMegaOpen(false);
      }
      if (favoritesRef.current && !favoritesRef.current.contains(event.target as Node)) {
        setFavoritesOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const closeAll = () => {
    setMobileMenuOpen(false);
    setCategoriesMegaOpen(false);
    setFavoritesOpen(false);
  };

  // Helper icons for categories
  const getCategoryIcon = (slug: string, className = 'w-4 h-4 text-[#7C3AED]') => {
    switch (slug) {
      case 'calculators':
        return <Calculator className={className} />;
      case 'text-tools':
        return <FileText className={className} />;
      case 'converters':
        return <RefreshCw className={className} />;
      case 'date-time':
        return <Calendar className={className} />;
      case 'education':
        return <GraduationCap className={className} />;
      case 'developer-tools':
      default:
        return <Code2 className={className} />;
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-[#FFFFFF] border-b border-[#EDE9FE] shadow-[0_2px_10px_rgba(124,58,237,0.03)] transition-all duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* 1. LEFT: Brand Logo */}
          <div className="flex items-center shrink-0">
            <Link
              href="/"
              onClick={closeAll}
              className="flex items-center gap-2 font-heading font-bold text-sm sm:text-[15px] text-[#1E1035] hover:text-[#7C3AED] transition-colors focus:outline-hidden group"
              aria-label="Online Tools Homepage"
            >
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#7C3AED] to-[#5B21B6] text-white flex items-center justify-center font-bold text-xs shadow-xs shadow-[#7C3AED]/20 group-hover:scale-105 transition-transform">
                <Wrench className="w-3.5 h-3.5" />
              </div>
              <div className="leading-tight">
                <span className="tracking-tight text-[#1E1035]">Online</span>
                <span className="text-[#7C3AED]">Tools</span>
              </div>
            </Link>
          </div>

          {/* 2. CENTER: Navigation Menus (Home, Categories Mega Menu & Guides) */}
          <nav aria-label="Main Navigation" className="hidden md:flex items-center gap-4 sm:gap-5 text-xs sm:text-[13px] font-heading font-semibold">
            {/* Home Navigation Link */}
            <Link
              href="/"
              onClick={closeAll}
              className={`py-1 transition-colors relative ${
                currentPath === '/'
                  ? 'text-[#7C3AED] font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#7C3AED] after:rounded-full'
                  : 'text-[#1E1035] hover:text-[#7C3AED]'
              }`}
            >
              Home
            </Link>

            {/* Categories with Mega Menu Dropdown */}
            <div className="relative" ref={megaMenuRef}>
              <button
                type="button"
                id="categories-mega-menu-trigger"
                onClick={() => setCategoriesMegaOpen(!categoriesMegaOpen)}
                onMouseEnter={() => setCategoriesMegaOpen(true)}
                aria-expanded={categoriesMegaOpen}
                aria-haspopup="true"
                className={`flex items-center gap-1 py-1 transition-colors cursor-pointer ${
                  categoriesMegaOpen || currentPath.includes('/calculators') || currentPath.includes('/text-tools') || currentPath.includes('/converters') || currentPath.includes('/developer-tools') || currentPath.includes('/date-time') || currentPath.includes('/education')
                    ? 'text-[#7C3AED] font-bold'
                    : 'text-[#1E1035] hover:text-[#7C3AED]'
                }`}
              >
                <span>Categories</span>
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${categoriesMegaOpen ? 'rotate-180 text-[#7C3AED]' : 'text-[#9D95B3]'}`} />
              </button>

              {/* Beautiful, Balanced 3x2 Grid Mega Menu */}
              {categoriesMegaOpen && (
                <div
                  onMouseLeave={() => setCategoriesMegaOpen(false)}
                  className="absolute left-1/2 -translate-x-1/2 top-full mt-2 w-[760px] lg:w-[840px] bg-white border border-[#EDE9FE] rounded-2xl shadow-[0_16px_40px_rgba(124,58,237,0.12)] p-4 sm:p-5 z-50 animate-in fade-in zoom-in-95 duration-150"
                >
                  {/* Mega Menu Top Header */}
                  <div className="flex items-center justify-between pb-3 mb-3.5 border-b border-[#EDE9FE]">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#7C3AED] animate-pulse" />
                      <span className="text-[11px] font-heading font-extrabold uppercase tracking-wider text-[#1E1035]">
                        Browse by Category
                      </span>
                      <span className="text-[11px] text-[#6D6582] font-sans">
                        ({CATEGORIES.length} Categories • 150+ Utilities)
                      </span>
                    </div>
                    <Link
                      href="/tools"
                      onClick={closeAll}
                      className="text-[11px] font-heading font-bold text-[#7C3AED] hover:text-[#6D28D9] flex items-center gap-1 hover:underline"
                    >
                      <span>Explore Full Directory</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>

                  {/* Balanced 3-Column x 2-Row Category Grid */}
                  <div className="grid grid-cols-3 gap-3">
                    {CATEGORIES.map((cat) => {
                      const catTools = getToolsByCategory(cat.id).slice(0, 3);

                      return (
                        <div
                          key={cat.id}
                          className="group/card flex flex-col justify-between p-3 rounded-xl bg-white border border-[#EDE9FE] hover:border-[#DDD6FE] hover:shadow-xs transition-all duration-200"
                        >
                          <div>
                            {/* Category Header */}
                            <Link
                              href={`/${cat.slug}`}
                              onClick={closeAll}
                              className="flex items-center justify-between gap-2 mb-1.5 focus:outline-hidden"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="w-7 h-7 rounded-lg bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center border border-[#DDD6FE] shrink-0 group-hover/card:bg-[#EDE9FE] group-hover/card:border-[#7C3AED] transition-colors duration-200">
                                  {getCategoryIcon(cat.slug, 'w-3.5 h-3.5 text-[#7C3AED]')}
                                </div>
                                <h4 className="text-xs sm:text-[13px] font-heading font-bold text-[#1E1035] group-hover/card:text-[#7C3AED] transition-colors truncate">
                                  {cat.name}
                                </h4>
                              </div>
                              <span className="text-[10px] font-heading font-bold text-[#7C3AED] bg-[#F5F3FF] px-1.5 py-0.2 rounded-full border border-[#DDD6FE] shrink-0">
                                {cat.toolCount}
                              </span>
                            </Link>

                            {/* Direct Top Tool Links */}
                            <ul className="space-y-0.5 mt-1.5">
                              {catTools.map((t) => (
                                <li key={t.id}>
                                  <Link
                                    href={`/${t.category}/${t.slug}`}
                                    onClick={closeAll}
                                    className="flex items-center justify-between text-[11px] text-[#6D6582] hover:text-[#7C3AED] hover:bg-[#F5F3FF] px-1.5 py-0.5 rounded-md transition-colors truncate font-sans font-medium group/link"
                                    title={t.name}
                                  >
                                    <span className="truncate">{t.name}</span>
                                    <span className="text-[#9D95B3] group-hover/link:text-[#7C3AED] text-[10px] opacity-0 group-hover/link:opacity-100 transition-opacity shrink-0 ml-1">
                                      →
                                    </span>
                                  </Link>
                                </li>
                              ))}
                            </ul>
                          </div>

                          {/* Category Footer Link */}
                          <Link
                            href={`/${cat.slug}`}
                            onClick={closeAll}
                            className="mt-2 pt-1.5 border-t border-[#EDE9FE] text-[10px] font-heading font-bold text-[#7C3AED] hover:text-[#6D28D9] flex items-center justify-between group/foot"
                          >
                            <span>View all</span>
                            <ArrowRight className="w-2.5 h-2.5 group-hover/foot:translate-x-0.5 transition-transform" />
                          </Link>
                        </div>
                      );
                    })}
                  </div>

                  {/* Mega Menu Bottom Highlight Banner */}
                  <div className="mt-3.5 pt-3 border-t border-[#EDE9FE] flex flex-wrap items-center justify-between gap-2.5 text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[#6D6582] font-heading font-medium text-[11px]">Trending:</span>
                      {[
                        { label: 'Percentage Calc', path: '/calculators/percentage-calculator' },
                        { label: 'Word Counter', path: '/text-tools/word-counter' },
                        { label: 'Age Calculator', path: '/date-time/age-calculator' },
                        { label: 'JSON Formatter', path: '/developer-tools/json-formatter' },
                      ].map((chip) => (
                        <Link
                          key={chip.label}
                          href={chip.path}
                          onClick={closeAll}
                          className="px-2 py-0.5 rounded-full bg-[#FAF9FE] text-[#6D6582] hover:text-[#7C3AED] hover:bg-[#F5F3FF] border border-[#EDE9FE] text-[10px] font-medium transition-colors"
                        >
                          {chip.label}
                        </Link>
                      ))}
                    </div>
                    <Link
                      href="/request-a-tool"
                      onClick={closeAll}
                      className="font-heading font-bold text-[11px] text-[#7C3AED] hover:text-[#6D28D9] hover:underline flex items-center gap-1 shrink-0"
                    >
                      <Sparkles className="w-3 h-3 text-[#7C3AED]" />
                      <span>Request a New Tool →</span>
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Guides Menu Link */}
            <Link
              href="/guides"
              onClick={closeAll}
              className={`py-1 transition-colors relative ${
                currentPath.startsWith('/guides')
                  ? 'text-[#7C3AED] font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#7C3AED] after:rounded-full'
                  : 'text-[#1E1035] hover:text-[#7C3AED]'
              }`}
            >
              Guides
            </Link>
          </nav>

          {/* 3. RIGHT: Actions (Request Tool, Beautiful Favorites Icon, Explore Tools Button) */}
          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* Request Tool Button */}
            <Link
              href="/request-a-tool"
              onClick={closeAll}
              className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-heading font-semibold bg-[#F5F3FF] text-[#7C3AED] hover:bg-[#EDE9FE] border border-[#DDD6FE] transition-colors cursor-pointer"
            >
              <span>Request Tool</span>
            </Link>

            {/* Beautiful Favorites Icon Button with Dropdown Drawer */}
            <div className="relative" ref={favoritesRef}>
              <button
                type="button"
                id="header-favorites-icon-btn"
                onClick={() => setFavoritesOpen(!favoritesOpen)}
                className={`relative p-1.5 rounded-lg border transition-all cursor-pointer flex items-center justify-center ${
                  favoritesOpen || favoritesCount > 0
                    ? 'bg-[#F5F3FF] text-[#7C3AED] border-[#DDD6FE] shadow-2xs'
                    : 'bg-white text-[#6D6582] hover:text-[#7C3AED] hover:bg-[#F5F3FF] border-[#EDE9FE]'
                }`}
                aria-label={`Saved Favorites (${favoritesCount} tools)`}
                title="Saved Favorite Tools"
              >
                <Heart
                  className={`w-3.5 h-3.5 transition-transform duration-200 ${
                    favoritesCount > 0 ? 'fill-[#7C3AED] text-[#7C3AED] scale-105' : 'text-[#6D6582]'
                  }`}
                />
                {favoritesCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[15px] h-[15px] px-0.5 rounded-full bg-[#7C3AED] text-white text-[8px] font-bold flex items-center justify-center shadow-xs animate-in zoom-in-50">
                    {favoritesCount}
                  </span>
                )}
              </button>

              {/* Favorites Quick Drawer / Dropdown */}
              {favoritesOpen && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white border border-[#EDE9FE] rounded-2xl shadow-[0_12px_36px_rgba(124,58,237,0.14)] p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-[#EDE9FE] mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center">
                        <Heart className="w-3.5 h-3.5 fill-[#7C3AED]" />
                      </div>
                      <span className="font-heading font-bold text-sm text-[#1E1035]">Saved Favorites</span>
                    </div>
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]">
                      {favoritesCount} {favoritesCount === 1 ? 'tool' : 'tools'}
                    </span>
                  </div>

                  {/* List of Saved Favorites */}
                  {favoriteToolsList.length > 0 ? (
                    <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1">
                      {favoriteToolsList.map((tool) => (
                        <div
                          key={tool.id}
                          className="group flex items-center justify-between p-2.5 rounded-xl bg-[#FAF9FE] hover:bg-[#F5F3FF] border border-[#EDE9FE] transition-colors"
                        >
                          <Link
                            href={`/${tool.category}/${tool.slug}`}
                            onClick={closeAll}
                            className="flex-1 min-w-0 pr-2 focus:outline-hidden"
                          >
                            <p className="text-xs font-heading font-bold text-[#1E1035] group-hover:text-[#7C3AED] truncate">
                              {tool.name}
                            </p>
                            <p className="text-[11px] text-[#9D95B3] truncate font-sans">
                              {tool.description}
                            </p>
                          </Link>

                          <button
                            type="button"
                            onClick={() => toggleToolFavorite(tool.id)}
                            className="p-1 text-[#9D95B3] hover:text-[#DC2626] rounded-md hover:bg-white transition-colors cursor-pointer"
                            title="Remove from favorites"
                            aria-label={`Remove ${tool.name} from favorites`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-6 text-center text-xs text-[#6D6582] space-y-2">
                      <Heart className="w-8 h-8 text-[#DDD6FE] mx-auto stroke-[1.5]" />
                      <p className="font-medium text-[#1E1035]">No favorites saved yet</p>
                      <p className="text-[11px] text-[#9D95B3] max-w-[200px] mx-auto">
                        Click the heart icon on any tool to save it here for instant access.
                      </p>
                    </div>
                  )}

                  <div className="mt-3 pt-3 border-t border-[#EDE9FE] flex items-center justify-between text-xs">
                    <Link
                      href="/tools"
                      onClick={closeAll}
                      className="font-bold text-[#7C3AED] hover:text-[#6D28D9] flex items-center gap-1"
                    >
                      <span>Explore More Tools</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              )}
            </div>

            {/* Explore Tools Button */}
            <Link
              href="/tools"
              onClick={closeAll}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-heading font-semibold bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-xs shadow-[#7C3AED]/20 transition-all cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Explore Tools</span>
            </Link>

            {/* Mobile Menu Button */}
            <div className="flex items-center md:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 rounded-lg text-[#6D6582] hover:text-[#1E1035] hover:bg-[#F5F3FF] border border-[#EDE9FE] focus:outline-hidden cursor-pointer"
                aria-label="Toggle Navigation Menu"
                aria-expanded={mobileMenuOpen}
              >
                {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#EDE9FE] bg-white px-4 pt-3 pb-6 space-y-4 text-[#1E1035] animate-in fade-in duration-150">
          <nav aria-label="Mobile Navigation" className="space-y-1">
            <Link
              href="/"
              onClick={closeAll}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-bold transition-colors ${
                currentPath === '/' ? 'bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]' : 'text-[#1E1035] hover:bg-[#F5F3FF]'
              }`}
            >
              <Home className="w-4 h-4 text-[#7C3AED]" />
              <span>Home</span>
            </Link>

            <Link
              href="/tools"
              onClick={closeAll}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-bold text-white bg-[#7C3AED]"
            >
              <span className="flex items-center gap-2">
                <Compass className="w-4 h-4" />
                <span>Explore Tools</span>
              </span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/guides"
              onClick={closeAll}
              className="block px-3 py-2.5 rounded-xl text-sm font-bold text-[#1E1035] hover:bg-[#F5F3FF] hover:text-[#7C3AED]"
            >
              Guides & Tutorials
            </Link>

            <Link
              href="/request-a-tool"
              onClick={closeAll}
              className="block px-3 py-2.5 rounded-xl text-sm font-semibold text-[#7C3AED] bg-[#F5F3FF] hover:bg-[#EDE9FE]"
            >
              Request a New Tool
            </Link>
          </nav>

          {/* Categories Quick List on Mobile */}
          <div className="pt-3 border-t border-[#EDE9FE]">
            <div className="px-3 pb-1.5 text-xs font-bold uppercase tracking-wider text-[#9D95B3]">
              Browse Categories
            </div>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/${cat.slug}`}
                  onClick={closeAll}
                  className="p-2.5 text-xs font-semibold rounded-xl bg-[#FAF9FE] border border-[#EDE9FE] text-[#1E1035] hover:text-[#7C3AED] hover:border-[#DDD6FE] transition-colors flex items-center gap-2"
                >
                  <div className="w-6 h-6 rounded-md bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center shrink-0">
                    {getCategoryIcon(cat.slug)}
                  </div>
                  <span className="truncate">{cat.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
