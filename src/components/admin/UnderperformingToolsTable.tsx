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
      className="bg-[#FFFFFF] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-xl overflow-hidden shadow-2xs transition-colors"
    >
      {/* Table Header & Controls */}
      <div className="p-4 sm:p-5 border-b border-[#E2E8F0] dark:border-[#1E293B]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
              <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                Underperforming Tools
              </h3>
              <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/50">
                {filteredAndSorted.length} flagged for optimization
              </span>
            </div>
            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
              Utilities with lower conversion rate, below-average organic views, or high drop-off
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter underperforming..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#E2E8F0] dark:border-[#1E293B] bg-[#F8FAFC] dark:bg-[#131B2E] text-[#0F172A] dark:text-[#F8FAFC] focus:outline-hidden focus:border-[#2563EB]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sortable Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#F8FAFC] dark:bg-[#131B2E] border-b border-[#E2E8F0] dark:border-[#1E293B] text-[#64748B] dark:text-[#94A3B8] font-bold select-none">
              <th scope="col" className="py-3 px-4">
                <button
                  type="button"
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-1.5 font-bold hover:text-[#0F172A] dark:hover:text-[#F8FAFC] cursor-pointer"
                >
                  Tool & Diagnostic Bottleneck
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
                Recommended Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E2E8F0] dark:divide-[#1E293B]">
            {filteredAndSorted.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-[#64748B]">
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
                        ? 'bg-[#2563EB]/5 dark:bg-[#2563EB]/15'
                        : 'hover:bg-[#F8FAFC] dark:hover:bg-[#1E293B]/40'
                    }`}
                  >
                    {/* Tool & Diagnostic */}
                    <td className="py-3.5 px-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#0F172A] dark:text-[#F8FAFC] hover:text-[#2563EB] dark:hover:text-[#60A5FA]">
                            {tool.name}
                          </span>
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40">
                            Attention
                          </span>
                        </div>
                        <div className="mt-1 text-[11px] text-[#64748B] dark:text-[#94A3B8] max-w-md line-clamp-1">
                          {tool.diagnosticIssue || 'Conversion rate or views lower than average'}
                        </div>
                      </div>
                    </td>

                    {/* Total Views */}
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                      {tool.totalViews.toLocaleString()}
                    </td>

                    {/* Invocations */}
                    <td className="py-3.5 px-4 text-right font-mono text-[#0F172A] dark:text-[#F8FAFC]">
                      {tool.totalUses.toLocaleString()}
                    </td>

                    {/* Conversion */}
                    <td className="py-3.5 px-4 text-right font-mono">
                      <span className="inline-block px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                        {tool.conversionRate}%
                      </span>
                    </td>

                    {/* Avg Time */}
                    <td className="py-3.5 px-4 text-right font-mono text-[#64748B] dark:text-[#94A3B8]">
                      {formatDuration(tool.avgTimeOnPageSec)}
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

                    {/* Recommended Action */}
                    <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectTool(tool.slug)}
                          className="px-2.5 py-1 text-[11px] font-semibold rounded-md border border-[#E2E8F0] dark:border-[#1E293B] hover:border-[#2563EB] text-[#2563EB] dark:text-[#60A5FA] bg-[#FFFFFF] dark:bg-[#0F172A] cursor-pointer"
                        >
                          Deep Dive
                        </button>
                        <button
                          type="button"
                          onClick={() => navigate('/admin/tools')}
                          title="Manage in Tools Manager"
                          className="p-1 rounded text-[#64748B] hover:text-[#0F172A] dark:hover:text-[#F8FAFC] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] cursor-pointer"
                        >
                          <Wrench className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={`/tools/${tool.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Test Live Tool"
                          className="p-1 rounded text-[#64748B] hover:text-[#0F172A] dark:hover:text-[#F8FAFC] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B]"
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
