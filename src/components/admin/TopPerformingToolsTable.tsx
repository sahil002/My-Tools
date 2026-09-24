import React, { useState, useMemo } from 'react';
import { ToolAnalyticsRecord, formatDuration } from '../../services/toolAnalyticsService';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Eye,
  MousePointerClick,
  Clock,
  Heart,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Search,
} from 'lucide-react';

interface TopPerformingToolsTableProps {
  tools: ToolAnalyticsRecord[];
  selectedSlug: string;
  onSelectTool: (slug: string) => void;
}

type SortField = 'totalViews' | 'totalUses' | 'conversionRate' | 'avgTimeOnPageSec' | 'favoriteCount' | 'growthRatePercent' | 'name';
type SortOrder = 'asc' | 'desc';

export function TopPerformingToolsTable({
  tools,
  selectedSlug,
  onSelectTool,
}: TopPerformingToolsTableProps) {
  const [sortField, setSortField] = useState<SortField>('totalViews');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const categories = useMemo(() => {
    const set = new Set(tools.map((t) => t.category));
    return Array.from(set);
  }, [tools]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const filteredAndSortedTools = useMemo(() => {
    return tools
      .filter((t) => {
        const matchesSearch =
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.slug.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = categoryFilter === 'all' || t.category === categoryFilter;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];

        if (typeof valA === 'string') {
          return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }

        return sortOrder === 'asc' ? valA - valB : valB - valA;
      });
  }, [tools, searchQuery, categoryFilter, sortField, sortOrder]);

  return (
    <div
      id="top-performing-tools-section"
      className="bg-[#FFFFFF] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-xl overflow-hidden shadow-2xs transition-colors"
    >
      {/* Table Header & Controls */}
      <div className="p-4 sm:p-5 border-b border-[#E2E8F0] dark:border-[#1E293B]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                Top Performing Tools
              </h3>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-[#F1F5F9] dark:bg-[#1E293B] text-[#64748B] dark:text-[#94A3B8]">
                {filteredAndSortedTools.length} utilities
              </span>
            </div>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
              Ranked by total page views, invocation frequency, and user engagement
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[180px]">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tools..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#E2E8F0] dark:border-[#1E293B] bg-[#F8FAFC] dark:bg-[#131B2E] text-[#0F172A] dark:text-[#F8FAFC] focus:outline-hidden focus:border-[#2563EB]"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="py-1.5 px-2.5 text-xs rounded-lg border border-[#E2E8F0] dark:border-[#1E293B] bg-[#F8FAFC] dark:bg-[#131B2E] text-[#0F172A] dark:text-[#F8FAFC] focus:outline-hidden focus:border-[#2563EB]"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Sortable Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#F8FAFC] dark:bg-[#131B2E] border-b border-[#E2E8F0] dark:border-[#1E293B] text-[#64748B] dark:text-[#94A3B8] font-bold select-none">
              <th scope="col" className="py-3 px-4 font-mono text-[11px] w-12 text-center">
                #
              </th>
              <th scope="col" className="py-3 px-4">
                <button
                  type="button"
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-1.5 font-bold hover:text-[#0F172A] dark:hover:text-[#F8FAFC] cursor-pointer"
                >
                  Tool Name & Category
                  {sortField === 'name' ? (
                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#2563EB]" /> : <ArrowDown className="w-3 h-3 text-[#2563EB]" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-40" />
                  )}
                </button>
              </th>
              <th scope="col" className="py-3 px-4 text-right">
                <button
                  type="button"
                  onClick={() => handleSort('totalViews')}
                  className="flex items-center gap-1.5 font-bold ml-auto hover:text-[#0F172A] dark:hover:text-[#F8FAFC] cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-[#2563EB]" />
                  Views
                  {sortField === 'totalViews' ? (
                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#2563EB]" /> : <ArrowDown className="w-3 h-3 text-[#2563EB]" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-40" />
                  )}
                </button>
              </th>
              <th scope="col" className="py-3 px-4 text-right">
                <button
                  type="button"
                  onClick={() => handleSort('totalUses')}
                  className="flex items-center gap-1.5 font-bold ml-auto hover:text-[#0F172A] dark:hover:text-[#F8FAFC] cursor-pointer"
                >
                  <MousePointerClick className="w-3.5 h-3.5 text-[#64748B]" />
                  Uses / Clicks
                  {sortField === 'totalUses' ? (
                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#2563EB]" /> : <ArrowDown className="w-3 h-3 text-[#2563EB]" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-40" />
                  )}
                </button>
              </th>
              <th scope="col" className="py-3 px-4 text-right">
                <button
                  type="button"
                  onClick={() => handleSort('conversionRate')}
                  className="flex items-center gap-1.5 font-bold ml-auto hover:text-[#0F172A] dark:hover:text-[#F8FAFC] cursor-pointer"
                >
                  Conversion
                  {sortField === 'conversionRate' ? (
                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#2563EB]" /> : <ArrowDown className="w-3 h-3 text-[#2563EB]" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-40" />
                  )}
                </button>
              </th>
              <th scope="col" className="py-3 px-4 text-right">
                <button
                  type="button"
                  onClick={() => handleSort('avgTimeOnPageSec')}
                  className="flex items-center gap-1.5 font-bold ml-auto hover:text-[#0F172A] dark:hover:text-[#F8FAFC] cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5" />
                  Avg Time
                  {sortField === 'avgTimeOnPageSec' ? (
                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#2563EB]" /> : <ArrowDown className="w-3 h-3 text-[#2563EB]" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-40" />
                  )}
                </button>
              </th>
              <th scope="col" className="py-3 px-4 text-right">
                <button
                  type="button"
                  onClick={() => handleSort('favoriteCount')}
                  className="flex items-center gap-1.5 font-bold ml-auto hover:text-[#0F172A] dark:hover:text-[#F8FAFC] cursor-pointer"
                >
                  <Heart className="w-3.5 h-3.5 text-rose-500" />
                  Favorites
                  {sortField === 'favoriteCount' ? (
                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#2563EB]" /> : <ArrowDown className="w-3 h-3 text-[#2563EB]" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-40" />
                  )}
                </button>
              </th>
              <th scope="col" className="py-3 px-4 text-right">
                <button
                  type="button"
                  onClick={() => handleSort('growthRatePercent')}
                  className="flex items-center gap-1.5 font-bold ml-auto hover:text-[#0F172A] dark:hover:text-[#F8FAFC] cursor-pointer"
                >
                  Trend
                  {sortField === 'growthRatePercent' ? (
                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#2563EB]" /> : <ArrowDown className="w-3 h-3 text-[#2563EB]" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-40" />
                  )}
                </button>
              </th>
              <th scope="col" className="py-3 px-4 text-right font-medium">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#1E293B]">
            {filteredAndSortedTools.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-[#64748B]">
                  No matching tools found.
                </td>
              </tr>
            ) : (
              filteredAndSortedTools.map((tool, index) => {
                const isSelected = selectedSlug === tool.slug;

                return (
                  <tr
                    key={tool.id}
                    onClick={() => onSelectTool(tool.slug)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-[#2563EB]/5 dark:bg-[#2563EB]/15'
                        : 'hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B]/40'
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-[#64748B] dark:text-[#94A3B8]">
                      {index + 1}
                    </td>

                    {/* Name & Category */}
                    <td className="py-3.5 px-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#0F172A] dark:text-[#F8FAFC] hover:text-[#2563EB] dark:hover:text-[#60A5FA] transition-colors">
                            {tool.name}
                          </span>
                          {tool.isCustom && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 rounded border border-blue-200 dark:border-blue-800">
                              Custom
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                          <span className="capitalize">{tool.category.replace('-', ' ')}</span>
                          <span>•</span>
                          <span className="font-mono">/tools/{tool.slug}</span>
                        </div>
                      </div>
                    </td>

                    {/* Total Views */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                      {tool.totalViews.toLocaleString()}
                    </td>

                    {/* Uses / Invocations */}
                    <td className="py-3.5 px-4 text-right font-mono text-[#0F172A] dark:text-[#F8FAFC]">
                      {tool.totalUses.toLocaleString()}
                    </td>

                    {/* Conversion Rate */}
                    <td className="py-3.5 px-4 text-right font-mono">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-semibold text-[11px] ${
                          tool.conversionRate >= 80
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : tool.conversionRate >= 65
                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {tool.conversionRate}%
                      </span>
                    </td>

                    {/* Avg Time on Page */}
                    <td className="py-3.5 px-4 text-right font-mono text-[#64748B] dark:text-[#94A3B8]">
                      {formatDuration(tool.avgTimeOnPageSec)}
                    </td>

                    {/* Favorite Count */}
                    <td className="py-3.5 px-4 text-right font-mono text-[#0F172A] dark:text-[#F8FAFC]">
                      {tool.favoriteCount.toLocaleString()}
                    </td>

                    {/* Trend % */}
                    <td className="py-3.5 px-4 text-right font-mono text-[11px]">
                      <span
                        className={
                          tool.growthRatePercent >= 0
                            ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                            : 'text-rose-600 dark:text-rose-400 font-semibold'
                        }
                      >
                        {tool.growthRatePercent >= 0 ? `+${tool.growthRatePercent}%` : `${tool.growthRatePercent}%`}
                      </span>
                    </td>

                    {/* Quick Link */}
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectTool(tool.slug)}
                          title="Inspect Trend Graph"
                          className="p-1 rounded text-[#64748B] hover:text-[#2563EB] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <a
                          href={`/tools/${tool.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open Live Tool"
                          className="p-1 rounded text-[#64748B] hover:text-[#2563EB] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B]"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
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
