import { useState } from 'react';
import { TRAFFIC_TREND_7D, TRAFFIC_TREND_30D, TrafficDataPoint } from '../../data/adminOverviewData';

function getBezierPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return '';
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const current = points[i];
    const next = points[i + 1];
    const controlX = (current.x + next.x) / 2;
    d += ` C ${controlX} ${current.y}, ${controlX} ${next.y}, ${next.x} ${next.y}`;
  }
  return d;
}

export function TrafficChart() {
  const [timeframe, setTimeframe] = useState<'7d' | '30d'>('7d');
  const [hoveredPoint, setHoveredPoint] = useState<TrafficDataPoint | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const data = timeframe === '7d' ? TRAFFIC_TREND_7D : TRAFFIC_TREND_30D;

  // Chart coordinates calculation
  const width = 600;
  const height = 230;
  const paddingLeft = 36;
  const paddingRight = 24;
  const paddingTop = 20;
  const paddingBottom = 32;

  const maxViews = Math.max(...data.map((d) => Math.max(d.pageViews, d.uniqueVisitors)), 1);

  const getX = (index: number) => {
    if (data.length <= 1) return paddingLeft;
    return paddingLeft + (index / (data.length - 1)) * (width - paddingLeft - paddingRight);
  };

  const getY = (value: number) => {
    return height - paddingBottom - (value / maxViews) * (height - paddingTop - paddingBottom);
  };

  const viewsPoints = data.map((d, i) => ({ x: getX(i), y: getY(d.pageViews) }));
  const visitorsPoints = data.map((d, i) => ({ x: getX(i), y: getY(d.uniqueVisitors) }));

  const pageViewsPath = getBezierPath(viewsPoints);
  const uniqueVisitorsPath = getBezierPath(visitorsPoints);

  const lastX = viewsPoints[viewsPoints.length - 1]?.x || width - paddingRight;
  const firstX = viewsPoints[0]?.x || paddingLeft;
  const bottomY = height - paddingBottom;

  const viewsAreaPath = `${pageViewsPath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  const visitorsAreaPath = `${uniqueVisitorsPath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;

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
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-heading font-bold text-[#1E1035]">
              Traffic Trend Overview
            </h2>
            <span className="text-[10px] font-heading font-bold px-2 py-0.5 rounded-full bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]">
              Live Engine
            </span>
          </div>
          <p className="text-xs text-[#6D6582] mt-0.5">
            Real visitor interactions and unique session metrics
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Timeframe Pill Switcher */}
          <div className="flex items-center p-0.5 rounded-lg bg-[#FAF9FE] border border-[#EDE9FE]">
            <button
              type="button"
              id="timeframe-7d-btn"
              onClick={() => {
                setTimeframe('7d');
                setHoveredIndex(null);
                setHoveredPoint(null);
              }}
              className={`px-2.5 py-1 text-xs font-heading font-semibold rounded-md transition-all duration-200 cursor-pointer ${
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
              onClick={() => {
                setTimeframe('30d');
                setHoveredIndex(null);
                setHoveredPoint(null);
              }}
              className={`px-2.5 py-1 text-xs font-heading font-semibold rounded-md transition-all duration-200 cursor-pointer ${
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
          <span className="w-2.5 h-2.5 rounded-full bg-[#7C3AED] shadow-[0_0_8px_rgba(124,58,237,0.5)]" />
          <span className="text-[#6D6582]">Page Views:</span>
          <span className="font-bold font-mono text-[#1E1035]">
            {totalViews.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-[#059669] shadow-[0_0_8px_rgba(5,150,105,0.4)]" />
          <span className="text-[#6D6582]">Unique Visitors:</span>
          <span className="font-bold font-mono text-[#1E1035]">
            {totalVisitors.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Responsive Animated SVG Line Chart */}
      <div className="relative w-full overflow-hidden">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
          onMouseLeave={() => {
            setHoveredPoint(null);
            setHoveredIndex(null);
          }}
        >
          {/* Gradients */}
          <defs>
            <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.32" />
              <stop offset="60%" stopColor="#7C3AED" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="greenGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#059669" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
            </linearGradient>
            <filter id="chartGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#7C3AED" floodOpacity="0.3" />
            </filter>
          </defs>

          {/* Subtle Grid Lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
            const y = height - paddingBottom - ratio * (height - paddingTop - paddingBottom);
            return (
              <g key={ratio}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="currentColor"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                  className="text-[#EDE9FE]"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className="text-[9.5px] fill-[#9D95B3] font-mono"
                >
                  {Math.round(maxViews * ratio)}
                </text>
              </g>
            );
          })}

          {/* Unique Visitors Area fill */}
          <path
            d={visitorsAreaPath}
            fill="url(#greenGradient)"
            className="transition-all duration-700 ease-out"
          />

          {/* Page Views Area fill */}
          <path
            d={viewsAreaPath}
            fill="url(#purpleGradient)"
            className="transition-all duration-700 ease-out"
          />

          {/* Unique Visitors Smooth Curved Line */}
          <path
            d={uniqueVisitorsPath}
            fill="none"
            stroke="#059669"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="transition-all duration-700 ease-out opacity-90"
          />

          {/* Page Views Smooth Curved Line (Primary accent with drop shadow) */}
          <path
            d={pageViewsPath}
            fill="none"
            stroke="#7C3AED"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            filter="url(#chartGlow)"
            className="transition-all duration-700 ease-out"
          />

          {/* Interactive Crosshair when hovered */}
          {hoveredIndex !== null && (
            <line
              x1={getX(hoveredIndex)}
              y1={paddingTop}
              x2={getX(hoveredIndex)}
              y2={bottomY}
              stroke="#7C3AED"
              strokeWidth="1.2"
              strokeDasharray="3 3"
              className="opacity-70 animate-pulse pointer-events-none"
            />
          )}

          {/* Interactive Hover Dots */}
          {data.map((point, i) => {
            const x = getX(i);
            const yViews = getY(point.pageViews);
            const yVisitors = getY(point.uniqueVisitors);
            const isHovered = hoveredIndex === i;

            return (
              <g
                key={point.label}
                className="cursor-pointer"
                onMouseEnter={() => {
                  setHoveredPoint(point);
                  setHoveredIndex(i);
                }}
              >
                {/* Generous Hit target */}
                <rect
                  x={x - 12}
                  y={paddingTop}
                  width={24}
                  height={height - paddingTop}
                  fill="transparent"
                />

                {/* Visitors Dot */}
                <circle
                  cx={x}
                  cy={yVisitors}
                  r={isHovered ? 4 : 2.5}
                  className={`transition-all duration-200 ${
                    isHovered
                      ? 'fill-[#059669] stroke-white stroke-2'
                      : 'fill-[#059669] opacity-80'
                  }`}
                />

                {/* Views Dot with pulse ring on hover */}
                {isHovered && (
                  <circle
                    cx={x}
                    cy={yViews}
                    r={9}
                    className="fill-[#7C3AED]/20 animate-ping"
                  />
                )}
                <circle
                  cx={x}
                  cy={yViews}
                  r={isHovered ? 5.5 : 3.5}
                  className={`transition-all duration-200 ${
                    isHovered
                      ? 'fill-[#7C3AED] stroke-white stroke-2 shadow-sm'
                      : 'fill-[#7C3AED]'
                  }`}
                />

                {/* X-axis date labels */}
                {(data.length <= 10 || i % 3 === 0 || i === data.length - 1) && (
                  <text
                    x={x}
                    y={height - 8}
                    textAnchor="middle"
                    className={`text-[10px] transition-colors duration-200 ${
                      isHovered ? 'fill-[#7C3AED] font-bold' : 'fill-[#9D95B3] font-medium'
                    }`}
                  >
                    {point.label}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Floating Animated Tooltip Card */}
        {hoveredPoint && (
          <div
            className="absolute top-2 right-2 bg-[#1E1035]/95 backdrop-blur-md text-[#FAF9FE] border border-[#DDD6FE]/30 rounded-xl p-3 shadow-xl text-xs pointer-events-none z-10 transition-all duration-200 animate-in fade-in zoom-in-95"
          >
            <div className="font-heading font-semibold border-b border-white/10 pb-1 mb-1.5 text-[11px] text-[#DDD6FE] flex items-center justify-between gap-4">
              <span>{hoveredPoint.label}</span>
              <span className="text-[10px] text-[#A78BFA] font-mono">Live Stats</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[#DDD6FE] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />
                  Page Views:
                </span>
                <span className="font-bold font-mono text-[#FFFFFF]">
                  {hoveredPoint.pageViews.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[#BBF7D0] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                  Unique Visitors:
                </span>
                <span className="font-bold font-mono text-[#FFFFFF]">
                  {hoveredPoint.uniqueVisitors.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
