import React, { useState } from 'react';
import { FavoriteDayPoint, FavoritesTimeframe } from '../../services/favoritesAnalyticsService';
import { Heart, TrendingUp, Calendar, Info } from 'lucide-react';

interface FavoritesTrendChartProps {
  data: FavoriteDayPoint[];
  timeframe: FavoritesTimeframe;
  onTimeframeChange: (tf: FavoritesTimeframe) => void;
  title?: string;
  subtitle?: string;
  totalPeriodFavorites: number;
  growthPercent: number;
}

export function FavoritesTrendChart({
  data,
  timeframe,
  onTimeframeChange,
  title = 'Platform Favorites Velocity',
  subtitle = 'Daily bookmark interactions and cumulative user affinity over time',
  totalPeriodFavorites,
  growthPercent,
}: FavoritesTrendChartProps) {
  const [viewMode, setViewMode] = useState<'daily' | 'cumulative'>('daily');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="bg-[#FFFFFF] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] rounded-xl p-8 text-center text-xs text-[#5B6577] dark:text-[#9AA5B8]">
        No trend data available for this timeframe.
      </div>
    );
  }

  // Sizing & coordinates
  const width = 800;
  const height = 240;
  const padLeft = 44;
  const padRight = 24;
  const padTop = 20;
  const padBottom = 32;
  const innerWidth = width - padLeft - padRight;
  const innerHeight = height - padTop - padBottom;

  const values = data.map((d) => (viewMode === 'daily' ? d.count : d.cumulativeCount));
  const maxVal = Math.max(...values, 5) * 1.15;

  const getX = (idx: number) => {
    if (data.length <= 1) return padLeft + innerWidth / 2;
    return padLeft + (idx / (data.length - 1)) * innerWidth;
  };

  const getY = (val: number) => {
    return padTop + innerHeight - (val / maxVal) * innerHeight;
  };

  // Generate SVG path for line
  const linePath = data.reduce((acc, point, idx) => {
    const val = viewMode === 'daily' ? point.count : point.cumulativeCount;
    const x = getX(idx);
    const y = getY(val);
    return idx === 0 ? `M ${x.toFixed(1)},${y.toFixed(1)}` : `${acc} L ${x.toFixed(1)},${y.toFixed(1)}`;
  }, '');

  // Area path for subtle fill under line
  const areaPath = `${linePath} L ${getX(data.length - 1).toFixed(1)},${(padTop + innerHeight).toFixed(1)} L ${getX(0).toFixed(1)},${(padTop + innerHeight).toFixed(1)} Z`;

  // Grid levels (0%, 33%, 66%, 100%)
  const gridLevels = [0, 0.33, 0.66, 1];

  // Pick tick labels to avoid overcrowding
  const tickStep = data.length > 30 ? Math.ceil(data.length / 7) : data.length > 10 ? 3 : 1;

  const hoveredPoint = hoveredIndex !== null ? data[hoveredIndex] : null;

  return (
    <div
      id="favorites-trend-chart-card"
      className="bg-[#FFFFFF] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] rounded-xl p-5 sm:p-6 transition-colors shadow-2xs"
    >
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-[#E4E8EF] dark:border-[#1B233A]">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-bold text-[#131A2B] dark:text-[#F4F6F9]">
              {title}
            </h2>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#E9F8EF] text-[#16A34A] dark:bg-[#1B233A] dark:text-[#16A34A] border border-[#16A34A]/30 dark:border-[#16A34A]/30">
              <TrendingUp className="w-3 h-3" />
              <span>+{growthPercent}%</span>
            </span>
          </div>
          <p className="text-xs text-[#5B6577] dark:text-[#9AA5B8] mt-0.5">
            {subtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* View Mode Toggle: Daily vs Cumulative */}
          <div className="inline-flex items-center p-0.5 rounded-lg bg-[#F4F6F9] dark:bg-[#1B233A] border border-[#E4E8EF] dark:border-[#1B233A] text-xs">
            <button
              type="button"
              onClick={() => setViewMode('daily')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                viewMode === 'daily'
                  ? 'bg-[#FFFFFF] dark:bg-[#131A2B] text-[#131A2B] dark:text-[#F4F6F9] shadow-2xs'
                  : 'text-[#5B6577] dark:text-[#9AA5B8] hover:text-[#131A2B] dark:hover:text-[#F4F6F9]'
              }`}
            >
              Daily Adds
            </button>
            <button
              type="button"
              onClick={() => setViewMode('cumulative')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                viewMode === 'cumulative'
                  ? 'bg-[#FFFFFF] dark:bg-[#131A2B] text-[#131A2B] dark:text-[#F4F6F9] shadow-2xs'
                  : 'text-[#5B6577] dark:text-[#9AA5B8] hover:text-[#131A2B] dark:hover:text-[#F4F6F9]'
              }`}
            >
              Cumulative
            </button>
          </div>

          {/* Timeframe Selector */}
          <div className="inline-flex items-center p-0.5 rounded-lg bg-[#F4F6F9] dark:bg-[#1B233A] border border-[#E4E8EF] dark:border-[#1B233A] text-xs">
            {(['7d', '30d', '90d'] as FavoritesTimeframe[]).map((tf) => (
              <button
                key={tf}
                type="button"
                onClick={() => onTimeframeChange(tf)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                  timeframe === tf
                    ? 'bg-[#FFFFFF] dark:bg-[#131A2B] text-[#2563EB] dark:text-[#2563EB] shadow-2xs font-semibold'
                    : 'text-[#5B6577] dark:text-[#9AA5B8] hover:text-[#131A2B] dark:hover:text-[#F4F6F9]'
                }`}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Primary KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-4 border-b border-[#E4E8EF] dark:border-[#1B233A] text-xs">
        <div>
          <div className="text-[11px] text-[#5B6577] dark:text-[#9AA5B8]">Period New Saves</div>
          <div className="text-lg font-bold font-mono text-[#131A2B] dark:text-[#F4F6F9] mt-0.5">
            {totalPeriodFavorites.toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-[11px] text-[#5B6577] dark:text-[#9AA5B8]">Daily Average</div>
          <div className="text-lg font-bold font-mono text-[#131A2B] dark:text-[#F4F6F9] mt-0.5">
            {Math.round(totalPeriodFavorites / (data.length || 1)).toLocaleString()} / day
          </div>
        </div>
        <div>
          <div className="text-[11px] text-[#5B6577] dark:text-[#9AA5B8]">Peak Single Day</div>
          <div className="text-lg font-bold font-mono text-[#131A2B] dark:text-[#F4F6F9] mt-0.5">
            {Math.max(...data.map((d) => d.count), 0).toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-[11px] text-[#5B6577] dark:text-[#9AA5B8]">Save Velocity</div>
          <div className="text-lg font-bold font-mono text-[#2563EB] dark:text-[#2563EB] mt-0.5">
            +{growthPercent}%
          </div>
        </div>
      </div>

      {/* Interactive SVG Chart */}
      <div className="relative pt-4 overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {/* Horizontal Grid Lines */}
          {gridLevels.map((lvl) => {
            const y = padTop + innerHeight - lvl * innerHeight;
            const labelVal = Math.round(lvl * maxVal);
            return (
              <g key={lvl} className="text-[#9AA5B8] dark:text-[#5B6577]">
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="currentColor"
                  strokeDasharray="2 3"
                  strokeOpacity={0.25}
                  strokeWidth={1}
                />
                <text
                  x={padLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  fontSize="10"
                  fill="currentColor"
                  className="font-mono text-[9px]"
                >
                  {labelVal}
                </text>
              </g>
            );
          })}

          {/* Area Fill */}
          <path
            d={areaPath}
            className="fill-blue-50/60 dark:fill-blue-950/20"
          />

          {/* Line Path */}
          <path
            d={linePath}
            fill="none"
            className="stroke-[#2563EB] dark:stroke-[#2563EB]"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Data Points & Interactive hover columns */}
          {data.map((point, idx) => {
            const x = getX(idx);
            const val = viewMode === 'daily' ? point.count : point.cumulativeCount;
            const y = getY(val);
            const isHovered = hoveredIndex === idx;

            return (
              <g key={point.isoDate}>
                {/* Invisible hover slice for responsive touch/mouse detection */}
                <rect
                  x={x - (innerWidth / (data.length * 2 || 1))}
                  y={padTop}
                  width={Math.max(12, innerWidth / (data.length || 1))}
                  height={innerHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(idx)}
                />

                {/* Point dot on hover */}
                {isHovered && (
                  <>
                    <line
                      x1={x}
                      y1={padTop}
                      x2={x}
                      y2={padTop + innerHeight}
                      stroke="#2563EB"
                      strokeDasharray="3 3"
                      strokeWidth={1}
                      strokeOpacity={0.6}
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r={4.5}
                      className="fill-[#2563EB] stroke-[#FFFFFF] dark:stroke-[#131A2B]"
                      strokeWidth={2}
                    />
                  </>
                )}
              </g>
            );
          })}

          {/* X-Axis Dates */}
          {data.map((point, idx) => {
            if (idx % tickStep !== 0 && idx !== data.length - 1) return null;
            const x = getX(idx);
            return (
              <text
                key={point.isoDate}
                x={x}
                y={height - 10}
                textAnchor="middle"
                fontSize="9"
                className="fill-[#5B6577] dark:fill-[#9AA5B8] font-mono"
              >
                {point.dateLabel}
              </text>
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        {hoveredPoint && hoveredIndex !== null && (
          <div
            className="absolute pointer-events-none z-20 bg-[#131A2B] text-[#F4F6F9] dark:bg-[#1B233A] text-xs px-3 py-2 rounded-lg shadow-lg border border-[#1B233A] whitespace-nowrap transform -translate-x-1/2 -translate-y-full"
            style={{
              left: `${((getX(hoveredIndex) / width) * 100).toFixed(1)}%`,
              top: '50px',
            }}
          >
            <div className="font-semibold text-[11px] text-[#9AA5B8] mb-0.5">
              {hoveredPoint.dateLabel}
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#2563EB]" />
              <span className="font-mono font-bold text-sm">
                {(viewMode === 'daily'
                  ? hoveredPoint.count
                  : hoveredPoint.cumulativeCount
                ).toLocaleString()}
              </span>
              <span className="text-[10px] text-[#9AA5B8]">
                {viewMode === 'daily' ? 'new bookmarks' : 'total saves'}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
