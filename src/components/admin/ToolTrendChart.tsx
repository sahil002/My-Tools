import { useState } from 'react';
import { DailyTrendPoint, TimeframePeriod } from '../../services/toolAnalyticsService';
import { Eye, MousePointerClick, Clock, Sparkles } from 'lucide-react';

interface ToolTrendChartProps {
  toolName: string;
  data: DailyTrendPoint[];
  timeframe: TimeframePeriod;
  onTimeframeChange: (timeframe: TimeframePeriod) => void;
}

type ActiveMetric = 'both' | 'views' | 'uses' | 'time';

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
      <div className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-8 text-center text-[#6D6582]">
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

  // Points for smooth bezier curve
  const viewsPoints = data.map((d, i) => ({ x: getX(i), y: getY(d.views) }));
  const usesPoints = data.map((d, i) => ({ x: getX(i), y: getY(d.uses) }));
  const timePoints = data.map((d, i) => ({ x: getX(i), y: getY(d.avgTimeSec) }));

  const viewsPath = getBezierPath(viewsPoints);
  const usesPath = getBezierPath(usesPoints);
  const timePath = getBezierPath(timePoints);

  const lastX = getX(data.length - 1);
  const firstX = getX(0);
  const bottomY = padTop + innerHeight;

  const viewsAreaPath = `${viewsPath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  const usesAreaPath = `${usesPath} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;

  // Horizontal Grid Lines (4 steps)
  const gridLevels = [0, 0.25, 0.5, 0.75, 1];

  const totalViews = data.reduce((acc, d) => acc + d.views, 0);
  const totalUses = data.reduce((acc, d) => acc + d.uses, 0);
  const avgTime = Math.round(data.reduce((acc, d) => acc + d.avgTimeSec, 0) / data.length);

  const hoveredPoint = hoveredIndex !== null ? data[hoveredIndex] : null;

  return (
    <div
      id="tool-trend-analytics-card"
      className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-5 sm:p-6 transition-colors shadow-2xs"
    >
      {/* Chart Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-heading font-bold text-[#1E1035]">
              Historical Performance Trend
            </h3>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#F5F3FF] border border-[#DDD6FE] font-mono text-[#7C3AED]">
              {toolName}
            </span>
          </div>
          <p className="text-xs text-[#6D6582] mt-0.5">
            Daily engagement, clicks, and session metrics
          </p>
        </div>

        {/* Controls: Metric Filter + Timeframe Toggle */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Metric Switcher */}
          <div className="flex items-center p-0.5 rounded-lg bg-[#FAF9FE] border border-[#EDE9FE] text-xs">
            <button
              type="button"
              id="chart-metric-both-btn"
              onClick={() => setActiveMetric('both')}
              className={`px-2.5 py-1 font-semibold rounded-md transition-all duration-200 cursor-pointer ${
                activeMetric === 'both'
                  ? 'bg-[#7C3AED] text-white shadow-2xs'
                  : 'text-[#6D6582] hover:text-[#1E1035]'
              }`}
            >
              All Metrics
            </button>
            <button
              type="button"
              id="chart-metric-views-btn"
              onClick={() => setActiveMetric('views')}
              className={`px-2.5 py-1 font-semibold rounded-md transition-all duration-200 cursor-pointer ${
                activeMetric === 'views'
                  ? 'bg-[#7C3AED] text-white shadow-2xs'
                  : 'text-[#6D6582] hover:text-[#1E1035]'
              }`}
            >
              Views
            </button>
            <button
              type="button"
              id="chart-metric-uses-btn"
              onClick={() => setActiveMetric('uses')}
              className={`px-2.5 py-1 font-semibold rounded-md transition-all duration-200 cursor-pointer ${
                activeMetric === 'uses'
                  ? 'bg-[#7C3AED] text-white shadow-2xs'
                  : 'text-[#6D6582] hover:text-[#1E1035]'
              }`}
            >
              Uses/Clicks
            </button>
          </div>

          {/* Timeframe Switcher (7 / 30 / 90 days) */}
          <div className="flex items-center p-0.5 rounded-lg bg-[#FAF9FE] border border-[#EDE9FE] text-xs font-semibold">
            {(['7d', '30d', '90d'] as TimeframePeriod[]).map((tf) => (
              <button
                key={tf}
                type="button"
                id={`timeframe-${tf}-btn`}
                onClick={() => {
                  onTimeframeChange(tf);
                  setHoveredIndex(null);
                }}
                className={`px-3 py-1 rounded-md transition-all duration-200 cursor-pointer ${
                  timeframe === tf
                    ? 'bg-[#7C3AED] text-white shadow-2xs'
                    : 'text-[#6D6582] hover:text-[#1E1035]'
                }`}
              >
                {tf === '7d' ? '7 Days' : tf === '30d' ? '30 Days' : '90 Days'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Aggregate KPI ribbon for the active timeframe */}
      <div className="grid grid-cols-3 gap-3 mb-5 p-3 rounded-xl bg-[#FAF9FE] border border-[#EDE9FE]">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#7C3AED] shadow-[0_0_8px_rgba(124,58,237,0.5)]" />
          <div>
            <span className="text-[11px] text-[#6D6582] block">Period Views</span>
            <span className="font-mono text-xs font-bold text-[#1E1035]">
              {totalViews.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-[#059669] shadow-[0_0_8px_rgba(5,150,105,0.4)]" />
          <div>
            <span className="text-[11px] text-[#6D6582] block">Period Invocations</span>
            <span className="font-mono text-xs font-bold text-[#1E1035]">
              {totalUses.toLocaleString()}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-[#7C3AED]" />
          <div>
            <span className="text-[11px] text-[#6D6582] block">Avg Time on Page</span>
            <span className="font-mono text-xs font-bold text-[#1E1035]">
              {Math.floor(avgTime / 60)}m {avgTime % 60}s
            </span>
          </div>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="relative w-full overflow-hidden select-none">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {/* Gradients */}
          <defs>
            <linearGradient id="trendPurpleGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.28" />
              <stop offset="70%" stopColor="#7C3AED" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="trendEmeraldGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#059669" stopOpacity="0.22" />
              <stop offset="70%" stopColor="#059669" stopOpacity="0.04" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.0" />
            </linearGradient>
            <filter id="trendGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#7C3AED" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Grid lines */}
          {gridLevels.map((lvl) => {
            const y = padTop + innerHeight - lvl * innerHeight;
            const labelVal = Math.round(lvl * maxPrimaryVal);

            return (
              <g key={lvl}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke="currentColor"
                  strokeDasharray="4 4"
                  strokeWidth="1"
                  className="text-[#EDE9FE]"
                />
                <text
                  x={padLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className="text-[9.5px] fill-[#9D95B3] font-mono"
                >
                  {labelVal}
                </text>
              </g>
            );
          })}

          {/* Area Fills */}
          {(activeMetric === 'both' || activeMetric === 'uses') && (
            <path
              d={usesAreaPath}
              fill="url(#trendEmeraldGradient)"
              className="transition-all duration-700 ease-out"
            />
          )}

          {(activeMetric === 'both' || activeMetric === 'views') && (
            <path
              d={viewsAreaPath}
              fill="url(#trendPurpleGradient)"
              className="transition-all duration-700 ease-out"
            />
          )}

          {/* Uses / Invocations Curve */}
          {(activeMetric === 'both' || activeMetric === 'uses') && (
            <path
              d={usesPath}
              fill="none"
              stroke="#059669"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-700 ease-out opacity-90"
            />
          )}

          {/* Views Curve (Primary) */}
          {(activeMetric === 'both' || activeMetric === 'views') && (
            <path
              d={viewsPath}
              fill="none"
              stroke="#7C3AED"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#trendGlow)"
              className="transition-all duration-700 ease-out"
            />
          )}

          {/* Time Curve */}
          {activeMetric === 'time' && (
            <path
              d={timePath}
              fill="none"
              stroke="#F59E0B"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-all duration-700 ease-out"
            />
          )}

          {/* Interactive Crosshair when hovered */}
          {hoveredIndex !== null && (
            <line
              x1={getX(hoveredIndex)}
              y1={padTop}
              x2={getX(hoveredIndex)}
              y2={bottomY}
              stroke="#7C3AED"
              strokeWidth="1.2"
              strokeDasharray="3 3"
              className="opacity-70 animate-pulse pointer-events-none"
            />
          )}

          {/* Interactive Hover Dots & Hit targets */}
          {data.map((point, index) => {
            const x = getX(index);
            const yViews = getY(point.views);
            const yUses = getY(point.uses);
            const isHovered = hoveredIndex === index;

            return (
              <g
                key={point.isoDate || point.dateLabel}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIndex(index)}
              >
                {/* Generous hit rect */}
                <rect
                  x={x - 12}
                  y={padTop}
                  width={24}
                  height={innerHeight}
                  fill="transparent"
                />

                {/* Uses dot */}
                {(activeMetric === 'both' || activeMetric === 'uses') && (
                  <circle
                    cx={x}
                    cy={yUses}
                    r={isHovered ? 4.5 : 2.5}
                    className={`transition-all duration-200 ${
                      isHovered ? 'fill-[#059669] stroke-white stroke-2' : 'fill-[#059669]'
                    }`}
                  />
                )}

                {/* Views dot with pulse ring */}
                {(activeMetric === 'both' || activeMetric === 'views') && (
                  <>
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
                        isHovered ? 'fill-[#7C3AED] stroke-white stroke-2 shadow-sm' : 'fill-[#7C3AED]'
                      }`}
                    />
                  </>
                )}

                {/* Date label */}
                {(data.length <= 10 || index % 3 === 0 || index === data.length - 1) && (
                  <text
                    x={x}
                    y={height - 10}
                    textAnchor="middle"
                    className={`text-[9.5px] transition-colors duration-200 ${
                      isHovered ? 'fill-[#7C3AED] font-bold' : 'fill-[#9D95B3] font-medium'
                    }`}
                  >
                    {point.dateLabel}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip Card */}
        {hoveredPoint && (
          <div
            className="absolute top-2 right-2 bg-[#1E1035]/95 backdrop-blur-md text-[#FAF9FE] border border-[#DDD6FE]/30 rounded-xl p-3 shadow-xl text-xs pointer-events-none z-10 transition-all duration-200 animate-in fade-in zoom-in-95"
          >
            <div className="font-heading font-semibold border-b border-white/10 pb-1 mb-1.5 text-[11px] text-[#DDD6FE] flex items-center justify-between gap-4">
              <span>{hoveredPoint.dateLabel}</span>
              <span className="text-[10px] text-[#A78BFA] font-mono">Usage</span>
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[#DDD6FE] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />
                  Views:
                </span>
                <span className="font-bold font-mono text-[#FFFFFF]">
                  {hoveredPoint.views.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[#BBF7D0] flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#059669]" />
                  Uses / Clicks:
                </span>
                <span className="font-bold font-mono text-[#FFFFFF]">
                  {hoveredPoint.uses.toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-amber-200 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  Avg Duration:
                </span>
                <span className="font-bold font-mono text-[#FFFFFF]">
                  {hoveredPoint.avgTimeSec}s
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
