import { useState } from 'react';
import { useRouter } from '../../context/RouterContext';
import { CATEGORY_USAGE_DATA, TOP_TOOLS_USAGE_DATA } from '../../data/adminOverviewData';
import { ArrowUpRight } from 'lucide-react';

export function ToolUsageChart() {
  const { navigate } = useRouter();
  const [viewMode, setViewMode] = useState<'categories' | 'tools'>('categories');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const items = viewMode === 'categories'
    ? CATEGORY_USAGE_DATA.map((c) => ({ label: c.category, count: c.count, percentage: c.percentage }))
    : TOP_TOOLS_USAGE_DATA.map((t) => ({ label: t.name, count: t.count, percentage: t.percentage }));

  const maxCount = Math.max(...items.map((i) => i.count));

  return (
    <div
      id="tool-usage-chart-card"
      className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-4 sm:p-5 shadow-xs transition-colors h-full flex flex-col justify-between"
    >
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-heading font-bold text-[#1E1035]">
            Tool Usage Trend
          </h2>
          <p className="text-xs text-[#6D6582] mt-0.5">
            Breakdown of utility execution volume and popularity
          </p>
        </div>

        <div className="flex items-center p-0.5 rounded-lg bg-[#FAF9FE] border border-[#EDE9FE]">
          <button
            type="button"
            id="viewmode-categories-btn"
            onClick={() => setViewMode('categories')}
            className={`px-2.5 py-1 text-xs font-heading font-semibold rounded-md transition-colors cursor-pointer ${
              viewMode === 'categories'
                ? 'bg-[#7C3AED] text-[#FFFFFF] shadow-2xs'
                : 'text-[#6D6582] hover:text-[#1E1035]'
            }`}
          >
            By Category
          </button>
          <button
            type="button"
            id="viewmode-tools-btn"
            onClick={() => setViewMode('tools')}
            className={`px-2.5 py-1 text-xs font-heading font-semibold rounded-md transition-colors cursor-pointer ${
              viewMode === 'tools'
                ? 'bg-[#7C3AED] text-[#FFFFFF] shadow-2xs'
                : 'text-[#6D6582] hover:text-[#1E1035]'
            }`}
          >
            Top 5 Tools
          </button>
        </div>
      </div>

      {/* Bar Chart Presentation */}
      <div className="space-y-3.5">
        {items.map((item, index) => {
          const ratio = (item.count / maxCount) * 100;
          const isHovered = hoveredIndex === index;

          return (
            <div
              key={item.label}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              className="space-y-1 cursor-pointer"
            >
              <div className="flex items-center justify-between text-xs">
                <span
                  className={`font-medium transition-colors ${
                    isHovered
                      ? 'text-[#7C3AED] font-semibold'
                      : 'text-[#1E1035]'
                  }`}
                >
                  {item.label}
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-[#1E1035]">
                    {item.count.toLocaleString()} runs
                  </span>
                  <span className="text-[11px] text-[#6D6582] w-12 text-right">
                    {item.percentage}%
                  </span>
                </div>
              </div>

              {/* Progress Bar with mathematical nesting */}
              <div className="h-2.5 w-full bg-[#FAF9FE] border border-[#EDE9FE] rounded-full overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-300 ${
                    isHovered
                      ? 'bg-[#6D28D9]'
                      : 'bg-[#7C3AED]'
                  }`}
                  style={{ width: `${Math.max(ratio, 3)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info */}
      <div className="mt-5 pt-3.5 border-t border-[#EDE9FE] flex items-center justify-between text-[11px] text-[#6D6582]">
        <span>Aggregated client-side runs (30-day rolling window)</span>
        <button
          type="button"
          onClick={() => navigate('/admin/analytics')}
          className="font-heading font-semibold text-[#7C3AED] hover:underline flex items-center gap-1 cursor-pointer"
        >
          <span>Detailed Tool Analytics</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
