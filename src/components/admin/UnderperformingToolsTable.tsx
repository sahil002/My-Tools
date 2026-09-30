import React, { useState, useMemo } from 'react';
import { ToolAnalyticsRecord, formatDuration } from '../../services/toolAnalyticsService';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  Eye,
  MousePointerClick,
  Clock,
  ExternalLink,
  ChevronRight,
  Sparkles,
  HelpCircle,
  Wrench,
  Search,
} from 'lucide-react';
import { useRouter } from '../../context/RouterContext';

interface UnderperformingToolsTableProps {
  tools: ToolAnalyticsRecord[];
  selectedSlug: string;
  onSelectTool: (slug: string) => void;
}

type SortField = 'totalViews' | 'totalUses' | 'conversionRate' | 'avgTimeOnPageSec' | 'growthRatePercent' | 'name';
type SortOrder = 'asc' | 'desc';

export function UnderperformingToolsTable({
  tools,
  selectedSlug,
  onSelectTool,
}: UnderperformingToolsTableProps) {
  const { navigate } = useRouter();
  const [sortField, setSortField] = useState<SortField>('totalViews');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [searchQuery, setSearchQuery] = useState('');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const underperformingList = useMemo(() => {
    // Either categorized as underperforming or bottom quartile in views/conversion
    return tools.filter((t) => t.performanceTier === 'underperforming' || t.totalViews < 12000 || t.conversionRate < 65);
  }, [tools]);

  const filteredAndSorted = useMemo(() => {
    return underperformingList
      .filter((t) => {
        return (
          t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (t.diagnosticIssue && t.diagnosticIssue.toLowerCase().includes(searchQuery.toLowerCase()))
        );
      })
      .sort((a, b) => {
        let valA: any = a[sortField];
        let valB: any = b[sortField];

        if (typeof valA === 'string') {
          return sortOrder === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }

        return sortOrder === 'asc' ? valA - valB : valB - valA;
      });
  }, [underperformingList, searchQuery, sortField, sortOrder]);

  return (
    <div
      id="underperforming-tools-section"
      className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl overflow-hidden shadow-2xs transition-colors font-sans"
    >
      {/* Table Header & Controls */}
      <div className="p-4 sm:p-5 border-b border-[#EDE9FE]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
              <h3 className="text-sm font-heading font-bold text-[#1E1035]">
                Underperforming Tools
              </h3>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                {filteredAndSorted.length} flagged for optimization
              </span>
            </div>
            <p className="text-xs text-[#6D6582] mt-0.5">
              Utilities with lower conversion rate, below-average organic views, or high drop-off
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9D95B3]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter underperforming..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-[#EDE9FE] bg-[#FAF9FE] text-[#1E1035] focus:outline-hidden focus:border-[#7C3AED] focus:bg-white transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sortable Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#FAF9FE] border-b border-[#EDE9FE] text-[#6D6582] font-heading uppercase text-[10px] tracking-wider select-none">
              <th scope="col" className="py-3 px-4">
                <button
                  type="button"
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-1.5 font-bold hover:text-[#7C3AED] cursor-pointer"
                >
                  Tool & Diagnostic Bottleneck
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
                  Conversion Rate
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
                  Avg Duration
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
                  onClick={() => handleSort('growthRatePercent')}
                  className="flex items-center gap-1.5 font-bold ml-auto hover:text-[#7C3AED] cursor-pointer"
                >
                  7D Trend
                  {sortField === 'growthRatePercent' ? (
                    sortOrder === 'asc' ? <ArrowUp className="w-3 h-3 text-[#7C3AED]" /> : <ArrowDown className="w-3 h-3 text-[#7C3AED]" />
                  ) : (
                    <ArrowUpDown className="w-3 h-3 opacity-40" />
                  )}
                </button>
              </th>
              <th scope="col" className="py-3 px-4 text-right font-medium">
                Recommended Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#EDE9FE]">
            {filteredAndSorted.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[#6D6582]">
                  No underperforming tools detected. All utilities meet healthy engagement baselines.
                </td>
              </tr>
            ) : (
              filteredAndSorted.map((tool) => {
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
                    {/* Tool & Diagnostic */}
                    <td className="py-3.5 px-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-heading font-bold text-[#1E1035] hover:text-[#7C3AED] transition-colors">
                            {tool.name}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-50 text-amber-800 border border-amber-200">
                            Attention
                          </span>
                        </div>
                        <div className="mt-1 text-[11px] text-[#6D6582] max-w-md line-clamp-1">
                          {tool.diagnosticIssue || 'Conversion rate or views lower than average'}
                        </div>
                      </div>
                    </td>

                    {/* Total Views */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-[#1E1035]">
                      {tool.totalViews.toLocaleString()}
                    </td>

                    {/* Invocations */}
                    <td className="py-3.5 px-4 text-right font-mono text-[#1E1035]">
                      {tool.totalUses.toLocaleString()}
                    </td>

                    {/* Conversion */}
                    <td className="py-3.5 px-4 text-right font-mono">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                        {tool.conversionRate}%
                      </span>
                    </td>

                    {/* Avg Time */}
                    <td className="py-3.5 px-4 text-right font-mono text-[#6D6582]">
                      {formatDuration(tool.avgTimeOnPageSec)}
                    </td>

                    {/* Trend % with Down Accent Badge */}
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

                    {/* Recommended Action */}
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectTool(tool.slug)}
                          className="px-2.5 py-1 text-[11px] font-heading font-semibold rounded-lg border border-[#DDD6FE] hover:border-[#7C3AED] text-[#7C3AED] bg-white hover:bg-[#F5F3FF] cursor-pointer shadow-2xs transition-colors"
                        >
                          Deep Dive
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate('/admin/tools')}
                          title="Manage in Tools Manager"
                          className="p-1 rounded-lg text-[#6D6582] hover:text-[#7C3AED] hover:bg-[#F5F3FF] cursor-pointer transition-colors"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={`/${tool.category}/${tool.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Test Live Tool"
                          className="p-1 rounded-lg text-[#6D6582] hover:text-[#7C3AED] hover:bg-[#F5F3FF] transition-colors"
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
