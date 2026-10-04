import React, { useState } from 'react';

export interface ChartDataPoint {
  label: string;
  value: number;
  value2?: number; // Optional second series for comparisons
  color?: string;
}

export type ChartType = 'bar' | 'horizontalBar' | 'line' | 'area' | 'donut' | 'comparison';

export interface ChartConfig {
  id: string;
  type: ChartType;
  title: string;
  subtitle?: string;
  unitPrefix?: string; // e.g. '$'
  unitSuffix?: string; // e.g. '%', 'years', 'k'
  series1Name?: string;
  series2Name?: string;
  colorTheme?: 'purple' | 'emerald' | 'blue' | 'amber';
  data: ChartDataPoint[];
}

export const CHART_THEMES = {
  purple: {
    primary: '#7C3AED',
    primaryLight: '#DDD6FE',
    primaryGradient: ['#7C3AED', '#A78BFA'],
    secondary: '#EC4899',
    secondaryGradient: ['#EC4899', '#F472B6'],
    fillBg: 'rgba(124, 58, 237, 0.08)',
  },
  emerald: {
    primary: '#059669',
    primaryLight: '#A7F3D0',
    primaryGradient: ['#059669', '#34D399'],
    secondary: '#0284C7',
    secondaryGradient: ['#0284C7', '#38BDF8'],
    fillBg: 'rgba(5, 150, 105, 0.08)',
  },
  blue: {
    primary: '#2563EB',
    primaryLight: '#BFDBFE',
    primaryGradient: ['#2563EB', '#60A5FA'],
    secondary: '#8B5CF6',
    secondaryGradient: ['#8B5CF6', '#C084FC'],
    fillBg: 'rgba(37, 99, 235, 0.08)',
  },
  amber: {
    primary: '#D97706',
    primaryLight: '#FDE68A',
    primaryGradient: ['#D97706', '#FBBF24'],
    secondary: '#EA580C',
    secondaryGradient: ['#EA580C', '#FB923C'],
    fillBg: 'rgba(217, 119, 6, 0.08)',
  },
};

export const CHART_PRESETS: { name: string; description: string; config: ChartConfig }[] = [
  {
    name: 'Compound Interest vs Simple Interest',
    description: 'Finance comparison over 5, 10, 15, 20, 25 years ($10k @ 8%)',
    config: {
      id: 'compound-vs-simple',
      type: 'comparison',
      title: 'Compound Interest vs. Simple Interest Growth',
      subtitle: '$10,000 Initial Deposit at 8% Annual Return',
      unitPrefix: '$',
      unitSuffix: '',
      series1Name: 'Compound Interest',
      series2Name: 'Simple Interest',
      colorTheme: 'purple',
      data: [
        { label: 'Year 5', value: 14693, value2: 14000 },
        { label: 'Year 10', value: 21589, value2: 18000 },
        { label: 'Year 15', value: 31722, value2: 22000 },
        { label: 'Year 20', value: 46610, value2: 26000 },
        { label: 'Year 25', value: 68485, value2: 30000 },
      ],
    },
  },
  {
    name: '50 / 30 / 20 Budget Allocation',
    description: 'Classic personal finance rule: Needs, Wants, Savings',
    config: {
      id: 'budget-50-30-20',
      type: 'donut',
      title: '50/30/20 Monthly Budget Allocation Breakdown',
      subtitle: 'Standard Financial Wellness Guideline',
      unitPrefix: '',
      unitSuffix: '%',
      colorTheme: 'purple',
      data: [
        { label: 'Essential Needs (Rent, Utilities, Food)', value: 50, color: '#7C3AED' },
        { label: 'Flexible Wants (Dining, Shopping)', value: 30, color: '#06B6D4' },
        { label: 'Savings & Investments (Debt payoff)', value: 20, color: '#10B981' },
      ],
    },
  },
  {
    name: 'Percentage Increase & Margin Trends',
    description: 'Quarterly financial performance & profit margin',
    config: {
      id: 'quarterly-margin-growth',
      type: 'bar',
      title: 'Quarterly Operating Margin Growth',
      subtitle: 'Calculated Percentage Return Over Past 5 Quarters',
      unitPrefix: '',
      unitSuffix: '%',
      series1Name: 'Operating Margin',
      colorTheme: 'emerald',
      data: [
        { label: 'Q1', value: 14.2 },
        { label: 'Q2', value: 18.5 },
        { label: 'Q3', value: 22.8 },
        { label: 'Q4', value: 26.4 },
        { label: 'Q1 (Est)', value: 31.0 },
      ],
    },
  },
  {
    name: 'Asset Allocation Breakdown',
    description: 'Horizontal bar comparison across asset categories',
    config: {
      id: 'portfolio-allocation',
      type: 'horizontalBar',
      title: 'Balanced Investment Portfolio Allocation',
      subtitle: 'Target Distribution Across Asset Classes',
      unitPrefix: '',
      unitSuffix: '%',
      series1Name: 'Allocation',
      colorTheme: 'blue',
      data: [
        { label: 'US Equities (S&P 500 Index)', value: 45 },
        { label: 'International Equities', value: 20 },
        { label: 'Treasuries & Fixed Income', value: 20 },
        { label: 'Real Estate & REITs', value: 10 },
        { label: 'Cash & Short-Term Reserves', value: 5 },
      ],
    },
  },
];

