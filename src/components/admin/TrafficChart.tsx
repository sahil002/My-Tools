import React, { useState } from 'react';
import { TRAFFIC_TREND_7D, TRAFFIC_TREND_30D, TrafficDataPoint } from '../../data/adminOverviewData';

export function TrafficChart() {
  const [timeframe, setTimeframe] = useState<'7d' | '30d'>('7d');
  const [hoveredPoint, setHoveredPoint] = useState<TrafficDataPoint | null>(null);
  const [, setTooltipPos] = useState<{ x: number; y: number } | null>(null);

  const data = timeframe === '7d' ? TRAFFIC_TREND_7D : TRAFFIC_TREND_30D;

  // Chart coordinates calculation
  const width = 600;
  const height = 220;
  const padding = 30;

  const maxViews = Math.max(...data.map((d) => Math.max(d.pageViews, d.uniqueVisitors)), 1);

  const getX = (index: number) => {
    if (data.length <= 1) return padding;
    return padding + (index / (data.length - 1)) * (width - padding * 2);
  };

  const getY = (value: number) => {
    return height - padding - (value / maxViews) * (height - padding * 2);
  };

  // Build SVG path
  const pageViewsPath = data.reduce((acc, point, index) => {
    const x = getX(index);
    const y = getY(point.pageViews);
    return `${acc} ${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }, '');

  const uniqueVisitorsPath = data.reduce((acc, point, index) => {
    const x = getX(index);
    const y = getY(point.uniqueVisitors);
    return `${acc} ${index === 0 ? 'M' : 'L'} ${x} ${y}`;
  }, '');

  const totalViews = data.reduce((acc, curr) => acc + curr.pageViews, 0);
  const totalVisitors = data.reduce((acc, curr) => acc + curr.uniqueVisitors, 0);

  return (
    <div
      id="traffic-trend-chart-card"
      className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-4 sm:p-5 shadow-xs transition-colors h-full flex flex-col justify-between"
    >
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-heading font-bold text-[#1E1035]">
            Traffic Trend Overview
          </h2>
          <p className="text-xs text-[#6D6582] mt-0.5">
            Page views and unique visitor engagement over time
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Timeframe Pill Switcher */}
          <div className="flex items-center p-0.5 rounded-lg bg-[#FAF9FE] border border-[#EDE9FE]">
            <button
              type="button"
              id="timeframe-7d-btn"
              onClick={() => setTimeframe('7d')}
              className={`px-2.5 py-1 text-xs font-heading font-semibold rounded-md transition-colors cursor-pointer ${
                timeframe === '7d'
                  ? 'bg-[#7C3AED] text-[#FFFFFF] shadow-2xs'
                  : 'text-[#6D6582] hover:text-[#1E1035]'
              }`}
            >
              7 Days
            </button>
            <button
              type="button"
              id="timeframe-30d-btn"
              onClick={() => setTimeframe('30d')}
              className={`px-2.5 py-1 text-xs font-heading font-semibold rounded-md transition-colors cursor-pointer ${
                timeframe === '30d'
                  ? 'bg-[#7C3AED] text-[#FFFFFF] shadow-2xs'
                  : 'text-[#6D6582] hover:text-[#1E1035]'
              }`}
            >
              30 Days
            </button>
          </div>
        </div>
      </div>

      {/* Summary Metrics */}
      <div className="flex items-center gap-5 mb-3 text-xs pb-3 border-b border-[#EDE9FE]">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]" />
          <span className="text-[#6D6582]">Page Views:</span>
          <span className="font-bold font-mono text-[#1E1035]">
            {totalViews.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#059669]" />
          <span className="text-[#6D6582]">Unique Visitors:</span>
          <span className="font-bold font-mono text-[#1E1035]">
            {totalVisitors.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Responsive SVG Line Chart */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto"
          onMouseLeave={() => setHoveredPoint(null)}
        >
          {/* Subtle Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = height - padding - ratio * (height - padding * 2);
            return (
              <g key={ratio}>
                <line
                  x1={padding}
                  y1={y}
                  x2={width - padding}
                  y2={y}
                  stroke="currentColor"
                  strokeDasharray="3 3"
                  strokeWidth="1"
                  className="text-[#EDE9FE]"
                />
                <text
                  x={padding - 6}
                  y={y + 3}
                  textAnchor="end"
                  className="text-[10px] fill-[#9D95B3] font-mono"
                >
                  {Math.round(maxViews * ratio)}
                </text>
              </g>
            );
          })}

          {/* Unique Visitors Area fill */}
          <path
            d={`${uniqueVisitorsPath} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`}
            fill="url(#greenGradient)"
            opacity="0.08"
          />

          {/* Page Views Area fill */}
          <path
            d={`${pageViewsPath} L ${width - padding} ${height - padding} L ${padding} ${height - padding} Z`}
            fill="url(#purpleGradient)"
            opacity="0.12"
          />

          {/* Gradients */}
          <defs>
            <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#059669" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Unique Visitors Line */}
          <path
            d={uniqueVisitorsPath}
            fill="none"
            stroke="#059669"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Page Views Line (Primary accent) */}
          <path
            d={pageViewsPath}
            fill="none"
            stroke="#7C3AED"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Interactive Hover Dots */}
          {data.map((point, i) => {
            const x = getX(i);
            const y = getY(point.pageViews);
            const isHovered = hoveredPoint?.label === point.label;

            return (
              <g
                key={point.label}
                className="cursor-pointer"
                onMouseEnter={(e) => {
                  setHoveredPoint(point);
                  const rect = e.currentTarget.getBoundingClientRect();
                  setTooltipPos({ x: rect.left + rect.width / 2, y: rect.top });
                }}
              >
                {/* Hit target */}
                <circle cx={x} cy={y} r="12" fill="transparent" />

                {/* Visible Data Dot */}
                <circle
                  cx={x}
                  cy={y}
                  r={isHovered ? 5 : 3}
                  className={`transition-all duration-150 ${
                    isHovered
                      ? 'fill-[#7C3AED] stroke-[#FFFFFF] stroke-2'
                      : 'fill-[#7C3AED]'
                  }`}
                />

                {/* X-axis date labels */}
                {(data.length <= 10 || i % 3 === 0 || i === data.length - 1) && (
                  <text
                    x={x}
                    y={height - 5}
                    textAnchor="middle"
                    className="text-[10px] fill-[#9D95B3]"
                  >
                    {point.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute top-2 right-2 bg-[#1E1035] text-[#FAF9FE] border border-[#DDD6FE]/30 rounded-xl p-2.5 shadow-lg text-xs pointer-events-none z-10"
          >
            <div className="font-semibold border-b border-white/10 pb-1 mb-1 text-[11px] text-[#DDD6FE]">
              {hoveredPoint.label}
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[#DDD6FE]">Page Views:</span>
              <span className="font-bold text-[#FFFFFF]">{hoveredPoint.pageViews.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between gap-4">
              <span className="text-[#BBF7D0]">Unique Visitors:</span>
              <span className="font-bold text-[#FFFFFF]">{hoveredPoint.uniqueVisitors.toLocaleString()}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
