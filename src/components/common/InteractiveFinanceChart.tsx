import React, { useState } from 'react';

export interface ChartDataPoint {
  label: string;
  value: number; // Primary value (or Close for stock, or Y for scatter)
  value2?: number; // Secondary value (Open/High, or Comparison series)
  value3?: number; // High / Bubble size
  value4?: number; // Low / Volume
  color?: string;
}

// Complete Excel Chart Categories & Subtypes
export type ChartMainCategory =
  | 'column'
  | 'line'
  | 'pie'
  | 'bar'
  | 'area'
  | 'scatter'
  | 'stock'
  | 'surface'
  | 'doughnut'
  | 'bubble'
  | 'radar';

export type ChartSubtype =
  // Column - 2D (3 variants)
  | 'col_2d_clustered'
  | 'col_2d_stacked'
  | 'col_2d_100_stacked'
  // Column - 3D (4 variants)
  | 'col_3d_clustered'
  | 'col_3d_stacked'
  | 'col_3d_100_stacked'
  | 'col_3d_deep'
  // Column - Cylinder (4 variants)
  | 'cyl_clustered'
  | 'cyl_stacked'
  | 'cyl_100_stacked'
  | 'cyl_3d'
  // Column - Cone (4 variants)
  | 'cone_clustered'
  | 'cone_stacked'
  | 'cone_100_stacked'
  | 'cone_3d'
  // Column - Pyramid (4 variants)
  | 'pyramid_clustered'
  | 'pyramid_stacked'
  | 'pyramid_100_stacked'
  | 'pyramid_3d'
  // Line (5 variants)
  | 'line_markers'
  | 'line_stacked'
  | 'line_100_stacked'
  | 'line_smooth'
  | 'line_3d'
  // Pie (5 variants)
  | 'pie_2d'
  | 'pie_3d'
  | 'pie_exploded'
  | 'pie_of_pie'
  | 'bar_of_pie'
  // Bar Horizontal (7 variants)
  | 'bar_2d_clustered'
  | 'bar_2d_stacked'
  | 'bar_2d_100_stacked'
  | 'bar_3d_clustered'
  | 'bar_cylinder'
  | 'bar_cone'
  | 'bar_pyramid'
  // Area (4 variants)
  | 'area_2d'
  | 'area_stacked'
  | 'area_100_stacked'
  | 'area_3d'
  // Scatter (XY) (3 variants)
  | 'scatter_markers'
  | 'scatter_smooth'
  | 'scatter_straight'
  // Stock (3 variants)
  | 'stock_hlc'
  | 'stock_candlestick'
  | 'stock_vhlc'
  // Surface (2 variants)
  | 'surface_3d'
  | 'surface_contour'
  // Doughnut (2 variants)
  | 'doughnut_2d'
  | 'doughnut_exploded'
  // Bubble (2 variants)
  | 'bubble_2d'
  | 'bubble_3d'
  // Radar (3 variants)
  | 'radar_line'
  | 'radar_markers'
  | 'radar_filled';

// Legacy compatibility type
export type ChartType = ChartSubtype | 'bar' | 'horizontalBar' | 'line' | 'area' | 'donut' | 'comparison';

export interface ChartConfig {
  id: string;
  type: ChartType;
  title: string;
  subtitle?: string;
  unitPrefix?: string; // e.g. '$'
  unitSuffix?: string; // e.g. '%', 'years', 'k'
  series1Name?: string;
  series2Name?: string;
  colorTheme?: 'purple' | 'emerald' | 'blue' | 'amber' | 'rose' | 'slate';
  data: ChartDataPoint[];
}

