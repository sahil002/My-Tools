import { useState, useId } from 'react';
import {
  TrendingUp,
  DollarSign,
  Percent,
  Calendar,
  Layers,
  ArrowUpRight,
  Sparkles,
  BarChart3,
  LineChart as LineChartIcon,
  HelpCircle,
  CheckCircle2,
  Info,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

type CompoundingFrequency = 'daily' | 'monthly' | 'quarterly' | 'semiannual' | 'annual';

interface YearlyData {
  year: number;
  principal: number;
  contributions: number;
  totalInvested: number;
  interestEarned: number;
  endBalance: number;
}

const FREQUENCY_OPTIONS: { id: CompoundingFrequency; label: string; periodsPerYear: number }[] = [
  { id: 'daily', label: 'Daily (365/yr)', periodsPerYear: 365 },
  { id: 'monthly', label: 'Monthly (12/yr)', periodsPerYear: 12 },
  { id: 'quarterly', label: 'Quarterly (4/yr)', periodsPerYear: 4 },
  { id: 'semiannual', label: 'Semi-Annually (2/yr)', periodsPerYear: 2 },
  { id: 'annual', label: 'Annually (1/yr)', periodsPerYear: 1 },
];

export function CompoundInterestCalculator() {
  const gradientId = useId();
  // Calculator State
  const [initialPrincipal, setInitialPrincipal] = useState<number>(10000);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(300);
  const [annualRate, setAnnualRate] = useState<number>(8);
  const [years, setYears] = useState<number>(15);
  const [frequency, setFrequency] = useState<CompoundingFrequency>('monthly');
  const [chartView, setChartView] = useState<'curve' | 'bars'>('curve');
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);

  // Compute compounding schedule
  const periodsPerYear = FREQUENCY_OPTIONS.find((f) => f.id === frequency)?.periodsPerYear || 12;
  const ratePerPeriod = annualRate / 100 / periodsPerYear;
  const contributionPerPeriod = (monthlyContribution * 12) / periodsPerYear;

  const yearlySchedule: YearlyData[] = [];
  let runningPrincipal = initialPrincipal;
  let runningTotalInvested = initialPrincipal;
  let runningBalance = initialPrincipal;
  let cumulativeInterest = 0;

  yearlySchedule.push({
    year: 0,
    principal: initialPrincipal,
    contributions: 0,
    totalInvested: initialPrincipal,
    interestEarned: 0,
    endBalance: initialPrincipal,
  });

  for (let y = 1; y <= years; y++) {
    for (let p = 0; p < periodsPerYear; p++) {
      const periodInterest = runningBalance * ratePerPeriod;
      runningBalance += periodInterest + contributionPerPeriod;
      cumulativeInterest += periodInterest;
      runningTotalInvested += contributionPerPeriod;
    }
    yearlySchedule.push({
      year: y,
      principal: initialPrincipal,
      contributions: Math.round(runningTotalInvested - initialPrincipal),
      totalInvested: Math.round(runningTotalInvested),
      interestEarned: Math.round(cumulativeInterest),
      endBalance: Math.round(runningBalance),
    });
  }

  const finalYear = yearlySchedule[yearlySchedule.length - 1];
  const finalBalance = finalYear.endBalance;
  const finalInvested = finalYear.totalInvested;
  const finalInterest = finalYear.interestEarned;
  const growthMultiplier = finalInvested > 0 ? (finalBalance / finalInvested).toFixed(2) : '1.00';
  const interestPercentage = finalBalance > 0 ? Math.round((finalInterest / finalBalance) * 100) : 0;

  // SVG Chart Geometry
  const svgWidth = 680;
  const svgHeight = 250;
  const padLeft = 60;
  const padRight = 30;
  const padTop = 25;
  const padBottom = 35;
  const plotWidth = svgWidth - padLeft - padRight;
  const plotHeight = svgHeight - padTop - padBottom;

  const maxBalance = Math.max(...yearlySchedule.map((d) => d.endBalance), 1000);

  const getX = (idx: number) => {
    if (yearlySchedule.length <= 1) return padLeft + plotWidth / 2;
    return padLeft + (idx / (yearlySchedule.length - 1)) * plotWidth;
  };

  const getY = (val: number) => {
    return padTop + plotHeight - (val / maxBalance) * plotHeight;
  };

  // Bezier curve paths
  const balancePoints = yearlySchedule.map((d, i) => ({ x: getX(i), y: getY(d.endBalance) }));
  const investedPoints = yearlySchedule.map((d, i) => ({ x: getX(i), y: getY(d.totalInvested) }));

  let balancePath = `M ${balancePoints[0].x} ${balancePoints[0].y}`;
  for (let i = 0; i < balancePoints.length - 1; i++) {
    const curr = balancePoints[i];
    const nxt = balancePoints[i + 1];
    const cx = (curr.x + nxt.x) / 2;
    balancePath += ` C ${cx} ${curr.y}, ${cx} ${nxt.y}, ${nxt.x} ${nxt.y}`;
  }

  let investedPath = `M ${investedPoints[0].x} ${investedPoints[0].y}`;
  for (let i = 0; i < investedPoints.length - 1; i++) {
    const curr = investedPoints[i];
    const nxt = investedPoints[i + 1];
    const cx = (curr.x + nxt.x) / 2;
    investedPath += ` C ${cx} ${curr.y}, ${cx} ${nxt.y}, ${nxt.x} ${nxt.y}`;
  }

  const lastPt = balancePoints[balancePoints.length - 1];
  const firstPt = balancePoints[0];
  const baselineY = padTop + plotHeight;

  const balanceAreaPath = `${balancePath} L ${lastPt.x} ${baselineY} L ${firstPt.x} ${baselineY} Z`;
  const investedAreaPath = `${investedPath} L ${investedPoints[investedPoints.length - 1].x} ${baselineY} L ${investedPoints[0].x} ${baselineY} Z`;

  const activePoint = hoveredYear !== null ? yearlySchedule[hoveredYear] : finalYear;

  return (
    <div className="space-y-6 font-sans">
      {/* 1. Interactive Inputs & Primary Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form Parameters */}
        <div className="lg:col-span-6 bg-[#FAF9FE] border border-[#EDE9FE] rounded-2xl p-5 sm:p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#EDE9FE]">
            <h3 className="text-sm font-heading font-bold text-[#1E1035] flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#7C3AED]" />
              Investment Parameters
            </h3>
            <span className="text-[11px] font-sans text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-emerald-500" />
              Live Compound Math
            </span>
          </div>

          {/* Initial Principal */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <label htmlFor="initial-principal" className="font-heading font-semibold text-[#1E1035]">
                Initial Investment Principal ($)
              </label>
              <span className="font-mono font-bold text-[#7C3AED]">
                ${initialPrincipal.toLocaleString()}
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9D95B3] text-sm font-semibold">
                $
              </span>
              <input
                id="initial-principal"
                type="number"
                min="0"
                step="500"
                value={initialPrincipal}
                onChange={(e) => setInitialPrincipal(Math.max(0, Number(e.target.value) || 0))}
                className="w-full pl-8 pr-4 py-2.5 bg-white border border-[#DDD6FE] focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 rounded-xl text-sm font-mono text-[#1E1035] outline-hidden transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* Monthly Additional Contribution */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <label htmlFor="monthly-contribution" className="font-heading font-semibold text-[#1E1035]">
                Regular Monthly Contribution ($)
              </label>
              <span className="font-mono font-bold text-[#059669]">
                ${monthlyContribution.toLocaleString()}/mo
              </span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9D95B3] text-sm font-semibold">
                $
              </span>
              <input
                id="monthly-contribution"
                type="number"
                min="0"
                step="50"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(Math.max(0, Number(e.target.value) || 0))}
                className="w-full pl-8 pr-4 py-2.5 bg-white border border-[#DDD6FE] focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20 rounded-xl text-sm font-mono text-[#1E1035] outline-hidden transition-all shadow-2xs"
              />
            </div>
          </div>

          {/* Annual Interest Rate (%) */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <label htmlFor="annual-rate" className="font-heading font-semibold text-[#1E1035] flex items-center gap-1.5">
                Estimated Annual Return Rate (%)
                <span className="text-[10px] font-normal text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                  Nominal APY
                </span>
              </label>
              <span className="font-mono font-bold text-[#7C3AED]">{annualRate}%</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                id="annual-rate"
                type="range"
                min="1"
                max="30"
                step="0.25"
                value={annualRate}
                onChange={(e) => setAnnualRate(Number(e.target.value))}
                className="w-full accent-[#7C3AED] cursor-pointer"
              />
              <input
                type="number"
                min="0.1"
                max="50"
                step="0.1"
                value={annualRate}
                onChange={(e) => setAnnualRate(Math.max(0.1, Number(e.target.value) || 0))}
                className="w-20 px-2 py-1.5 bg-white border border-[#DDD6FE] rounded-lg text-xs font-mono text-center font-bold text-[#1E1035] outline-hidden"
              />
            </div>
          </div>

          {/* Investment Time Horizon (Years) */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1.5">
              <label htmlFor="investment-years" className="font-heading font-semibold text-[#1E1035]">
                Investment Horizon
              </label>
              <span className="font-mono font-bold text-[#1E1035]">{years} Years</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                id="investment-years"
                type="range"
                min="1"
                max="40"
                value={years}
                onChange={(e) => setYears(Number(e.target.value))}
                className="w-full accent-[#7C3AED] cursor-pointer"
              />
              <span className="w-20 px-2 py-1.5 bg-white border border-[#DDD6FE] rounded-lg text-xs font-mono text-center font-bold text-[#1E1035]">
                {years} yrs
              </span>
            </div>
          </div>

          {/* Compounding Frequency */}
          <div>
            <label className="block text-xs font-heading font-semibold text-[#1E1035] mb-2">
              Compounding Frequency
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {FREQUENCY_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setFrequency(opt.id)}
                  className={`px-3 py-2 rounded-xl text-xs font-heading font-semibold transition-all border cursor-pointer text-left ${
                    frequency === opt.id
                      ? 'bg-[#7C3AED] text-white border-[#7C3AED] shadow-2xs'
                      : 'bg-white text-[#6D6582] border-[#EDE9FE] hover:border-[#DDD6FE] hover:bg-[#F5F3FF]'
                  }`}
                >
                  <p className="truncate">{opt.label.split(' ')[0]}</p>
                  <span className={`text-[10px] block opacity-80 ${frequency === opt.id ? 'text-white' : 'text-[#9D95B3]'}`}>
                    {opt.periodsPerYear}x / year
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Key Results Metrics & Visual Breakdown */}
        <div className="lg:col-span-6 space-y-4">
          {/* Main Hero Card: Future Portfolio Value */}
          <div className="bg-gradient-to-br from-[#7C3AED] via-[#6D28D9] to-[#5B21B6] rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-4 -translate-y-4 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center justify-between text-xs text-purple-200 mb-2">
              <span className="font-heading font-semibold tracking-wide uppercase">
                Estimated Future Balance
              </span>
              <span className="px-2.5 py-0.5 bg-white/20 rounded-full font-bold text-white text-[11px] backdrop-blur-xs flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-emerald-300" />
                {growthMultiplier}x Growth
              </span>
            </div>
            <div className="text-3xl sm:text-4xl font-heading font-extrabold tracking-tight font-mono text-white mb-3">
              ${finalBalance.toLocaleString()}
            </div>
            <p className="text-xs text-purple-100 font-sans leading-relaxed">
              After {years} years at {annualRate}% annual return with {frequency} compounding.
            </p>

            {/* Quick 2-Column Split */}
            <div className="mt-5 pt-4 border-t border-white/15 grid grid-cols-2 gap-3 text-xs">
              <div className="bg-white/10 rounded-xl p-3 backdrop-blur-xs">
                <span className="text-purple-200 block text-[11px]">Total Out-of-Pocket Invested</span>
                <span className="font-mono text-base font-bold text-white">
                  ${finalInvested.toLocaleString()}
                </span>
                <span className="text-[10px] text-purple-200 block mt-0.5">
                  ({100 - interestPercentage}% of total)
                </span>
              </div>
              <div className="bg-emerald-500/25 border border-emerald-400/30 rounded-xl p-3 backdrop-blur-xs">
                <span className="text-emerald-200 block text-[11px]">Total Accrued Interest</span>
                <span className="font-mono text-base font-bold text-emerald-300">
                  +${finalInterest.toLocaleString()}
                </span>
                <span className="text-[10px] text-emerald-200 block mt-0.5">
                  ({interestPercentage}% free compounding)
                </span>
              </div>
            </div>
          </div>

          {/* Return Breakdown Horizontal Progress Bar */}
          <div className="bg-white border border-[#EDE9FE] rounded-2xl p-4.5 space-y-3 shadow-2xs">
            <div className="flex justify-between items-center text-xs">
              <span className="font-heading font-bold text-[#1E1035]">
                Portfolio Capital Composition
              </span>
              <span className="text-[#6D6582] text-[11px]">
                Year {years} Breakdown
              </span>
            </div>

            <div className="h-4 w-full bg-[#FAF9FE] rounded-full overflow-hidden flex border border-[#DDD6FE]">
              <div
                style={{ width: `${Math.max(2, 100 - interestPercentage)}%` }}
                className="bg-[#7C3AED] transition-all duration-500 ease-out"
                title={`Principal + Contributions: $${finalInvested.toLocaleString()}`}
              />
              <div
                style={{ width: `${Math.max(2, interestPercentage)}%` }}
                className="bg-emerald-500 transition-all duration-500 ease-out"
                title={`Compounded Interest: $${finalInterest.toLocaleString()}`}
              />
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-[#7C3AED]" />
                <span className="text-[#6D6582] text-xs">
                  Your Deposits: <strong className="text-[#1E1035] font-mono">${finalInvested.toLocaleString()}</strong>
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-md bg-emerald-500" />
                <span className="text-[#6D6582] text-xs">
                  Pure Interest: <strong className="text-emerald-600 font-mono">+${finalInterest.toLocaleString()}</strong>
                </span>
              </div>
            </div>
          </div>

          {/* Quick Real Return & Inflation Note with Accent Colors */}
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-heading font-semibold text-amber-900">
                Real Purchasing Power Insight
              </p>
              <p className="text-[11px] text-amber-800/90 leading-relaxed mt-0.5 font-sans">
                Assuming a standard 2.5% inflation rate, your real net purchasing power after {years} years is approximately{' '}
                <span className="font-mono font-bold text-amber-950">
                  ${Math.round(finalBalance / Math.pow(1.025, years)).toLocaleString()}
                </span>. Compounding at {annualRate}% comfortably beats inflation by {(annualRate - 2.5).toFixed(1)}% annually.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Clean Attractive Animated Interactive Growth Graph */}
      <div className="bg-white border border-[#EDE9FE] rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EDE9FE]">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-heading font-bold text-[#1E1035]">
                Compound Growth Trajectory
              </h3>
              <span className="text-[10px] font-heading font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                Animated Projection
              </span>
            </div>
            <p className="text-xs text-[#6D6582] mt-0.5">
              Hover over any point to inspect year-by-year principal vs interest separation
            </p>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="p-1 rounded-xl bg-[#FAF9FE] border border-[#EDE9FE] flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={() => setChartView('curve')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-heading font-semibold transition-all cursor-pointer ${
                  chartView === 'curve'
                    ? 'bg-[#7C3AED] text-white shadow-2xs'
                    : 'text-[#6D6582] hover:text-[#1E1035]'
                }`}
              >
                <LineChartIcon className="w-3.5 h-3.5" />
                <span>Growth Curve</span>
              </button>
              <button
                type="button"
                onClick={() => setChartView('bars')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-heading font-semibold transition-all cursor-pointer ${
                  chartView === 'bars'
                    ? 'bg-[#7C3AED] text-white shadow-2xs'
                    : 'text-[#6D6582] hover:text-[#1E1035]'
                }`}
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Bar Breakdown</span>
              </button>
            </div>
          </div>
        </div>

        {/* Hover inspection strip */}
        <div className="bg-[#FAF9FE] border border-[#EDE9FE] rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-[#6D6582]">Inspecting:</span>
            <span className="font-heading font-bold text-[#1E1035] bg-white px-2 py-0.5 rounded-md border border-[#DDD6FE]">
              Year {activePoint.year}
            </span>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            <div>
              <span className="text-[#6D6582] text-[11px] block">Total Balance</span>
              <span className="font-mono font-bold text-[#7C3AED] text-sm">
                ${activePoint.endBalance.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[#6D6582] text-[11px] block">Deposited</span>
              <span className="font-mono font-bold text-[#1E1035] text-sm">
                ${activePoint.totalInvested.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-[#6D6582] text-[11px] block">Interest Accrued</span>
              <span className="font-mono font-bold text-emerald-600 text-sm">
                +${activePoint.interestEarned.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* The SVG Canvas */}
        <div className="relative w-full overflow-hidden select-none">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto"
            onMouseLeave={() => setHoveredYear(null)}
          >
            <defs>
              <linearGradient id={`${gradientId}-purple`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#7C3AED" stopOpacity="0.4" />
                <stop offset="60%" stopColor="#7C3AED" stopOpacity="0.1" />
                <stop offset="100%" stopColor="#7C3AED" stopOpacity="0.0" />
              </linearGradient>
              <linearGradient id={`${gradientId}-emerald`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0.02" />
              </linearGradient>
              <filter id={`${gradientId}-glow`} x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#7C3AED" floodOpacity="0.3" />
              </filter>
            </defs>

            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = padTop + plotHeight - ratio * plotHeight;
              const val = Math.round(ratio * maxBalance);
              return (
                <g key={ratio}>
                  <line
                    x1={padLeft}
                    y1={y}
                    x2={svgWidth - padRight}
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
                    ${val >= 1000000 ? `${(val / 1000000).toFixed(1)}M` : `${Math.round(val / 1000)}k`}
                  </text>
                </g>
              );
            })}

            {chartView === 'curve' ? (
              <>
                {/* Area under Total Balance */}
                <path
                  d={balanceAreaPath}
                  fill={`url(#${gradientId}-purple)`}
                  className="transition-all duration-500 ease-out"
                />

                {/* Area under Invested Capital */}
                <path
                  d={investedAreaPath}
                  fill={`url(#${gradientId}-emerald)`}
                  className="transition-all duration-500 ease-out opacity-80"
                />

                {/* Invested Capital Line */}
                <path
                  d={investedPath}
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-all duration-500 ease-out"
                />

                {/* Balance Line (Top Curve with Glow) */}
                <path
                  d={balancePath}
                  fill="none"
                  stroke="#7C3AED"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  filter={`url(#${gradientId}-glow)`}
                  className="transition-all duration-500 ease-out"
                />

                {/* Interactive Points on Hover */}
                {yearlySchedule.map((d, i) => {
                  const pt = balancePoints[i];
                  const isHovered = hoveredYear === i;
                  return (
                    <g key={d.year} className="cursor-pointer">
                      {/* Invisible hover capture bar */}
                      <rect
                        x={pt.x - plotWidth / (years * 2)}
                        y={padTop}
                        width={plotWidth / years}
                        height={plotHeight}
                        fill="transparent"
                        onMouseEnter={() => setHoveredYear(i)}
                      />
                      {isHovered && (
                        <>
                          <line
                            x1={pt.x}
                            y1={padTop}
                            x2={pt.x}
                            y2={padTop + plotHeight}
                            stroke="#7C3AED"
                            strokeWidth="1.5"
                            strokeDasharray="2 2"
                            className="animate-in fade-in"
                          />
                          <circle
                            cx={pt.x}
                            cy={pt.y}
                            r="6"
                            fill="#7C3AED"
                            stroke="#FFFFFF"
                            strokeWidth="2.5"
                            className="drop-shadow-sm"
                          />
                          <circle
                            cx={pt.x}
                            cy={investedPoints[i].y}
                            r="4.5"
                            fill="#10B981"
                            stroke="#FFFFFF"
                            strokeWidth="2"
                          />
                        </>
                      )}
                    </g>
                  );
                })}
              </>
            ) : (
              // Stacked Bar View
              yearlySchedule.map((d, i) => {
                if (i === 0) return null;
                const barWidth = Math.max(4, (plotWidth / years) * 0.65);
                const x = getX(i) - barWidth / 2;
                const totalH = (d.endBalance / maxBalance) * plotHeight;
                const investedH = (d.totalInvested / maxBalance) * plotHeight;
                const interestH = Math.max(0, totalH - investedH);
                const isHovered = hoveredYear === i;

                return (
                  <g
                    key={d.year}
                    onMouseEnter={() => setHoveredYear(i)}
                    className="cursor-pointer transition-all duration-200"
                  >
                    {/* Invested Portion (Bottom of Stack) */}
                    <rect
                      x={x}
                      y={padTop + plotHeight - investedH}
                      width={barWidth}
                      height={investedH}
                      fill={isHovered ? '#059669' : '#10B981'}
                      rx="2"
                      className="transition-all duration-300"
                    />
                    {/* Interest Portion (Top of Stack) */}
                    <rect
                      x={x}
                      y={padTop + plotHeight - totalH}
                      width={barWidth}
                      height={interestH}
                      fill={isHovered ? '#6D28D9' : '#7C3AED'}
                      rx="2"
                      className="transition-all duration-300"
                    />
                  </g>
                );
              })
            )}

            {/* X-axis labels (Every few years) */}
            {yearlySchedule.map((d, i) => {
              const step = years <= 10 ? 1 : years <= 20 ? 2 : 5;
              if (i % step !== 0 && i !== yearlySchedule.length - 1) return null;
              return (
                <text
                  key={d.year}
                  x={getX(i)}
                  y={padTop + plotHeight + 16}
                  textAnchor="middle"
                  className="text-[10px] fill-[#6D6582] font-mono"
                >
                  Yr {d.year}
                </text>
              );
            })}
          </svg>
        </div>

        {/* Chart Legend */}
        <div className="flex items-center justify-center gap-6 pt-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#7C3AED] shadow-[0_0_6px_rgba(124,58,237,0.5)]" />
            <span className="text-[#6D6582]">Total Balance (Principal + Interest)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-[#10B981] shadow-[0_0_6px_rgba(16,185,129,0.5)]" />
            <span className="text-[#6D6582]">Contributed Principal</span>
          </div>
        </div>
      </div>

      {/* 3. DOES COMPOUNDING FREQUENCY MATTER? (Full Rich Editorial Content with Numerical Comparison Matrix) */}
      <section className="bg-white border border-[#EDE9FE] rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] text-xs font-heading font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Mathematical Analysis &amp; Practical Guide</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-heading font-bold text-[#1E1035] tracking-tight">
            Does Compounding Frequency Matter? (Deep Dive &amp; Real Scenarios)
          </h2>
          <p className="mt-2 text-sm text-[#6D6582] leading-relaxed font-sans">
            A frequent question among investors, savers, and financial analysts is whether compounding frequency (daily, monthly, quarterly, or annually) makes a measurable difference in overall returns. Here is the mathematical reality and the practical comparison for your exact inputs.
          </p>
        </div>

        {/* Real Dynamic Comparison Matrix for Current Inputs */}
        <div className="border border-[#EDE9FE] rounded-2xl overflow-hidden shadow-2xs">
          <div className="bg-[#FAF9FE] px-4 py-3 border-b border-[#EDE9FE] flex items-center justify-between">
            <h4 className="text-xs font-heading font-bold text-[#1E1035] uppercase tracking-wider">
              Compounding Frequency Comparison (${initialPrincipal.toLocaleString()} initial + ${monthlyContribution}/mo @ {annualRate}% for {years} yrs)
            </h4>
            <span className="text-[11px] text-[#7C3AED] font-semibold">Live Comparison Table</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-white text-[#6D6582] border-b border-[#EDE9FE] font-heading uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-4 py-3">Frequency</th>
                  <th className="px-4 py-3">Periods / Year</th>
                  <th className="px-4 py-3">Effective Annual Rate (EAR)</th>
                  <th className="px-4 py-3">Final Ending Balance</th>
                  <th className="px-4 py-3">Difference vs Annual</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE9FE] font-sans">
                {FREQUENCY_OPTIONS.map((opt) => {
                  const m = opt.periodsPerYear;
                  const ear = (Math.pow(1 + annualRate / 100 / m, m) - 1) * 100;

                  // Compute final balance for this frequency
                  let b = initialPrincipal;
                  const perInterest = annualRate / 100 / m;
                  const perContrib = (monthlyContribution * 12) / m;
                  for (let i = 0; i < years * m; i++) {
                    b += b * perInterest + perContrib;
                  }
                  const roundedB = Math.round(b);

                  // Compute annual baseline
                  let annualB = initialPrincipal;
                  for (let i = 0; i < years; i++) {
                    annualB += annualB * (annualRate / 100) + monthlyContribution * 12;
                  }
                  const diff = roundedB - Math.round(annualB);

                  const isCurrent = opt.id === frequency;

                  return (
                    <tr
                      key={opt.id}
                      className={isCurrent ? 'bg-[#F5F3FF]/70 font-semibold text-[#1E1035]' : 'hover:bg-[#FAF9FE] text-[#1E1035]'}
                    >
                      <td className="px-4 py-3 flex items-center gap-2">
                        {isCurrent && <span className="w-2 h-2 rounded-full bg-[#7C3AED]" />}
                        <span className="font-heading">{opt.label.split(' ')[0]}</span>
                        {isCurrent && (
                          <span className="text-[10px] text-[#7C3AED] bg-white px-1.5 py-0.5 rounded border border-[#DDD6FE]">
                            Active
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono">{m}</td>
                      <td className="px-4 py-3 font-mono text-emerald-600 font-semibold">{ear.toFixed(3)}%</td>
                      <td className="px-4 py-3 font-mono font-bold text-[#7C3AED]">${roundedB.toLocaleString()}</td>
                      <td className="px-4 py-3 font-mono">
                        {diff > 0 ? (
                          <span className="text-emerald-600 font-bold">
                            +${diff.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-[#9D95B3]">Baseline</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* In-depth 3-Column Educational Takeaway */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="p-4 bg-[#FAF9FE] border border-[#EDE9FE] rounded-xl space-y-2">
            <div className="w-8 h-8 rounded-lg bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] flex items-center justify-center font-bold">
              1
            </div>
            <h4 className="text-sm font-heading font-bold text-[#1E1035]">
              Daily vs Monthly: Marginal Difference
            </h4>
            <p className="text-xs text-[#6D6582] leading-relaxed">
              While daily compounding yields slightly higher interest than monthly, the difference over 15–30 years is typically under 1–2%. In contrast, increasing your annual return rate by just 0.5% creates vastly higher returns.
            </p>
          </div>

          <div className="p-4 bg-[#FAF9FE] border border-[#EDE9FE] rounded-xl space-y-2">
            <div className="w-8 h-8 rounded-lg bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] flex items-center justify-center font-bold">
              2
            </div>
            <h4 className="text-sm font-heading font-bold text-[#1E1035]">
              The Real Power: Time &amp; Consistency
            </h4>
            <p className="text-xs text-[#6D6582] leading-relaxed">
              The true driver of compound growth is not how many times per day it compounds, but how many <em>years</em> the capital remains invested. The final 5 years of an investment journey generate more wealth than the first 15 years combined.
            </p>
          </div>

          <div className="p-4 bg-[#FAF9FE] border border-[#EDE9FE] rounded-xl space-y-2">
            <div className="w-8 h-8 rounded-lg bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] flex items-center justify-center font-bold">
              3
            </div>
            <h4 className="text-sm font-heading font-bold text-[#1E1035]">
              Continuous Compounding Formula
            </h4>
            <p className="text-xs text-[#6D6582] leading-relaxed">
              In mathematical limits, as compounding frequency reaches infinity (continuous compounding), the equation transforms to Euler’s number: <code className="text-[#7C3AED] bg-white px-1 py-0.5 rounded border border-[#DDD6FE] font-mono text-[11px]">A = P × e^(rt)</code>, establishing a definitive mathematical ceiling.
            </p>
          </div>
        </div>

        {/* 4. The Rule of 72 & Doubling Times */}
        <div className="p-5 bg-gradient-to-r from-[#FAF8FE] to-[#F5F3FF] border border-[#DDD6FE] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="space-y-1">
            <h4 className="text-sm font-heading font-bold text-[#1E1035] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#7C3AED]" />
              The Rule of 72 for Your Return Rate
            </h4>
            <p className="text-xs text-[#6D6582] max-w-xl leading-relaxed">
              At your current interest rate of <strong className="text-[#1E1035]">{annualRate}%</strong>, your principal investment doubles roughly every{' '}
              <strong className="text-[#7C3AED] font-mono font-bold">
                {(72 / annualRate).toFixed(1)} years
              </strong>{' '}
              without any extra contributions.
            </p>
          </div>
          <div className="shrink-0 px-4 py-2 bg-white rounded-xl border border-[#DDD6FE] shadow-2xs text-center">
            <span className="text-[10px] text-[#6D6582] block uppercase font-heading font-bold">Doubling Time</span>
            <span className="font-mono text-base font-extrabold text-[#7C3AED]">
              ~{(72 / annualRate).toFixed(1)} Yrs
            </span>
          </div>
        </div>
      </section>
    </div>
  );
}
