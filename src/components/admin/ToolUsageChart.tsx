import { useState, useEffect } from 'react';
import { useRouter } from '../../context/RouterContext';
import { getAllCategoriesFromStorage } from '../../services/categoryStorageDB';
import { getAllDBCustomTools, DBToolRecord } from '../../services/toolStorageDB';
import { ArrowUpRight, BarChart2 } from 'lucide-react';

interface ChartItem {
  label: string;
  count: number;
  percentage: number;
}

export function ToolUsageChart() {
  const { navigate } = useRouter();
  const [viewMode, setViewMode] = useState<'categories' | 'tools'>('categories');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [categoryItems, setCategoryItems] = useState<ChartItem[]>([]);
  const [toolItems, setToolItems] = useState<ChartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    getAllDBCustomTools().then((customTools) => {
      if (!isMounted) return;
      const categories = getAllCategoriesFromStorage();

      // Read real live views map
      let liveViews: Record<string, number> = {};
      try {
        const raw = localStorage.getItem('ot_analytics_live_views');
        if (raw) liveViews = JSON.parse(raw);
      } catch {
        // ignore
      }

      // 1. Compute Category Breakdown
      const catCountMap: Record<string, number> = {};
      for (const t of customTools) {
        catCountMap[t.category] = (catCountMap[t.category] || 0) + 1;
      }
      const totalToolsCount = Math.max(customTools.length, 1);
      const catList: ChartItem[] = categories.map((c) => {
        const count = catCountMap[c.slug] || catCountMap[c.id] || 0;
        const percentage = Number(((count / totalToolsCount) * 100).toFixed(1));
        return {
          label: c.name,
          count,
          percentage,
        };
      }).filter((c) => c.count > 0);

      // 2. Compute Top Tools by views
      const toolList: ChartItem[] = customTools.map((t) => {
        const views = (t.performance?.views || 0) + (liveViews[t.slug] || 0);
        return {
          label: t.name,
          count: views,
          percentage: 0,
        };
      });

      const totalViews = Math.max(toolList.reduce((acc, t) => acc + t.count, 0), 1);
      const topTools = toolList.map((t) => ({
        ...t,
        percentage: Number(((t.count / totalViews) * 100).toFixed(1)),
      })).slice(0, 5);

      setCategoryItems(catList);
      setToolItems(topTools);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const items = viewMode === 'categories' ? categoryItems : toolItems;
  const maxCount = Math.max(...items.map((i) => i.count), 1);

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
            Breakdown of utility distribution and popularity
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
            Top Tools
          </button>
        </div>
      </div>

      {/* Bar Chart Presentation */}
      <div className="space-y-3.5 my-auto">
        {isLoading ? (
          <div className="py-8 text-center text-xs text-[#6D6582]">
            Loading real distribution data...
          </div>
        ) : items.length === 0 ? (
          <div className="py-8 text-center text-xs text-[#6D6582] space-y-1">
            <BarChart2 className="w-6 h-6 mx-auto text-[#9D95B3]" />
            <p className="font-heading font-semibold text-[#1E1035]">No usage data yet</p>
            <p className="text-[11px] text-[#9D95B3]">
              {viewMode === 'categories' ? 'Create categories in Categories Manager.' : 'Upload tools to view real metrics.'}
            </p>
          </div>
        ) : (
          items.map((item, index) => {
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
                      {item.count.toLocaleString()} {viewMode === 'categories' ? 'tools' : 'views'}
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
                    style={{ width: `${Math.max(ratio, 4)}%` }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-5 pt-3.5 border-t border-[#EDE9FE] flex items-center justify-between text-[11px] text-[#6D6582]">
        <span>Aggregated real activity (Live rolling window)</span>
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