interface InteractiveFinanceChartProps {
  config: ChartConfig;
  onEdit?: () => void;
  isEditable?: boolean;
}

export function InteractiveFinanceChart({
  config,
  onEdit,
  isEditable = false,
}: InteractiveFinanceChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const themeKey = config.colorTheme || 'purple';
  const theme = CHART_THEMES[themeKey] || CHART_THEMES.purple;
  const pfx = config.unitPrefix || '';
  const sfx = config.unitSuffix || '';

  const formatVal = (v: number) => {
    return `${pfx}${v.toLocaleString()}${sfx}`;
  };

  // Safe data extraction
  const data = config.data || [];
  const maxVal1 = Math.max(...data.map((d) => d.value), 1);
  const maxVal2 = Math.max(...data.map((d) => d.value2 || 0), 0);
  const maxVal = Math.max(maxVal1, maxVal2);

  // Donut total calculation
  const totalVal = data.reduce((acc, curr) => acc + curr.value, 0) || 100;

  return (
    <div
      className="interactive-chart-card my-6 p-4 sm:p-5 bg-white border border-[#DDD6FE] rounded-2xl shadow-xs transition-all relative overflow-hidden"
      data-chart-id={config.id}
    >
      {/* Top Header: Title, Subtitle & Edit Button */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#7C3AED] animate-pulse" />
            <h4 className="font-heading font-extrabold text-sm sm:text-base text-[#1E1035] tracking-tight">
              {config.title}
            </h4>
          </div>
          {config.subtitle && (
            <p className="text-xs text-[#6D6582] mt-0.5 font-sans">{config.subtitle}</p>
          )}
        </div>

        {isEditable && onEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="px-2.5 py-1 bg-[#FAF5FF] hover:bg-[#F3E8FF] border border-[#DDD6FE] text-[#7C3AED] font-heading font-bold text-xs rounded-xl transition-colors cursor-pointer flex items-center gap-1 shrink-0 shadow-2xs"
            title="Edit chart data and values"
          >
            <span>✏️</span>
            <span>Edit Values</span>
          </button>
        )}
      </div>

      {/* CHART RENDERING BY TYPE */}
      {/* 1. VERTICAL BAR CHART */}
      {config.type === 'bar' && (
        <div className="space-y-3 pt-2">
          <div className="h-44 sm:h-52 flex items-end justify-between gap-2 sm:gap-4 px-2 border-b border-[#EDE9FE] pb-2">
            {data.map((item, idx) => {
              const heightPct = Math.max(8, (item.value / maxVal) * 100);
              const isHov = hoveredIdx === idx;
              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center h-full justify-end group cursor-pointer relative"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  {/* Tooltip on hover */}
                  {isHov && (
                    <div className="absolute -top-10 px-2 py-1 bg-[#1E1035] text-white text-[11px] font-mono rounded-lg shadow-md whitespace-nowrap z-20 pointer-events-none animate-in fade-in zoom-in-95">
                      {item.label}: <strong>{formatVal(item.value)}</strong>
                    </div>
                  )}

                  {/* Value tag on top */}
                  <span className="text-[10px] font-mono font-bold text-[#6D6582] group-hover:text-[#7C3AED] transition-colors mb-1 truncate max-w-full">
                    {formatVal(item.value)}
                  </span>

                  {/* The bar element */}
                  <div className="w-full max-w-[42px] bg-[#FAF5FF] rounded-t-xl overflow-hidden flex items-end h-full">
                    <div
                      className="w-full rounded-t-xl transition-all duration-300"
                      style={{
                        height: `${heightPct}%`,
                        background: isHov
                          ? `linear-gradient(to top, ${theme.primary}, ${theme.secondary || theme.primaryLight})`
                          : `linear-gradient(to top, ${theme.primaryGradient[0]}, ${theme.primaryGradient[1]})`,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* X-Axis labels */}
          <div className="flex items-center justify-between gap-2 sm:gap-4 px-2 text-center">
            {data.map((item, idx) => (
              <span
                key={idx}
                className="flex-1 text-[11px] font-heading font-semibold text-[#6D6582] truncate"
                title={item.label}
              >
                {item.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 2. DUAL COMPARISON BAR CHART (e.g. Compound vs Simple, Before vs After) */}
      {config.type === 'comparison' && (
        <div className="space-y-4 pt-2">
          {/* Legend */}
          <div className="flex items-center gap-4 text-xs font-heading font-semibold text-[#6D6582]">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-md" style={{ backgroundColor: theme.primary }} />
              <span>{config.series1Name || 'Series 1'}</span>
            </div>
            {config.series2Name && (
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-[#94A3B8]" />
                <span>{config.series2Name}</span>
              </div>
            )}
          </div>

          <div className="h-48 sm:h-56 flex items-end justify-between gap-3 sm:gap-6 px-2 border-b border-[#EDE9FE] pb-2">
            {data.map((item, idx) => {
              const h1 = Math.max(10, (item.value / maxVal) * 100);
              const val2 = item.value2 ?? 0;
              const h2 = Math.max(10, (val2 / maxVal) * 100);
              const isHov = hoveredIdx === idx;

              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center h-full justify-end cursor-pointer relative"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  {isHov && (
                    <div className="absolute -top-14 px-2.5 py-1.5 bg-[#1E1035] text-white text-[10px] font-mono rounded-lg shadow-md whitespace-nowrap z-20 pointer-events-none">
                      <div className="font-bold text-purple-200">{item.label}</div>
                      <div>{config.series1Name || 'Series 1'}: {formatVal(item.value)}</div>
                      {item.value2 !== undefined && (
                        <div>{config.series2Name || 'Series 2'}: {formatVal(item.value2)}</div>
                      )}
                    </div>
                  )}

                  <div className="flex items-end gap-1 sm:gap-1.5 w-full justify-center h-full">
                    {/* Bar 1 */}
                    <div className="flex-1 max-w-[28px] h-full flex flex-col justify-end items-center">
                      <span className="text-[9px] font-mono font-bold text-[#7C3AED] mb-1 truncate hidden sm:block">
                        {formatVal(item.value)}
                      </span>
                      <div
                        className="w-full rounded-t-lg transition-all duration-300"
                        style={{
                          height: `${h1}%`,
                          backgroundColor: theme.primary,
                        }}
                      />
                    </div>

                    {/* Bar 2 */}
                    {item.value2 !== undefined && (
                      <div className="flex-1 max-w-[28px] h-full flex flex-col justify-end items-center">
                        <span className="text-[9px] font-mono font-semibold text-slate-500 mb-1 truncate hidden sm:block">
                          {formatVal(item.value2)}
                        </span>
                        <div
                          className="w-full rounded-t-lg transition-all duration-300 bg-slate-300 hover:bg-slate-400"
                          style={{
                            height: `${h2}%`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* X-Axis labels */}
          <div className="flex items-center justify-between gap-3 sm:gap-6 px-2 text-center">
            {data.map((item, idx) => (
              <span
                key={idx}
                className="flex-1 text-[11px] font-heading font-semibold text-[#6D6582] truncate"
                title={item.label}
              >
                {item.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 3. HORIZONTAL BAR CHART */}
      {config.type === 'horizontalBar' && (
        <div className="space-y-3 pt-1">
          {data.map((item, idx) => {
            const widthPct = Math.max(5, (item.value / maxVal) * 100);
            return (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-heading font-semibold text-[#1E1035]">{item.label}</span>
                  <span className="font-mono font-bold text-[#7C3AED]">{formatVal(item.value)}</span>
                </div>
                <div className="h-4 bg-[#FAF5FF] rounded-full overflow-hidden border border-[#EDE9FE]">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${widthPct}%`,
                      background: `linear-gradient(to right, ${theme.primaryGradient[0]}, ${theme.primaryGradient[1]})`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 4. DONUT ALLOCATION CHART */}
      {config.type === 'donut' && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
          {/* SVG Donut */}
          <div className="relative w-36 h-36 shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              {(() => {
                let accumulatedPct = 0;
                return data.map((item, idx) => {
                  const pct = (item.value / totalVal) * 100;
                  const strokeDasharray = `${pct} ${100 - pct}`;
                  const strokeDashoffset = -accumulatedPct;
                  accumulatedPct += pct;
                  const itemColor =
                    item.color ||
                    (idx === 0
                      ? theme.primary
                      : idx === 1
                      ? '#06B6D4'
                      : idx === 2
                      ? '#10B981'
                      : idx === 3
                      ? '#F59E0B'
                      : '#EC4899');

                  return (
                    <circle
                      key={idx}
                      cx="50"
                      cy="50"
                      r="36"
                      fill="transparent"
                      stroke={itemColor}
                      strokeWidth="18"
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      pathLength="100"
                      className="transition-all duration-300 hover:opacity-85 cursor-pointer"
                    />
                  );
                });
              })()}
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-xs font-heading font-extrabold text-[#1E1035]">100%</span>
              <span className="text-[9px] uppercase tracking-wider text-[#9D95B3]">Total</span>
            </div>
          </div>

          {/* Breakdown Items List */}
          <div className="space-y-2.5 flex-1 w-full text-xs">
            {data.map((item, idx) => {
              const itemColor =
                item.color ||
                (idx === 0
                  ? theme.primary
                  : idx === 1
                  ? '#06B6D4'
                  : idx === 2
                  ? '#10B981'
                  : idx === 3
                  ? '#F59E0B'
                  : '#EC4899');
              const pct = Math.round((item.value / totalVal) * 100);

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-xl bg-[#FAF9FE] border border-[#EDE9FE]"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: itemColor }}
                    />
                    <span className="font-heading font-semibold text-[#1E1035]">{item.label}</span>
                  </div>
                  <div className="flex items-center gap-2 font-mono">
                    <span className="font-bold text-[#1E1035]">{formatVal(item.value)}</span>
                    <span className="text-[10px] text-[#9D95B3]">({pct}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. LINE / TREND AREA CHART */}
      {(config.type === 'line' || config.type === 'area') && (
        <div className="space-y-3 pt-2">
          <div className="relative h-44 sm:h-52 w-full border-b border-[#EDE9FE] pb-2">
            <svg
              viewBox="0 0 500 200"
              className="w-full h-full overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id={`area-grad-${config.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={theme.primary} stopOpacity="0.35" />
                  <stop offset="100%" stopColor={theme.primary} stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Build Path */}
              {(() => {
                if (data.length < 2) return null;
                const stepX = 500 / (data.length - 1);
                const points = data.map((d, i) => {
                  const x = i * stepX;
                  const y = 190 - (d.value / maxVal) * 170;
                  return { x, y };
                });

                const lineD = points.reduce(
                  (acc, curr, i) => (i === 0 ? `M ${curr.x},${curr.y}` : `${acc} L ${curr.x},${curr.y}`),
                  ''
                );
                const areaD = `${lineD} L 500,200 L 0,200 Z`;

                return (
                  <>
                    <path d={areaD} fill={`url(#area-grad-${config.id})`} />
                    <path
                      d={lineD}
                      fill="none"
                      stroke={theme.primary}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {points.map((pt, i) => (
                      <g key={i}>
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r="5"
                          fill="#FFFFFF"
                          stroke={theme.primary}
                          strokeWidth="3"
                          className="hover:r-7 transition-all cursor-pointer"
                        />
                        <text
                          x={pt.x}
                          y={pt.y - 10}
                          textAnchor="middle"
                          fill="#4B3E65"
                          fontSize="11"
                          fontWeight="bold"
                          fontFamily="monospace"
                        >
                          {formatVal(data[i].value)}
                        </text>
                      </g>
                    ))}
                  </>
                );
              })()}
            </svg>
          </div>

          {/* X-Axis labels */}
          <div className="flex items-center justify-between text-center px-1">
            {data.map((item, idx) => (
              <span
                key={idx}
                className="text-[11px] font-heading font-semibold text-[#6D6582]"
              >
                {item.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Bottom Subtle Tag */}
      <div className="mt-3 pt-2 border-t border-[#F5F3FF] flex items-center justify-between text-[10px] text-[#9D95B3]">
        <span>⚡ Interactive Financial Data Visualizer</span>
        <span>PRBSolver Precision Engine</span>
      </div>
    </div>
  );
}

// Helper to serialize chart config to embeddable HTML string in articles
export function serializeChartToHtml(config: ChartConfig): string {
  const jsonEncoded = encodeURIComponent(JSON.stringify(config));
  return `
<div class="interactive-chart-block my-6" data-chart-config="${jsonEncoded}">
  <!-- Chart Placeholder for Static Fallback -->
  <div class="p-4 bg-[#FAF9FE] border border-[#DDD6FE] rounded-2xl text-center">
    <div class="font-heading font-bold text-sm text-[#1E1035]">${config.title}</div>
    <div class="text-xs text-[#6D6582]">${config.subtitle || 'Interactive financial chart'}</div>
    <div class="text-xs text-[#7C3AED] font-semibold mt-2">[Interactive Chart: ${config.title}]</div>
  </div>
</div>
  `.trim();
}
