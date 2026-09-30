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
      className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl overflow-hidden shadow-2xs transition-colors font-sans"
    >
      {/* Table Header & Controls */}
      <div className="p-4 sm:p-5 border-b border-[#EDE9FE]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <h3 className="text-sm font-heading font-bold text-[#1E1035]">
                Top Performing Tools
              </h3>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-[#FAF9FE] text-[#7C3AED] border border-[#DDD6FE]">
                {filteredAndSortedTools.length} utilities
              </span>
            </div>
            <p className="text-xs text-[#6D6582] mt-0.5">
              Ranked by total page views, invocation frequency, and user engagement
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[180px]">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9D95B3]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tools..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[#EDE9FE] bg-[#FAF9FE] text-[#1E1035] focus:outline-hidden focus:border-[#7C3AED] focus:bg-white transition-colors"
              />
            </div>

            {/* Category Filter */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="py-1.5 px-2.5 text-xs rounded-xl border border-[#EDE9FE] bg-[#FAF9FE] text-[#1E1035] focus:outline-hidden focus:border-[#7C3AED] cursor-pointer"
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
            <tr className="bg-[#FAF9FE] border-b border-[#EDE9FE] text-[#6D6582] font-heading uppercase text-[10px] tracking-wider select-none">
              <th scope="col" className="py-3 px-4 font-mono text-[11px] w-12 text-center">
                #
              </th>
              <th scope="col" className="py-3 px-4">
                <button
                  type="button"
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-1.5 font-bold hover:text-[#7C3AED] cursor-pointer"
                >
                  Tool Name & Category
                  {sortField === 'name' ? (
                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#7C3AED]" /> : <ArrowDown className="w-3 h-3 text-[#7C3AED]" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-40" />
                  )}
                </button>
              </th>
              <th scope="col" className="py-3 px-4 text-right">
                <button
                  type="button"
                  onClick={() => handleSort('totalViews')}
                  className="flex items-center gap-1.5 font-bold ml-auto hover:text-[#7C3AED] cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-[#7C3AED]" />
                  Views
                  {sortField === 'totalViews' ? (
                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#7C3AED]" /> : <ArrowDown className="w-3 h-3 text-[#7C3AED]" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-40" />
                  )}
                </button>
              </th>
              <th scope="col" className="py-3 px-4 text-right">
                <button
                  type="button"
                  onClick={() => handleSort('totalUses')}
                  className="flex items-center gap-1.5 font-bold ml-auto hover:text-[#7C3AED] cursor-pointer"
                >
                  <MousePointerClick className="w-3.5 h-3.5 text-[#6D6582]" />
                  Uses / Clicks
                  {sortField === 'totalUses' ? (
                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#7C3AED]" /> : <ArrowDown className="w-3 h-3 text-[#7C3AED]" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-40" />
                  )}
                </button>
              </th>
              <th scope="col" className="py-3 px-4 text-right">
                <button
                  type="button"
                  onClick={() => handleSort('conversionRate')}
                  className="flex items-center gap-1.5 font-bold ml-auto hover:text-[#7C3AED] cursor-pointer"
                >
                  Conversion
                  {sortField === 'conversionRate' ? (
                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#7C3AED]" /> : <ArrowDown className="w-3 h-3 text-[#7C3AED]" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-40" />
                  )}
                </button>
              </th>
              <th scope="col" className="py-3 px-4 text-right">
                <button
                  type="button"
                  onClick={() => handleSort('avgTimeOnPageSec')}
                  className="flex items-center gap-1.5 font-bold ml-auto hover:text-[#7C3AED] cursor-pointer"
                >
                  <Clock className="w-3.5 h-3.5 text-[#7C3AED]" />
                  Avg Time
                  {sortField === 'avgTimeOnPageSec' ? (
                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#7C3AED]" /> : <ArrowDown className="w-3 h-3 text-[#7C3AED]" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-40" />
                  )}
                </button>
              </th>
              <th scope="col" className="py-3 px-4 text-right">
                <button
                  type="button"
                  onClick={() => handleSort('favoriteCount')}
                  className="flex items-center gap-1.5 font-bold ml-auto hover:text-[#7C3AED] cursor-pointer"
                >
                  <Heart className="w-3.5 h-3.5 text-rose-500" />
                  Favorites
                  {sortField === 'favoriteCount' ? (
                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#7C3AED]" /> : <ArrowDown className="w-3 h-3 text-[#7C3AED]" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-40" />
                  )}
                </button>
              </th>
              <th scope="col" className="py-3 px-4 text-right">
                <button
                  type="button"
                  onClick={() => handleSort('growthRatePercent')}
                  className="flex items-center gap-1.5 font-bold ml-auto hover:text-[#7C3AED] cursor-pointer"
                >
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
                  Trend
                  {sortField === 'growthRatePercent' ? (
                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#7C3AED]" /> : <ArrowDown className="w-3 h-3 text-[#7C3AED]" />
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
          <tbody className="divide-y divide-[#EDE9FE]">
            {filteredAndSortedTools.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-[#6D6582]">
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
                        ? 'bg-[#F5F3FF]'
                        : 'hover:bg-[#FAF9FE]'
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-[#6D6582]">
                      {index + 1}
                    </td>

                    {/* Name & Category */}
                    <td className="py-3.5 px-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-heading font-bold text-[#1E1035] hover:text-[#7C3AED] transition-colors">
                            {tool.name}
                          </span>
                          {tool.isCustom && (
                            <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#F5F3FF] text-[#7C3AED] rounded border border-[#DDD6FE]">
                              Custom
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#6D6582]">
                          <span className="capitalize">{tool.category.replace('-', ' ')}</span>
                          <span>•</span>
                          <span className="font-mono">/tools/{tool.slug}</span>
                        </div>
                      </div>
                    </td>

                    {/* Total Views */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-[#1E1035]">
                      {tool.totalViews.toLocaleString()}
                    </td>

                    {/* Uses / Invocations */}
                    <td className="py-3.5 px-4 text-right font-mono text-[#1E1035]">
                      {tool.totalUses.toLocaleString()}
                    </td>

                    {/* Conversion Rate */}
                    <td className="py-3.5 px-4 text-right font-mono">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full font-semibold text-[11px] border ${
                          tool.conversionRate >= 80
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : tool.conversionRate >= 65
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-[#FAF9FE] text-[#6D6582] border-[#EDE9FE]'
                        }`}
                      >
                        {tool.conversionRate}%
                      </span>
                    </td>

                    {/* Avg Time on Page */}
                    <td className="py-3.5 px-4 text-right font-mono text-[#6D6582]">
                      {formatDuration(tool.avgTimeOnPageSec)}
                    </td>

                    {/* Favorite Count */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-[#7C3AED]">
                      {tool.favoriteCount.toLocaleString()}
                    </td>

                    {/* Trend % with Up / Down Accent Badges */}
                    <td className="py-3.5 px-4 text-right font-mono text-[11px]">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[11px] font-semibold ${
                          tool.growthRatePercent >= 0
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                            : 'text-rose-700 bg-rose-50 border-rose-200'
                        }`}
                      >
                        {tool.growthRatePercent >= 0 ? (
                          <>
                            <ArrowUp className="w-3 h-3 text-emerald-600" />
                            <span>+{tool.growthRatePercent}%</span>
                          </>
                        ) : (
                          <>
                            <ArrowDown className="w-3 h-3 text-rose-600" />
                            <span>{tool.growthRatePercent}%</span>
                          </>
                        )}
                      </span>
                    </td>

                    {/* Quick Link */}
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectTool(tool.slug)}
                          title="Inspect Trend Graph"
                          className="p-1 rounded text-[#6D6582] hover:text-[#7C3AED] hover:bg-[#F5F3FF] cursor-pointer"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                        <a
                          href={`/${tool.category}/${tool.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open Live Tool"
                          className="p-1 rounded text-[#6D6582] hover:text-[#7C3AED] hover:bg-[#F5F3FF]"
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
