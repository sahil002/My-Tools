import React, { useState } from 'react';
import { DailyTrendPoint, TimeframePeriod } from '../../services/toolAnalyticsService';
import { Eye, MousePointerClick, Clock } from 'lucide-react';

interface ToolTrendChartProps {
  toolName: string;
  data: DailyTrendPoint[];
  timeframe: TimeframePeriod;
  onTimeframeChange: (timeframe: TimeframePeriod) => void;
}

type ActiveMetric = 'both' | 'views' | 'uses' | 'time';

export function ToolTrendChart({
  toolName,
  data,
  timeframe,
  onTimeframeChange,
}: ToolTrendChartProps) {
  const [activeMetric, setActiveMetric] = useState<ActiveMetric>('both');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="bg-[#FFFFFF] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-xl p-8 text-center text-[#64748B]">
        No trend data available for this tool.
      </div>
    );
  }

  // Calculate bounds
  const maxViews = Math.max(...data.map((d) => d.views), 10);
  const maxUses = Math.max(...data.map((d) => d.uses), 10);
  const maxTime = Math.max(...data.map((d) => d.avgTimeSec), 10);

  // SVG Chart dimensions
  const width = 760;
  const height = 260;
  const padLeft = 48;
  const padRight = 24;
  const padTop = 24;
  const padBottom = 36;
  const innerWidth = width - padLeft - padRight;
  const innerHeight = height - padTop - padBottom;

  const getX = (index: number) => {
    if (data.length <= 1) return padLeft + innerWidth / 2;
    return padLeft + (index / (data.length - 1)) * innerWidth;
  };

  // Primary scale (views or dual scale)
  const maxPrimaryVal = activeMetric === 'time' ? maxTime * 1.15 : Math.max(maxViews, maxUses) * 1.12;

  const getY = (val: number) => {
    return padTop + innerHeight - (val / maxPrimaryVal) * innerHeight;
  };

  // SVG Line paths
  const viewsPath = data.reduce((acc, point, index) => {
    const x = getX(index);
    const y = getY(point.views);
    return index === 0 ? `M ${x.toFixed(1)},${y.toFixed(1)}` : `${acc} L ${x.toFixed(1)},${y.toFixed(1)}`;
  }, '');

  const usesPath = data.reduce((acc, point, index) => {
    const x = getX(index);
    const y = getY(point.uses);
    return index === 0 ? `M ${x.toFixed(1)},${y.toFixed(1)}` : `${acc} L ${x.toFixed(1)},${y.toFixed(1)}`;
  }, '');

  const timePath = data.reduce((acc, point, index) => {
    const x = getX(index);
    const y = getY(point.avgTimeSec);
    return index === 0 ? `M ${x.toFixed(1)},${y.toFixed(1)}` : `${acc} L ${x.toFixed(1)},${y.toFixed(1)}`;
  }, '');

  // Horizontal Grid Lines (4 steps)
  const gridLevels = [0, 0.25, 0.5, 0.75, 1];

  const totalViews = data.reduce((acc, d) => acc + d.views, 0);
  const totalUses = data.reduce((acc, d) => acc + d.uses, 0);
  const avgTime = Math.round(data.reduce((acc, d) => acc + d.avgTimeSec, 0) / data.length);

  const hoveredPoint = hoveredIndex !== null ? data[hoveredIndex] : null;

  return (
    <div
      id="tool-trend-analytics-card"
      className="bg-[#FFFFFF] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-xl p-5 sm:p-6 transition-colors shadow-2xs"
    >
      {/* Chart Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              Historical Performance Trend
            </h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#F1F5F9] dark:bg-[#1E293B] font-mono text-[#64748B] dark:text-[#94A3B8]">
              {toolName}
            </span>
          </div>
          <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
            Daily engagement, clicks, and session metrics
          </p>
        </div>

        {/* Controls: Metric Filter + Timeframe Toggle */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Metric Switcher */}
          <div className="flex items-center p-0.5 rounded-lg bg-[#F8FAFC] dark:bg-[#131B2E] border border-[#E2E8F0] dark:border-[#1E293B] text-xs">
            <button
              type="button"
              id="chart-metric-both-btn"
              onClick={() => setActiveMetric('both')}
              className={`px-2.5 py-1 font-semibold rounded-md transition-colors cursor-pointer ${
                activeMetric === 'both'
                  ? 'bg-[#FFFFFF] dark:bg-[#0F172A] text-[#0F172A] dark:text-[#F8FAFC] shadow-2xs'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A]'
              }`}
            >
              All Metrics
            </button>
            <button
              type="button"
              id="chart-metric-views-btn"
              onClick={() => setActiveMetric('views')}
              className={`px-2.5 py-1 font-semibold rounded-md transition-colors cursor-pointer ${
                activeMetric === 'views'
                  ? 'bg-[#FFFFFF] dark:bg-[#0F172A] text-[#2563EB] shadow-2xs'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A]'
              }`}
            >
              Views
            </button>
            <button
              type="button"
              id="chart-metric-uses-btn"
              onClick={() => setActiveMetric('uses')}
              className={`px-2.5 py-1 font-semibold rounded-md transition-colors cursor-pointer ${
                activeMetric === 'uses'
                  ? 'bg-[#FFFFFF] dark:bg-[#0F172A] text-[#64748B] dark:text-[#CBD5E1] shadow-2xs'
                  : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A]'
              }`}
            >
              Uses/Clicks
            </button>
          </div>

          {/* Timeframe Switcher (7 / 30 / 90 days) */}
          <div className="flex items-center p-0.5 rounded-lg bg-[#F1F5F9] dark:bg-[#1E293B] border border-[#E2E8F0] dark:border-[#334155] text-xs font-semibold">
            {(['7d', '30d', '90d'] as TimeframePeriod[]).map((tf) => (
              <button
                key={tf}
                type="button"
                id={`timeframe-${tf}-btn`}
                onClick={() => onTimeframeChange(tf)}
                className={`px-3 py-1 rounded-md transition-colors cursor-pointer ${
                  timeframe === tf
                    ? 'bg-[#FFFFFF] dark:bg-[#0F172A] text-[#0F172A] dark:text-[#F8FAFC] shadow-2xs'
                    : 'text-[#64748B] dark:text-[#94A3B8] hover:text-[#0F172A] dark:hover:text-[#F8FAFC]'
                }`}
              >
                {tf === '7d' ? '7 Days' : tf === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Aggregate KPI ribbon for the active timeframe */}
      <div className="grid grid-cols-3 gap-3 mb-5 p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#131B2E] border border-[#E2E8F0] dark:border-[#1E293B]">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
          <div>
            <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8] block">Period Views</span>
            <span className="font-mono text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              {totalViews.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#64748B] dark:bg-[#94A3B8]" />
          <div>
            <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8] block">Period Invocations</span>
            <span className="font-mono text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              {totalUses.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="w-3 h-3 text-[#64748B]" />
          <div>
            <span className="text-[11px] text-[#64748B] dark:text-[#94A3B8] block">Avg Time on Page</span>
            <span className="font-mono text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              {Math.floor(avgTime / 60)}m {avgTime % 60}s
            </span>
          </div>
        </div>
      </div>

      {/* Interactive SVG Canvas */}
      <div className="relative w-full overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible text-xs font-mono"
          aria-label={`Performance chart showing trend over ${timeframe} for ${toolName}`}
        >
          {/* Horizontal Gridlines */}
          {gridLevels.map((lvl, idx) => {
            const y = padTop + innerHeight - lvl * innerHeight;
            const labelVal = Math.round(lvl * maxPrimaryVal);

            return (
              <g key={idx}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="currentColor"
                  className="text-[#E2E8F0] dark:text-[#1E293B]"
                  strokeDasharray={idx === 0 ? 'none' : '3 3'}
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 8}
                  y={y + 3}
                  textAnchor="end"
                  fill="currentColor"
                  className="text-[#94A3B8] text-[10px]"
                >
                  {labelVal >= 1000 ? `${(labelVal / 1000).toFixed(1)}k` : labelVal}
                </text>
              </g>
            );
          })}

          {/* X-Axis Date Ticks */}
          {data.map((point, idx) => {
            // Only render every Nth label to prevent clutter on 30d/90d
            const step = data.length > 30 ? Math.ceil(data.length / 7) : data.length > 10 ? 4 : 1;
            const isLast = idx === data.length - 1;
            const isFirst = idx === 0;
            const shouldRender = isFirst || isLast || idx % step === 0;

            if (!shouldRender) return null;
            const x = getX(idx);

            return (
              <text
                key={idx}
                x={x}
                y={height - 10}
                textAnchor={isFirst ? 'start' : isLast ? 'end' : 'middle'}
                fill="currentColor"
                className="text-[#94A3B8] text-[10px]"
              >
                {point.dateLabel}
              </text>
            );
          })}

          {/* Path: Total Views Line (Primary Accent Blue #2563EB) */}
          {(activeMetric === 'both' || activeMetric === 'views') && (
            <path
              d={viewsPath}
              fill="none"
              stroke="#2563EB"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Path: Total Uses/Clicks Line (Secondary Slate #64748B) */}
          {(activeMetric === 'both' || activeMetric === 'uses') && (
            <path
              d={usesPath}
              fill="none"
              stroke="#64748B"
              strokeWidth="2"
              strokeDasharray={activeMetric === 'both' ? '4 3' : 'none'}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Path: Avg Time on Page */}
          {activeMetric === 'time' && (
            <path
              d={timePath}
              fill="none"
              stroke="#0D9488"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {/* Interactive Hover Guides & Hotspots */}
          {data.map((point, idx) => {
            const x = getX(idx);
            const isHovered = hoveredIndex === idx;

            return (
              <g key={idx}>
                {/* Invisible wide hotspot */}
                <rect
                  x={x - innerWidth / (data.length * 2)}
                  y={padTop}
                  width={innerWidth / data.length}
                  height={innerHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />

                {/* Vertical hover indicator line */}
                {isHovered && (
                  <>
                    <line
                      x1={x}
                      y1={padTop}
                      x2={x}
                      y2={padTop + innerHeight}
                      stroke="#2563EB"
                      strokeWidth="1.5"
                      strokeDasharray="2 2"
                    />
                    {/* Primary circle on views */}
                    <circle
                      cx={x}
                      cy={getY(point.views)}
                      r="4"
                      fill="#2563EB"
                      className="stroke-white dark:stroke-slate-900"
                      strokeWidth="2"
                    />
                    {/* Secondary circle on uses */}
                    <circle
                      cx={x}
                      cy={getY(point.uses)}
                      r="3.5"
                      fill="#64748B"
                      className="stroke-white dark:stroke-slate-900"
                      strokeWidth="1.5"
                    />
                  </>
                )}
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        {hoveredPoint && hoveredIndex !== null && (
          <div
            className="absolute top-2 pointer-events-none transition-all duration-75 z-20"
            style={{
              left: `${Math.min(
                Math.max(12, (getX(hoveredIndex) / width) * 100 - 15),
                70
              )}%`,
            }}
          >
            <div className="bg-[#0F172A] dark:bg-[#1E293B] text-white p-2.5 rounded-lg shadow-lg border border-[#334155] text-xs font-sans min-w-[140px]">
              <p className="font-semibold text-white border-b border-[#334155] pb-1 mb-1.5 flex items-center justify-between">
                <span>{hoveredPoint.dateLabel}</span>
                <span className="text-[10px] text-[#94A3B8]">{hoveredPoint.isoDate}</span>
              </p>

              <div className="space-y-1 font-mono text-[11px]">
                <div className="flex items-center justify-between gap-3 text-[#93C5FD]">
                  <span className="flex items-center gap-1.5 font-sans">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#2563EB]" />
                    Views:
                  </span>
                  <span className="font-bold">{hoveredPoint.views.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between gap-3 text-[#CBD5E1]">
                  <span className="flex items-center gap-1.5 font-sans">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#94A3B8]" />
                    Invocations:
                  </span>
                  <span className="font-bold">{hoveredPoint.uses.toLocaleString()}</span>
                </div>

                <div className="flex items-center justify-between gap-3 text-[#E2E8F0]">
                  <span className="flex items-center gap-1.5 font-sans">
                    <Clock className="w-2.5 h-2.5 text-[#94A3B8]" />
                    Avg Time:
                  </span>
                  <span>{hoveredPoint.avgTimeSec}s</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Legend */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-[#E2E8F0] dark:border-[#1E293B] text-xs text-[#64748B] dark:text-[#94A3B8]">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#2563EB] inline-block" />
            <span>Page Views</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-[#64748B] inline-block border-t border-dashed" />
            <span>Calculations / Uses</span>
          </div>
        </div>

        <div className="text-[11px]">
          Hover points to inspect precise daily figures
        </div>
      </div>
    </div>
  );
}