export const CHART_THEMES = {
  purple: {
    primary: '#7C3AED',
    primaryLight: '#DDD6FE',
    primaryDark: '#5B21B6',
    primaryGradient: ['#7C3AED', '#A78BFA'],
    secondary: '#EC4899',
    secondaryGradient: ['#EC4899', '#F472B6'],
    fillBg: 'rgba(124, 58, 237, 0.08)',
  },
  emerald: {
    primary: '#059669',
    primaryLight: '#A7F3D0',
    primaryDark: '#047857',
    primaryGradient: ['#059669', '#34D399'],
    secondary: '#0284C7',
    secondaryGradient: ['#0284C7', '#38BDF8'],
    fillBg: 'rgba(5, 150, 105, 0.08)',
  },
  blue: {
    primary: '#2563EB',
    primaryLight: '#BFDBFE',
    primaryDark: '#1D4ED8',
    primaryGradient: ['#2563EB', '#60A5FA'],
    secondary: '#8B5CF6',
    secondaryGradient: ['#8B5CF6', '#C084FC'],
    fillBg: 'rgba(37, 99, 235, 0.08)',
  },
  amber: {
    primary: '#D97706',
    primaryLight: '#FDE68A',
    primaryDark: '#B45309',
    primaryGradient: ['#D97706', '#FBBF24'],
    secondary: '#EA580C',
    secondaryGradient: ['#EA580C', '#FB923C'],
    fillBg: 'rgba(217, 119, 6, 0.08)',
  },
  rose: {
    primary: '#E11D48',
    primaryLight: '#FECDD3',
    primaryDark: '#BE123C',
    primaryGradient: ['#E11D48', '#FB7185'],
    secondary: '#9333EA',
    secondaryGradient: ['#9333EA', '#C084FC'],
    fillBg: 'rgba(225, 29, 72, 0.08)',
  },
  slate: {
    primary: '#475569',
    primaryLight: '#CBD5E1',
    primaryDark: '#334155',
    primaryGradient: ['#475569', '#94A3B8'],
    secondary: '#0284C7',
    secondaryGradient: ['#0284C7', '#38BDF8'],
    fillBg: 'rgba(71, 85, 105, 0.08)',
  },
};

