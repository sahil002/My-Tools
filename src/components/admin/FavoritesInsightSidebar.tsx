import React from 'react';
import { ToolFavoriteMetric, FavoritesCategoryBreakdown } from '../../services/favoritesAnalyticsService';
import {
  Heart,
  TrendingUp,
  Layers,
  Sparkles,
  ExternalLink,
  Target,
  ArrowRight,
  Bookmark,
  CheckCircle,
} from 'lucide-react';
import { Link } from '../../context/RouterContext';

interface FavoritesInsightSidebarProps {
  selectedTool: ToolFavoriteMetric | null;
  categoryBreakdown: FavoritesCategoryBreakdown[];
  totalPlatformFavorites: number;
}

export function FavoritesInsightSidebar({
  selectedTool,
  categoryBreakdown,
  totalPlatformFavorites,
}: FavoritesInsightSidebarProps) {
  return (
    <div className="space-y-6">
      {/* 1. Selected Tool Deep-Dive Card */}
      {selectedTool ? (
        <div
          id="tool-strategic-action-card"
          className="bg-[#FFFFFF] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] rounded-xl p-5 shadow-2xs space-y-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold text-[#5B6577] dark:text-[#9AA5B8] uppercase tracking-wider">
                Selected Tool Insight
              </div>
              <h3 className="text-base font-bold text-[#131A2B] dark:text-[#F4F6F9] mt-0.5">
                {selectedTool.name}
              </h3>
            </div>
            <span className="px-2 py-0.5 rounded bg-blue-50 text-[#2563EB] dark:bg-blue-950 dark:text-[#2563EB] font-mono text-xs font-bold shrink-0">
              Rank #{selectedTool.rank}
            </span>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-[#F4F6F9] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] text-xs">
            <div>
              <span className="text-[#5B6577] dark:text-[#9AA5B8] text-[11px]">Total Bookmarks</span>
              <div className="font-mono font-bold text-[#131A2B] dark:text-[#F4F6F9] mt-0.5 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-[#DC2626] fill-rose-500" />
                <span>{selectedTool.totalFavorites.toLocaleString()}</span>
              </div>
            </div>

            <div>
              <span className="text-[#5B6577] dark:text-[#9AA5B8] text-[11px]">Platform Share</span>
              <div className="font-mono font-bold text-[#131A2B] dark:text-[#F4F6F9] mt-0.5">
                {selectedTool.platformSharePercent}%
              </div>
            </div>

            <div>
              <span className="text-[#5B6577] dark:text-[#9AA5B8] text-[11px]">Category Share</span>
              <div className="font-mono font-bold text-[#131A2B] dark:text-[#F4F6F9] mt-0.5">
                {selectedTool.categorySharePercent}%
              </div>
            </div>

            <div>
              <span className="text-[#5B6577] dark:text-[#9AA5B8] text-[11px]">Bookmark Rate</span>
              <div className="font-mono font-bold text-[#131A2B] dark:text-[#F4F6F9] mt-0.5">
                {selectedTool.favoriteRatePercent}%
              </div>
            </div>
          </div>

          {/* Action Recommendation */}
          <div className="p-3.5 rounded-lg border border-blue-100 bg-blue-50/50 dark:border-blue-900/50 dark:bg-blue-950/20 text-xs space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-[#131A2B] dark:text-[#F4F6F9]">
              <Target className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>{selectedTool.actionRecommendation.headline}</span>
            </div>
            <p className="text-[11px] text-[#5B6577] dark:text-[#9AA5B8] leading-relaxed">
              {selectedTool.actionRecommendation.rationale}
            </p>
          </div>

          {/* Quick Links */}
          <div className="pt-1 flex items-center justify-between gap-2 text-xs">
            <Link
              href={`/tools/${selectedTool.slug}`}
              className="inline-flex items-center gap-1.5 text-[#2563EB] dark:text-[#2563EB] font-medium hover:underline"
            >
              <span>View Live Utility</span>
              <ExternalLink className="w-3 h-3" />
            </Link>

            <Link
              href={`/admin/analytics?tool=${selectedTool.slug}`}
              className="text-[#5B6577] dark:text-[#9AA5B8] hover:text-[#131A2B] dark:hover:text-[#F4F6F9] transition-colors"
            >
              Detailed Analytics →
            </Link>
          </div>
        </div>
      ) : (
        <div className="bg-[#FFFFFF] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] rounded-xl p-6 text-center text-xs text-[#5B6577] dark:text-[#9AA5B8]">
          Click any tool in the table to inspect detailed bookmark analytics and action recommendations.
        </div>
      )}

      {/* 2. Category Affinity Breakdown */}
      <div
        id="favorites-category-breakdown-card"
        className="bg-[#FFFFFF] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] rounded-xl p-5 shadow-2xs space-y-4"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#2563EB]" />
            <h3 className="text-sm font-bold text-[#131A2B] dark:text-[#F4F6F9]">
              Favorites by Category
            </h3>
          </div>
          <span className="text-[11px] font-mono text-[#5B6577] dark:text-[#9AA5B8]">
            {totalPlatformFavorites.toLocaleString()} total
          </span>
        </div>
        <p className="text-xs text-[#5B6577] dark:text-[#9AA5B8]">
          Distribution of user bookmarks across directory categories
        </p>

        <div className="space-y-3 pt-1">
          {categoryBreakdown.map((cat) => (
            <div key={cat.category} className="text-xs space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold text-[#131A2B] dark:text-[#F4F6F9] capitalize">
                  {cat.category}
                </span>
                <span className="font-mono text-[#5B6577] dark:text-[#9AA5B8]">
                  {cat.favoritesCount.toLocaleString()} ({cat.sharePercent}%)
                </span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1.5 rounded-full bg-[#E4E8EF] dark:bg-[#1B233A] overflow-hidden">
                <div
                  className="h-full rounded-full bg-[#2563EB] dark:bg-[#2563EB]"
                  style={{ width: `${Math.min(100, cat.sharePercent)}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[10px] text-[#5B6577] dark:text-[#9AA5B8]">
                <span>{cat.toolsCount} {cat.toolsCount === 1 ? 'tool' : 'tools'}</span>
                <span>Top: {cat.topToolName}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Product Strategy Guidance Box */}
      <div className="p-4 rounded-xl bg-[#F4F6F9] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] text-xs text-[#5B6577] dark:text-[#9AA5B8] space-y-2">
        <div className="flex items-center gap-1.5 font-semibold text-[#131A2B] dark:text-[#F4F6F9]">
          <Bookmark className="w-3.5 h-3.5 text-[#2563EB]" />
          <span>Strategic Value of Bookmarks</span>
        </div>
        <p className="leading-relaxed text-[11px]">
          Users who save tools to their browser favorites or account bookmarks demonstrate 4.8x higher 30-day retention and generate 62% of repeat sessions. High-favorite tools should be prioritized for performance optimization and desktop shortcuts.
        </p>
      </div>
    </div>
  );
}
