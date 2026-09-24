import { useState, useEffect } from 'react';
import { Breadcrumbs } from '../components/Breadcrumbs';
import { ToolCard } from '../components/ToolCard';
import { SEOHelmet } from '../components/SEOHelmet';
import { Link } from '../context/RouterContext';
import {
  getUserFavorites,
  getFavoritedTools,
  clearAllFavorites,
  FAVORITES_UPDATED_EVENT,
} from '../services/userFavoritesService';
import { Tool } from '../types';
import { Heart, Compass, Trash2, Sparkles } from 'lucide-react';

export function FavoritesView() {
  const [favoritesList, setFavoritesList] = useState<Tool[]>([]);

  useEffect(() => {
    const updateList = () => {
      setFavoritesList(getFavoritedTools());
    };
    updateList();
    window.addEventListener(FAVORITES_UPDATED_EVENT, updateList);
    return () => window.removeEventListener(FAVORITES_UPDATED_EVENT, updateList);
  }, []);

  return (
    <div className="space-y-6 sm:space-y-7">
      <SEOHelmet
        title="Saved Favorites – Online Tools"
        description="View and access your favorite calculators, converters, and utilities."
        canonicalPath="/favorites"
        breadcrumbs={[{ label: 'Saved Favorites', path: '/favorites' }]}
      />

      <Breadcrumbs items={[{ label: 'Saved Favorites', path: '/favorites' }]} />

      {/* Header */}
      <header className="border-b border-[#EDE9FE] pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-7 h-7 rounded-lg bg-[#F5F3FF] text-[#7C3AED] flex items-center justify-center border border-[#DDD6FE]">
              <Heart className="w-3.5 h-3.5 fill-[#7C3AED]" />
            </div>
            <h1 className="text-xl sm:text-2xl font-heading font-bold text-[#1E1035] tracking-tight">
              Saved Favorites
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-heading font-semibold bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]">
              {favoritesList.length} {favoritesList.length === 1 ? 'Tool' : 'Tools'}
            </span>
          </div>
          <p className="text-xs sm:text-sm font-sans text-[#6D6582] max-w-2xl leading-relaxed">
            Quickly launch your frequently used calculators, converters, and developer utilities saved directly to your browser.
          </p>
        </div>

        {favoritesList.length > 0 && (
          <button
            type="button"
            onClick={clearAllFavorites}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-heading font-semibold text-[#DC2626] bg-[#FEF2F2] hover:bg-[#FEE2E2] border border-[#FCA5A5] transition-colors self-start sm:self-auto cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>
        )}
      </header>

      {/* Favorites Grid */}
      {favoritesList.length > 0 ? (
        <section aria-label="Favorite Tools">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {favoritesList.map((tool) => (
              <ToolCard key={tool.id} tool={tool} />
            ))}
          </div>
        </section>
      ) : (
        <div className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-3xl p-10 sm:p-14 text-center space-y-4 shadow-[0_2px_14px_rgba(124,58,237,0.03)] max-w-xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] flex items-center justify-center mx-auto shadow-2xs">
            <Heart className="w-8 h-8 text-[#7C3AED]" />
          </div>
          <h2 className="text-xl font-heading font-bold text-[#1E1035]">
            No favorites saved yet
          </h2>
          <p className="text-sm font-sans text-[#6D6582] leading-relaxed">
            Click the heart icon on any tool card or inside any tool page to pin it here for instant one-click access.
          </p>
          <div className="pt-2">
            <Link
              href="/tools"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-heading font-bold bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-xs transition-colors"
            >
              <Compass className="w-4 h-4" />
              <span>Explore All Tools</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
