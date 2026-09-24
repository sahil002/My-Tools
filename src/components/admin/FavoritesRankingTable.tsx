import React, { useState, useMemo } from 'react';
import { ToolFavoriteMetric } from '../../services/favoritesAnalyticsService';
import {
  Heart,
  ArrowUp,
  ArrowDown,
  Minus,
  Search,
  ExternalLink,
  ChevronDown,
  Layers,
  Sparkles,
  TrendingUp,
  CheckCircle2,
  Info,
  SlidersHorizontal,
} from 'lucide-react';
import { Link } from '../../context/RouterContext';

interface FavoritesRankingTableProps {
  tools: ToolFavoriteMetric[];
  onSelectTool: (tool: ToolFavoriteMetric) => void;
  selectedToolSlug: string | null;
}

type SortColumn = 'rank' | 'name' | 'totalFavorites' | 'recentFavorites' | 'favoriteRatePercent' | 'growthPercent';

export function FavoritesRankingTable({
  tools,
  onSelectTool,
  selectedToolSlug,
}: FavoritesRankingTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [tierFilter, setTierFilter] = useState('all');
  const [sortCol, setSortCol] = useState<SortColumn>('rank');
  const [sortAsc, setSortAsc] = useState(true);

  // Available categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    tools.forEach((t) => set.add(t.category));
    return Array.from(set).sort();
  }, [tools]);

  // Filtered & sorted
  const displayedTools = useMemo(() => {
    let result = tools.filter((t) => {
      if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
      if (tierFilter !== 'all' && t.actionRecommendation.tier !== tierFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          t.name.toLowerCase().includes(q) ||
          t.slug.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q)
        );
      }
      return true;
    });

    result.sort((a, b) => {
      let comparison = 0;
      switch (sortCol) {
        case 'rank':
          comparison = a.rank - b.rank;
          break;
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'totalFavorites':
          comparison = a.totalFavorites - b.totalFavorites;
          break;
        case 'recentFavorites':
          comparison = a.recentFavorites - b.recentFavorites;
          break;
        case 'favoriteRatePercent':
          comparison = a.favoriteRatePercent - b.favoriteRatePercent;
          break;
        case 'growthPercent':
          comparison = a.growthPercent - b.growthPercent;
          break;
      }
      return sortAsc ? comparison : -comparison;
    });

    return result;
  }, [tools, searchQuery, categoryFilter, tierFilter, sortCol, sortAsc]);

  const handleHeaderClick = (col: SortColumn) => {
    if (sortCol === col) {
      setSortAsc(!sortAsc);
    } else {
      setSortCol(col);
      // Default to desc for numeric counts, asc for rank/name
      setSortAsc(col === 'rank' || col === 'name');
    }
  };

  const getTierBadge = (tier: ToolFavoriteMetric['actionRecommendation']['tier']) => {
    switch (tier) {
      case 'promote':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#E9F8EF] text-[#16A34A] dark:bg-[#1B233A] dark:text-[#16A34A] border border-[#16A34A]/30 dark:border-[#16A34A]/30">
            Promote
          </span>
        );
      case 'optimize':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#FFFBEB] text-[#F59E0B] dark:bg-[#1B233A] dark:text-[#F59E0B] border border-[#F59E0B]/30 dark:border-amber-800">
            Optimize
          </span>
        );
      case 'maintain':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
            Core
          </span>
        );
      case 'monitor':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            Monitor
          </span>
        );
    }
  };

  return (
    <div
      id="favorites-ranking-table-card"
      className="bg-[#FFFFFF] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] rounded-xl overflow-hidden shadow-2xs"
    >
      {/* Header & Filter Controls */}
      <div className="p-5 border-b border-[#E4E8EF] dark:border-[#1B233A] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-bold text-[#131A2B] dark:text-[#F4F6F9]">
              Most-Favorited Tools Ranking
            </h2>
            <p className="text-xs text-[#5B6577] dark:text-[#9AA5B8] mt-0.5">
              Ranked by total user bookmarks, period save velocity, and category affinity
            </p>
          </div>

          <div className="text-xs text-[#5B6577] dark:text-[#9AA5B8]">
            Showing <span className="font-semibold text-[#131A2B] dark:text-[#F4F6F9]">{displayedTools.length}</span> of {tools.length} utilities
          </div>
        </div>

        {/* Filters Toolbar */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-1">
          {/* Search Box */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9AA5B8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tool by name or slug..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg bg-[#F4F6F9] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] text-[#131A2B] dark:text-[#F4F6F9] placeholder-[#9AA5B8] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
            />
          </div>

          {/* Category Dropdown */}
          <div className="sm:col-span-4">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full text-xs p-2 rounded-lg bg-[#F4F6F9] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] text-[#131A2B] dark:text-[#F4F6F9] focus:outline-none focus:ring-1 focus:ring-[#2563EB] cursor-pointer"
            >
              <option value="all">All Categories ({categories.length})</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          {/* Strategy Tier Dropdown */}
          <div className="sm:col-span-3">
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value)}
              className="w-full text-xs p-2 rounded-lg bg-[#F4F6F9] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] text-[#131A2B] dark:text-[#F4F6F9] focus:outline-none focus:ring-1 focus:ring-[#2563EB] cursor-pointer"
            >
              <option value="all">All Strategy Tiers</option>
              <option value="promote">Promote (High Affinity)</option>
              <option value="optimize">Optimize (Refresh UX)</option>
              <option value="maintain">Core (Steady)</option>
              <option value="monitor">Monitor (Growth potential)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-[#F4F6F9] dark:bg-[#131A2B] border-b border-[#E4E8EF] dark:border-[#1B233A] text-[#5B6577] dark:text-[#9AA5B8]">
              <th
                onClick={() => handleHeaderClick('rank')}
                className="py-3 px-4 font-semibold cursor-pointer hover:text-[#131A2B] dark:hover:text-[#F4F6F9] select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Rank</span>
                  {sortCol === 'rank' && (
                    <span className="text-[#2563EB]">{sortAsc ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th
                onClick={() => handleHeaderClick('name')}
                className="py-3 px-4 font-semibold cursor-pointer hover:text-[#131A2B] dark:hover:text-[#F4F6F9] select-none"
              >
                <div className="flex items-center gap-1.5">
                  <span>Tool</span>
                  {sortCol === 'name' && (
                    <span className="text-[#2563EB]">{sortAsc ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th
                onClick={() => handleHeaderClick('totalFavorites')}
                className="py-3 px-4 font-semibold cursor-pointer hover:text-[#131A2B] dark:hover:text-[#F4F6F9] select-none text-right"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Total Saves</span>
                  {sortCol === 'totalFavorites' && (
                    <span className="text-[#2563EB]">{sortAsc ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th
                onClick={() => handleHeaderClick('recentFavorites')}
                className="py-3 px-4 font-semibold cursor-pointer hover:text-[#131A2B] dark:hover:text-[#F4F6F9] select-none text-right hidden md:table-cell"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Period Adds</span>
                  {sortCol === 'recentFavorites' && (
                    <span className="text-[#2563EB]">{sortAsc ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th
                onClick={() => handleHeaderClick('favoriteRatePercent')}
                className="py-3 px-4 font-semibold cursor-pointer hover:text-[#131A2B] dark:hover:text-[#F4F6F9] select-none text-right hidden lg:table-cell"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Save Rate</span>
                  {sortCol === 'favoriteRatePercent' && (
                    <span className="text-[#2563EB]">{sortAsc ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th
                onClick={() => handleHeaderClick('growthPercent')}
                className="py-3 px-4 font-semibold cursor-pointer hover:text-[#131A2B] dark:hover:text-[#F4F6F9] select-none text-right"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span>Trend</span>
                  {sortCol === 'growthPercent' && (
                    <span className="text-[#2563EB]">{sortAsc ? '↑' : '↓'}</span>
                  )}
                </div>
              </th>
              <th className="py-3 px-4 font-semibold text-center hidden sm:table-cell">
                <span>Action Tier</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E4E8EF] dark:divide-[#1B233A]">
            {displayedTools.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[#5B6577] dark:text-[#9AA5B8]">
                  No utilities match your search filter criteria.
                </td>
              </tr>
            ) : (
              displayedTools.map((tool) => {
                const isSelected = selectedToolSlug === tool.slug;
                return (
                  <tr
                    key={tool.id}
                    onClick={() => onSelectTool(tool)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50/70 dark:bg-blue-950/30'
                        : 'hover:bg-[#F4F6F9] dark:hover:bg-[#131A2B]'
                    }`}
                  >
                    {/* Rank + rank change indicator */}
                    <td className="py-3.5 px-4 font-mono font-bold">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-6 h-6 rounded-md flex items-center justify-center text-xs ${
                            tool.rank <= 3
                              ? 'bg-[#FFFBEB] text-amber-900 dark:bg-[#1B233A] dark:text-amber-200'
                              : 'bg-[#F4F6F9] dark:bg-[#1B233A] text-[#5B6577] dark:text-[#9AA5B8]'
                          }`}
                        >
                          #{tool.rank}
                        </span>
                        {tool.rankChange > 0 ? (
                          <span className="inline-flex items-center text-[10px] text-[#16A34A] dark:text-[#16A34A] font-semibold">
                            <ArrowUp className="w-3 h-3" />
                            {tool.rankChange}
                          </span>
                        ) : tool.rankChange < 0 ? (
                          <span className="inline-flex items-center text-[10px] text-[#DC2626] font-semibold">
                            <ArrowDown className="w-3 h-3" />
                            {Math.abs(tool.rankChange)}
                          </span>
                        ) : (
                          <Minus className="w-3 h-3 text-[#9AA5B8]" />
                        )}
                      </div>
                    </td>

                    {/* Tool Name & Category */}
                    <td className="py-3.5 px-4">
                      <div>
                        <div className="font-semibold text-[#131A2B] dark:text-[#F4F6F9] flex items-center gap-1.5">
                          <span>{tool.name}</span>
                          {tool.isCustom && (
                            <span className="px-1.5 py-0.2 rounded bg-purple-50 text-purple-700 dark:bg-purple-950 dark:text-purple-300 text-[10px] font-mono">
                              custom
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#5B6577] dark:text-[#9AA5B8] flex items-center gap-2 mt-0.5">
                          <span>{tool.category}</span>
                          <span>•</span>
                          <span className="font-mono text-[10px]">
                            {tool.categorySharePercent}% of category
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Total Favorites */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="font-mono font-bold text-sm text-[#131A2B] dark:text-[#F4F6F9] flex items-center justify-end gap-1.5">
                        <Heart className="w-3.5 h-3.5 text-[#DC2626] fill-rose-500" />
                        <span>{tool.totalFavorites.toLocaleString()}</span>
                      </div>
                      <div className="text-[10px] text-[#5B6577] dark:text-[#9AA5B8]">
                        {tool.platformSharePercent}% platform
                      </div>
                    </td>

                    {/* Period Adds */}
                    <td className="py-3.5 px-4 text-right hidden md:table-cell">
                      <span className="font-mono text-xs font-semibold text-[#131A2B] dark:text-[#F4F6F9]">
                        +{tool.recentFavorites.toLocaleString()}
                      </span>
                    </td>

                    {/* Save Conversion Rate */}
                    <td className="py-3.5 px-4 text-right hidden lg:table-cell">
                      <span className="font-mono text-xs text-[#131A2B] dark:text-[#F4F6F9]">
                        {tool.favoriteRatePercent}%
                      </span>
                    </td>

                    {/* Growth Trend */}
                    <td className="py-3.5 px-4 text-right font-mono">
                      <span
                        className={`inline-flex items-center gap-0.5 text-xs font-semibold ${
                          tool.growthPercent >= 0
                            ? 'text-[#16A34A] dark:text-[#16A34A]'
                            : 'text-[#DC2626]'
                        }`}
                      >
                        {tool.growthPercent >= 0 ? '+' : ''}
                        {tool.growthPercent}%
                      </span>
                    </td>

                    {/* Action Recommendation Tier */}
                    <td className="py-3.5 px-4 text-center hidden sm:table-cell">
                      {getTierBadge(tool.actionRecommendation.tier)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