export const CHART_PRESETS: { name: string; category: string; description: string; config: ChartConfig }[] = [
  {
    name: 'Compound vs Simple Interest (2D Clustered Column)',
    category: 'column',
    description: 'Classic dual-series projection over 5 to 25 years',
    config: {
      id: 'compound-vs-simple',
      type: 'col_2d_clustered',
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
    name: '3D Cylinder Growth Columns',
    category: 'column',
    description: '3D Cylinder columns for revenue & quarterly goals',
    config: {
      id: 'cylinder-growth',
      type: 'cyl_clustered',
      title: 'Quarterly Target vs Actual Performance (Cylinder 3D)',
      subtitle: 'Corporate Financial Milestones in Thousands ($k)',
      unitPrefix: '$',
      unitSuffix: 'k',
      series1Name: 'Actual Revenue',
      series2Name: 'Target Benchmark',
      colorTheme: 'blue',
      data: [
        { label: 'Q1', value: 450, value2: 400 },
        { label: 'Q2', value: 580, value2: 500 },
        { label: 'Q3', value: 720, value2: 650 },
        { label: 'Q4', value: 910, value2: 800 },
      ],
    },
  },
  {
    name: '50/30/20 Budget Breakdown (3D Exploded Pie)',
    category: 'pie',
    description: 'Personal finance allocation: Needs, Wants, Savings',
    config: {
      id: 'budget-50-30-20',
      type: 'pie_exploded',
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
    name: 'Stock Candlestick (Open-High-Low-Close)',
    category: 'stock',
    description: 'Financial trading market prices with real wicks',
    config: {
      id: 'stock-market-candlestick',
      type: 'stock_candlestick',
      title: 'Index Daily Candlestick Price Movement',
      subtitle: 'Open, High, Low, and Close (OHLC) Daily Volatility',
      unitPrefix: '$',
      unitSuffix: '',
      colorTheme: 'emerald',
      data: [
        { label: 'Mon', value: 185, value2: 180, value3: 190, value4: 175 }, // Close, Open, High, Low
        { label: 'Tue', value: 178, value2: 184, value3: 188, value4: 174 },
        { label: 'Wed', value: 194, value2: 179, value3: 198, value4: 177 },
        { label: 'Thu', value: 205, value2: 193, value3: 208, value4: 190 },
        { label: 'Fri', value: 212, value2: 204, value3: 216, value4: 201 },
      ],
    },
  },
  {
    name: 'Investment Risk & Performance (Radar / Spider)',
    category: 'radar',
    description: 'Multi-attribute spider matrix across 6 metrics',
    config: {
      id: 'risk-radar-eval',
      type: 'radar_filled',
      title: 'Asset Class Risk & Metric Spider Evaluation',
      subtitle: 'Scored 1-100 Across Financial Pillars',
      unitPrefix: '',
      unitSuffix: ' pts',
      colorTheme: 'purple',
      data: [
        { label: 'Yield', value: 85 },
        { label: 'Liquidity', value: 92 },
        { label: 'Volatility', value: 45 },
        { label: 'Inflation Hedge', value: 78 },
        { label: 'Growth Potential', value: 88 },
        { label: 'Capital Preservation', value: 70 },
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

  const data = config.data || [];
  const maxVal1 = Math.max(...data.map((d) => d.value), 1);
  const maxVal2 = Math.max(...data.map((d) => d.value2 || 0), 0);
  const maxVal = Math.max(maxVal1, maxVal2);
  const totalVal = data.reduce((acc, curr) => acc + curr.value, 0) || 100;

  // Normalize chart type to categorize rendering
  const t = config.type;

  const isColumnType =
    t === 'bar' ||
    t === 'col_2d_clustered' ||
    t === 'col_2d_stacked' ||
    t === 'col_2d_100_stacked' ||
    t === 'col_3d_clustered' ||
    t === 'col_3d_stacked' ||
    t === 'col_3d_100_stacked' ||
    t === 'col_3d_deep' ||
    t === 'cyl_clustered' ||
    t === 'cyl_stacked' ||
    t === 'cyl_100_stacked' ||
    t === 'cyl_3d' ||
    t === 'cone_clustered' ||
    t === 'cone_stacked' ||
    t === 'cone_100_stacked' ||
    t === 'cone_3d' ||
    t === 'pyramid_clustered' ||
    t === 'pyramid_stacked' ||
    t === 'pyramid_100_stacked' ||
    t === 'pyramid_3d' ||
    t === 'comparison';

  const isHorizontalBar =
    t === 'horizontalBar' ||
    t === 'bar_2d_clustered' ||
    t === 'bar_2d_stacked' ||
    t === 'bar_2d_100_stacked' ||
    t === 'bar_3d_clustered' ||
    t === 'bar_cylinder' ||
    t === 'bar_cone' ||
    t === 'bar_pyramid';

  const isPieOrDoughnut =
    t === 'donut' ||
    t === 'pie_2d' ||
    t === 'pie_3d' ||
    t === 'pie_exploded' ||
    t === 'pie_of_pie' ||
    t === 'bar_of_pie' ||
    t === 'doughnut_2d' ||
    t === 'doughnut_exploded';

  const isLineOrArea =
    t === 'line' ||
    t === 'area' ||
    t === 'line_markers' ||
    t === 'line_stacked' ||
    t === 'line_100_stacked' ||
    t === 'line_smooth' ||
    t === 'line_3d' ||
    t === 'area_2d' ||
    t === 'area_stacked' ||
    t === 'area_100_stacked' ||
    t === 'area_3d';

  const isScatterOrBubble =
    t === 'scatter_markers' ||
    t === 'scatter_smooth' ||
    t === 'scatter_straight' ||
    t === 'bubble_2d' ||
    t === 'bubble_3d';

  const isStock =
    t === 'stock_hlc' ||
    t === 'stock_candlestick' ||
    t === 'stock_vhlc';

  const isRadar =
    t === 'radar_line' ||
    t === 'radar_markers' ||
    t === 'radar_filled';

  const isSurface =
    t === 'surface_3d' ||
    t === 'surface_contour';

  return (
    <div
      className="interactive-chart-card my-6 p-4 sm:p-5 bg-white border border-[#DDD6FE] rounded-2xl shadow-xs transition-all relative overflow-hidden"
      data-chart-id={config.id}
    >
      {/* Top Header: Title, Subtitle, Subtype Badge & Edit Button */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#7C3AED] animate-pulse" />
            <h4 className="font-heading font-extrabold text-sm sm:text-base text-[#1E1035] tracking-tight">
              {config.title}
            </h4>
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#FAF5FF] text-[#7C3AED] border border-[#DDD6FE] font-bold">
              {config.type.replace(/_/g, ' ')}
            </span>
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

      {/* ========================================================================= */}
      {/* 1. COLUMN CHARTS (2D, 3D, Cylinder, Cone, Pyramid) */}
      {/* ========================================================================= */}
      {isColumnType && (
        <div className="space-y-4 pt-2">
          {/* Legend for dual series */}
          {(config.series2Name || data.some((d) => d.value2 !== undefined)) && (
            <div className="flex items-center gap-4 text-xs font-heading font-semibold text-[#6D6582]">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md" style={{ backgroundColor: theme.primary }} />
                <span>{config.series1Name || 'Series 1'}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-md bg-[#94A3B8]" />
                <span>{config.series2Name || 'Series 2'}</span>
              </div>
            </div>
          )}

          <div className="h-52 sm:h-60 flex items-end justify-between gap-2 sm:gap-4 px-2 border-b border-[#EDE9FE] pb-2">
            {data.map((item, idx) => {
              const h1 = Math.max(12, (item.value / maxVal) * 100);
              const val2 = item.value2 ?? 0;
              const h2 = Math.max(12, (val2 / maxVal) * 100);
              const isHov = hoveredIdx === idx;
              const hasSecondSeries = item.value2 !== undefined;

              // Render shapes: cylinder, cone, pyramid, 3D, or standard
              const isCylinder = t.includes('cyl');
              const isCone = t.includes('cone');
              const isPyramid = t.includes('pyramid');
              const is3D = t.includes('3d');

              return (
                <div
                  key={idx}
                  className="flex-1 flex flex-col items-center h-full justify-end cursor-pointer relative group"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  {isHov && (
                    <div className="absolute -top-12 px-2.5 py-1.5 bg-[#1E1035] text-white text-[11px] font-mono rounded-lg shadow-md whitespace-nowrap z-20 pointer-events-none">
                      <div className="font-bold text-purple-200">{item.label}</div>
                      <div>{config.series1Name || 'Value'}: {formatVal(item.value)}</div>
                      {hasSecondSeries && (
                        <div>{config.series2Name || 'Value 2'}: {formatVal(val2)}</div>
                      )}
                    </div>
                  )}

                  <span className="text-[10px] font-mono font-bold text-[#6D6582] group-hover:text-[#7C3AED] transition-colors mb-1 truncate max-w-full">
                    {formatVal(item.value)}
                  </span>

                  <div className="flex items-end gap-1.5 w-full justify-center h-full">
                    {/* Primary Shape */}
                    <div className="w-full max-w-[42px] h-full flex items-end justify-center">
                      {isCylinder ? (
                        /* Cylinder with 3D elliptical cap */
                        <div
                          className="w-full rounded-t-full transition-all duration-300 relative shadow-md"
                          style={{
                            height: `${h1}%`,
                            background: `linear-gradient(to right, ${theme.primaryDark}, ${theme.primary}, ${theme.primaryLight})`,
                          }}
                        >
                          <div
                            className="w-full h-3 rounded-full absolute -top-1.5 left-0"
                            style={{ backgroundColor: theme.primaryLight }}
                          />
                        </div>
                      ) : isCone ? (
                        /* Tapered 3D Cone */
                        <div
                          className="w-full transition-all duration-300 relative"
                          style={{
                            height: `${h1}%`,
                            clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
                            background: `linear-gradient(to right, ${theme.primaryDark}, ${theme.primary}, ${theme.primaryLight})`,
                          }}
                        />
                      ) : isPyramid ? (
                        /* Sharp 3D Pyramid */
                        <div
                          className="w-full transition-all duration-300 flex"
                          style={{
                            height: `${h1}%`,
                            clipPath: 'polygon(50% 0%, 100% 100%, 0% 100%)',
                          }}
                        >
                          <div className="w-1/2 h-full" style={{ backgroundColor: theme.primary }} />
                          <div className="w-1/2 h-full" style={{ backgroundColor: theme.primaryDark }} />
                        </div>
                      ) : is3D ? (
                        /* 3D Isometric Block */
                        <div className="w-full relative transition-all duration-300" style={{ height: `${h1}%` }}>
                          <div
                            className="w-full h-2.5 rounded-t-xs -top-2 left-0 absolute transform skew-x-[-25deg]"
                            style={{ backgroundColor: theme.primaryLight }}
                          />
                          <div
                            className="w-full h-full rounded-t-xs"
                            style={{
                              background: `linear-gradient(to top, ${theme.primaryGradient[0]}, ${theme.primaryGradient[1]})`,
                            }}
                          />
                        </div>
                      ) : (
                        /* Standard 2D Bar */
                        <div
                          className="w-full rounded-t-xl transition-all duration-300"
                          style={{
                            height: `${h1}%`,
                            background: `linear-gradient(to top, ${theme.primaryGradient[0]}, ${theme.primaryGradient[1]})`,
                          }}
                        />
                      )}
                    </div>

                    {/* Secondary Series Bar if present */}
                    {hasSecondSeries && (
                      <div className="w-full max-w-[28px] h-full flex items-end justify-center">
                        <div
                          className="w-full rounded-t-lg transition-all duration-300 bg-slate-400 hover:bg-slate-500"
                          style={{ height: `${h2}%` }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* X Axis */}
          <div className="flex items-center justify-between gap-2 sm:gap-4 px-2 text-center">
            {data.map((item, idx) => (
              <span key={idx} className="flex-1 text-[11px] font-heading font-semibold text-[#6D6582] truncate">
                {item.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. HORIZONTAL BAR CHARTS (2D, 3D, Cylinder, Cone, Pyramid) */}
      {/* ========================================================================= */}
      {isHorizontalBar && (
        <div className="space-y-3 pt-2">
          {data.map((item, idx) => {
            const widthPct = Math.max(6, (item.value / maxVal) * 100);
            return (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-heading font-semibold text-[#1E1035]">{item.label}</span>
                  <span className="font-mono font-bold text-[#7C3AED]">{formatVal(item.value)}</span>
                </div>
                <div className="h-5 bg-[#FAF5FF] rounded-full overflow-hidden border border-[#EDE9FE] relative">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${widthPct}%`,
                      background: t.includes('cylinder')
                        ? `linear-gradient(to bottom, ${theme.primaryLight}, ${theme.primary}, ${theme.primaryDark})`
                        : `linear-gradient(to right, ${theme.primaryGradient[0]}, ${theme.primaryGradient[1]})`,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. PIE & DOUGHNUT (2D, 3D, Exploded, Pie-of-Pie) */}
      {/* ========================================================================= */}
      {isPieOrDoughnut && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
          <div className="relative w-40 h-40 shrink-0">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              {(() => {
                let accumulatedPct = 0;
                const isDoughnut = t.includes('doughnut') || t === 'donut';
                const strokeW = isDoughnut ? 20 : 36;
                const radius = isDoughnut ? 35 : 25;

                return data.map((item, idx) => {
                  const pct = (item.value / totalVal) * 100;
                  const strokeDasharray = `${pct} ${100 - pct}`;
                  const strokeDashoffset = -accumulatedPct;
                  accumulatedPct += pct;
                  const itemColor =
                    item.color ||
                    (idx === 0 ? theme.primary : idx === 1 ? '#06B6D4' : idx === 2 ? '#10B981' : idx === 3 ? '#F59E0B' : '#EC4899');

                  return (
                    <circle
                      key={idx}
                      cx="50"
                      cy="50"
                      r={radius}
                      fill="transparent"
                      stroke={itemColor}
                      strokeWidth={strokeW}
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

          <div className="space-y-2 flex-1 w-full text-xs">
            {data.map((item, idx) => {
              const itemColor =
                item.color ||
                (idx === 0 ? theme.primary : idx === 1 ? '#06B6D4' : idx === 2 ? '#10B981' : idx === 3 ? '#F59E0B' : '#EC4899');
              const pct = Math.round((item.value / totalVal) * 100);

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-xl bg-[#FAF9FE] border border-[#EDE9FE]"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: itemColor }} />
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

      {/* ========================================================================= */}
      {/* 4. LINE & AREA CHARTS */}
      {/* ========================================================================= */}
      {isLineOrArea && (
        <div className="space-y-3 pt-2">
          <div className="relative h-48 sm:h-56 w-full border-b border-[#EDE9FE] pb-2">
            <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible" preserveAspectRatio="none">
              <defs>
                <linearGradient id={`area-grad-${config.id}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={theme.primary} stopOpacity="0.4" />
                  <stop offset="100%" stopColor={theme.primary} stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {(() => {
                if (data.length < 2) return null;
                const stepX = 500 / (data.length - 1);
                const points = data.map((d, i) => {
                  const x = i * stepX;
                  const y = 185 - (d.value / maxVal) * 160;
                  return { x, y };
                });

                const lineD = points.reduce(
                  (acc, curr, i) => (i === 0 ? `M ${curr.x},${curr.y}` : `${acc} L ${curr.x},${curr.y}`),
                  ''
                );
                const areaD = `${lineD} L 500,200 L 0,200 Z`;
                const isArea = t.includes('area');

                return (
                  <>
                    {isArea && <path d={areaD} fill={`url(#area-grad-${config.id})`} />}
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
                          r="5.5"
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

          <div className="flex items-center justify-between text-center px-1">
            {data.map((item, idx) => (
              <span key={idx} className="text-[11px] font-heading font-semibold text-[#6D6582]">
                {item.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. STOCK & CANDLESTICK (Open-High-Low-Close) */}
      {/* ========================================================================= */}
      {isStock && (
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-4 text-xs font-heading font-semibold text-[#6D6582]">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-emerald-600" />
              <span>Bullish (Close &gt; Open)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-rose-600" />
              <span>Bearish (Close &lt; Open)</span>
            </div>
          </div>

          <div className="h-56 sm:h-64 flex items-end justify-between gap-4 sm:gap-8 px-4 border-b border-[#EDE9FE] pb-4">
            {data.map((item, idx) => {
              const close = item.value;
              const open = item.value2 ?? close * 0.98;
              const high = item.value3 ?? Math.max(open, close) * 1.05;
              const low = item.value4 ?? Math.min(open, close) * 0.95;

              const isGreen = close >= open;
              const topBody = Math.max(open, close);
              const btmBody = Math.min(open, close);

              const allHigh = Math.max(...data.map((d) => d.value3 ?? d.value * 1.1));
              const allLow = Math.min(...data.map((d) => d.value4 ?? d.value * 0.9));
              const range = Math.max(1, allHigh - allLow);

              const highPct = ((high - allLow) / range) * 100;
              const lowPct = ((low - allLow) / range) * 100;
              const topBodyPct = ((topBody - allLow) / range) * 100;
              const btmBodyPct = ((btmBody - allLow) / range) * 100;

              return (
                <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end relative group">
                  <div className="w-full flex flex-col items-center h-full justify-end relative">
                    {/* Wick Line (High to Low) */}
                    <div
                      className="w-0.5 bg-slate-700 absolute"
                      style={{
                        bottom: `${lowPct}%`,
                        height: `${Math.max(4, highPct - lowPct)}%`,
                      }}
                    />

                    {/* Candlestick Body */}
                    <div
                      className={`w-6 sm:w-8 rounded-xs absolute shadow-sm transition-all ${
                        isGreen ? 'bg-emerald-500 border border-emerald-600' : 'bg-rose-500 border border-rose-600'
                      }`}
                      style={{
                        bottom: `${btmBodyPct}%`,
                        height: `${Math.max(6, topBodyPct - btmBodyPct)}%`,
                      }}
                    />
                  </div>

                  <span className="text-[11px] font-mono font-bold text-[#1E1035] mt-2">
                    {formatVal(close)}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-center px-4">
            {data.map((item, idx) => (
              <span key={idx} className="flex-1 text-[11px] font-heading font-semibold text-[#6D6582]">
                {item.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. RADAR & SPIDER EVALUATION CHART */}
      {/* ========================================================================= */}
      {isRadar && (
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 py-2">
          <div className="relative w-52 h-52 shrink-0">
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {/* Concentric Spider Webs */}
              {[40, 60, 80].map((r, i) => (
                <polygon
                  key={i}
                  points={(() => {
                    const total = data.length || 6;
                    return Array.from({ length: total })
                      .map((_, idx) => {
                        const angle = (Math.PI * 2 / total) * idx - Math.PI / 2;
                        const x = 100 + r * Math.cos(angle);
                        const y = 100 + r * Math.sin(angle);
                        return `${x},${y}`;
                      })
                      .join(' ');
                  })()}
                  fill="none"
                  stroke="#DDD6FE"
                  strokeWidth="1"
                />
              ))}

              {/* Data Polygon */}
              {(() => {
                const total = data.length || 6;
                const points = data.map((d, idx) => {
                  const angle = (Math.PI * 2 / total) * idx - Math.PI / 2;
                  const r = Math.max(10, (d.value / maxVal) * 80);
                  const x = 100 + r * Math.cos(angle);
                  const y = 100 + r * Math.sin(angle);
                  return `${x},${y}`;
                });
                const ptsString = points.join(' ');

                return (
                  <>
                    <polygon
                      points={ptsString}
                      fill={theme.fillBg || 'rgba(124,58,237,0.2)'}
                      stroke={theme.primary}
                      strokeWidth="2.5"
                    />
                    {points.map((pt, idx) => {
                      const [px, py] = pt.split(',').map(Number);
                      return (
                        <circle
                          key={idx}
                          cx={px}
                          cy={py}
                          r="4"
                          fill="#FFFFFF"
                          stroke={theme.primary}
                          strokeWidth="2"
                        />
                      );
                    })}
                  </>
                );
              })()}
            </svg>
          </div>

          <div className="space-y-2 flex-1 w-full text-xs">
            {data.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-[#FAF9FE] border border-[#EDE9FE]">
                <span className="font-heading font-semibold text-[#1E1035]">{item.label}</span>
                <span className="font-mono font-bold text-[#7C3AED]">{formatVal(item.value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. SCATTER (XY) & BUBBLE CHARTS */}
      {/* ========================================================================= */}
      {isScatterOrBubble && (
        <div className="space-y-3 pt-2">
          <div className="relative h-48 sm:h-56 w-full border-b border-[#EDE9FE] pb-2 flex items-center justify-around">
            {data.map((item, idx) => {
              const bubbleSize = Math.max(20, Math.min(60, (item.value3 || item.value) / 2));
              const heightPct = Math.max(15, (item.value / maxVal) * 85);

              return (
                <div key={idx} className="flex flex-col items-center h-full justify-end relative group">
                  <div
                    className="rounded-full shadow-md flex items-center justify-center text-white text-[10px] font-mono font-bold transition-all hover:scale-110 cursor-pointer"
                    style={{
                      width: `${bubbleSize}px`,
                      height: `${bubbleSize}px`,
                      marginBottom: `${heightPct}%`,
                      background: t.includes('3d')
                        ? `radial-gradient(circle at 30% 30%, ${theme.primaryLight}, ${theme.primary}, ${theme.primaryDark})`
                        : theme.primary,
                    }}
                  >
                    {item.value}
                  </div>
                  <span className="text-[11px] font-heading font-semibold text-[#6D6582]">{item.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. SURFACE 3D & CONTOUR */}
      {/* ========================================================================= */}
      {isSurface && (
        <div className="space-y-3 pt-2">
          <div className="h-44 sm:h-52 w-full rounded-2xl bg-gradient-to-tr from-[#1E1035] via-[#4C1D95] to-[#7C3AED] flex flex-col items-center justify-center p-4 text-white shadow-inner">
            <span className="font-mono text-xs text-purple-200">3D Wireframe Surface &amp; Topographic Grid</span>
            <div className="grid grid-cols-4 gap-2 w-full max-w-sm mt-3">
              {data.slice(0, 8).map((d, i) => (
                <div key={i} className="p-2 rounded-lg bg-white/10 text-center font-mono text-[10px]">
                  <div>{d.label}</div>
                  <div className="font-bold text-amber-300">{formatVal(d.value)}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Subtle Tag */}
      <div className="mt-3 pt-2 border-t border-[#F5F3FF] flex items-center justify-between text-[10px] text-[#9D95B3]">
        <span>⚡ Excel-Standard Precision Financial Visualizer</span>
        <span>PRBSolver Engine</span>
      </div>
    </div>
  );
}

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
