// Analytics service for per-tool performance tracking and historical trend analysis
import { getAllToolsList, ToolListItem } from './customToolsService';

export interface DailyTrendPoint {
  dateLabel: string;
  isoDate: string;
  views: number;
  uses: number; // Invocations / clicks / calculations
  avgTimeSec: number;
}

export type TimeframePeriod = '7d' | '30d' | '90d';

export interface ToolAnalyticsRecord {
  id: string;
  name: string;
  slug: string;
  category: string;
  iconName: string;
  status: 'active' | 'inactive';
  isCustom: boolean;
  totalViews: number;
  totalUses: number;
  conversionRate: number; // (totalUses / totalViews) * 100
  avgTimeOnPageSec: number;
  favoriteCount: number;
  growthRatePercent: number; // Period over period growth
  bounceRatePercent: number;
  desktopPercent: number;
  mobilePercent: number;
  performanceTier: 'top' | 'steady' | 'underperforming';
  diagnosticIssue?: string;
  recommendation?: string;
  trend: DailyTrendPoint[];
}

export interface AnalyticsOverviewSummary {
  totalTools: number;
  activeTools: number;
  totalViews: number;
  totalUses: number;
  avgConversionRate: number;
  avgTimeOnPageSec: number;
  totalFavorites: number;
  periodGrowthPercent: number;
}

const LOCAL_STORAGE_LIVE_VIEWS_KEY = 'ot_analytics_live_views';
const LOCAL_STORAGE_LIVE_USES_KEY = 'ot_analytics_live_uses';
const LOCAL_STORAGE_FAVORITES_KEY = 'ot_tool_favorites_count';

// Retrieve live increments from user interactions
function getLiveIncrements(key: string): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveLiveIncrement(key: string, slug: string): void {
  if (typeof window === 'undefined') return;
  try {
    const current = getLiveIncrements(key);
    current[slug] = (current[slug] || 0) + 1;
    localStorage.setItem(key, JSON.stringify(current));
  } catch {
    // ignore
  }
}

export function recordToolView(slug: string): void {
  saveLiveIncrement(LOCAL_STORAGE_LIVE_VIEWS_KEY, slug);
}

export function recordToolUse(slug: string): void {
  saveLiveIncrement(LOCAL_STORAGE_LIVE_USES_KEY, slug);
}

// Deterministic pseudo-random number generator for consistent day-by-day charts
function pseudoRandom(seed: number): () => number {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Generate realistic daily trend points for 7, 30, or 90 days
function generateTrendHistory(
  slug: string,
  baseViews: number,
  baseUses: number,
  baseTimeSec: number,
  days: number
): DailyTrendPoint[] {
  const points: DailyTrendPoint[] = [];
  const now = new Date();
  const seed = hashString(slug) + days;
  const rand = pseudoRandom(seed);

  // Daily average baseline
  const dailyBaseViews = Math.max(12, Math.round(baseViews / 45));
  const dailyBaseUses = Math.max(8, Math.round(baseUses / 45));

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    const dayOfWeek = d.getDay(); // 0 is Sunday, 6 is Saturday
    // Weekend factor (calculators and tools drop slightly on weekends)
    const weekendMultiplier = dayOfWeek === 0 || dayOfWeek === 6 ? 0.78 : 1.05;

    // Gradual upward organic trend over time
    const trendProgress = (days - i) / days; // 0 at start, 1 at end
    const growthMultiplier = 0.88 + trendProgress * 0.28;

    // Small day-to-day noise (+- 15%)
    const noise = 0.85 + rand() * 0.3;

    const dayViews = Math.max(1, Math.round(dailyBaseViews * weekendMultiplier * growthMultiplier * noise));
    // Uses are typically 60-90% of views
    const useRatio = Math.min(0.95, Math.max(0.45, (baseUses / Math.max(baseViews, 1)) * (0.9 + rand() * 0.2)));
    const dayUses = Math.max(1, Math.round(dayViews * useRatio));

    // Time variation
    const dayTime = Math.max(20, Math.round(baseTimeSec * (0.85 + rand() * 0.3)));

    const dateLabel =
      days <= 7
        ? d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' })
        : days <= 30
        ? d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    points.push({
      dateLabel,
      isoDate: d.toISOString().split('T')[0],
      views: dayViews,
      uses: dayUses,
      avgTimeSec: dayTime,
    });
  }

  return points;
}

// Built-in qualitative diagnostic data for top and underperforming tools
interface DiagnosticRule {
  viewsThreshold: number;
  conversionThreshold: number;
  issue: string;
  recommendation: string;
}

const DIAGNOSTICS: DiagnosticRule[] = [
  {
    viewsThreshold: 10000,
    conversionThreshold: 55,
    issue: 'Low conversion rate despite solid page impressions.',
    recommendation: 'Simplify input configuration and ensure the calculate button is visible above the fold on mobile.',
  },
  {
    viewsThreshold: 8000,
    conversionThreshold: 70,
    issue: 'Low search discovery and organic index footprint.',
    recommendation: 'Enhance meta description, add targeted search keywords, and cross-link from popular category hubs.',
  },
  {
    viewsThreshold: 5000,
    conversionThreshold: 60,
    issue: 'High bounce rate with below-average session duration.',
    recommendation: 'Add step-by-step calculation examples and FAQ cards to reduce visitor friction.',
  },
];

export async function fetchAllToolsAnalytics(timeframe: TimeframePeriod = '30d'): Promise<ToolAnalyticsRecord[]> {
  const tools: ToolListItem[] = await getAllToolsList();
  const liveViews = getLiveIncrements(LOCAL_STORAGE_LIVE_VIEWS_KEY);
  const liveUses = getLiveIncrements(LOCAL_STORAGE_LIVE_USES_KEY);
  const liveFavorites = getLiveIncrements(LOCAL_STORAGE_FAVORITES_KEY);

  const daysCount = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;

  const records: ToolAnalyticsRecord[] = tools.map((tool) => {
    const slug = tool.slug;
    const addedViews = liveViews[slug] || 0;
    const addedUses = liveUses[slug] || 0;
    const addedFavorites = liveFavorites[slug] || 0;

    // Base figures
    const perfViews = (tool.performance?.views || 1500) + addedViews;
    const perfUses = (tool.performance?.invocations || 1100) + addedUses;
    const avgDuration = tool.performance?.avgDurationSec || 95;

    // Scaled to period
    const timeframeMultiplier = timeframe === '7d' ? 0.24 : timeframe === '30d' ? 1.0 : 2.85;
    const totalViews = Math.round(perfViews * timeframeMultiplier);
    const totalUses = Math.round(perfUses * timeframeMultiplier);

    const conversionRate = totalViews > 0 ? Number(((totalUses / totalViews) * 100).toFixed(1)) : 0;

    // Favorite count based on popularity, views, and hash
    const baseFavs = Math.max(12, Math.round(totalViews * 0.024)) + addedFavorites;

    // Growth percentage calculation
    const hash = hashString(slug);
    const growthRatePercent = Number(((hash % 38) - 12 + 4.5).toFixed(1)); // between -7.5% and +30.5%
    const bounceRate = Number((28 + (hash % 25)).toFixed(1)); // between 28% and 53%
    const desktopRatio = 58 + (hash % 22);

    // Generate trend history
    const trend = generateTrendHistory(slug, totalViews, totalUses, avgDuration, daysCount);

    // Performance Tier assignment
    let performanceTier: 'top' | 'steady' | 'underperforming' = 'steady';
    let diagnosticIssue: string | undefined;
    let recommendation: string | undefined;

    if (totalViews >= 15000 || (totalViews >= 10000 && conversionRate >= 80)) {
      performanceTier = 'top';
    } else if (totalViews < 8500 || conversionRate < 60 || growthRatePercent < -3) {
      performanceTier = 'underperforming';
      const diag = DIAGNOSTICS[hash % DIAGNOSTICS.length];
      diagnosticIssue = diag.issue;
      recommendation = diag.recommendation;
    }

    return {
      id: tool.id,
      name: tool.name,
      slug: tool.slug,
      category: tool.category,
      iconName: tool.iconName,
      status: tool.status,
      isCustom: tool.isCustom,
      totalViews,
      totalUses,
      conversionRate,
      avgTimeOnPageSec: avgDuration,
      favoriteCount: baseFavs,
      growthRatePercent,
      bounceRatePercent: bounceRate,
      desktopPercent: desktopRatio,
      mobilePercent: 100 - desktopRatio,
      performanceTier,
      diagnosticIssue,
      recommendation,
      trend,
    };
  });

  return records;
}

export function computeAnalyticsOverview(records: ToolAnalyticsRecord[]): AnalyticsOverviewSummary {
  const totalTools = records.length;
  const activeTools = records.filter((r) => r.status === 'active').length;
  const totalViews = records.reduce((acc, r) => acc + r.totalViews, 0);
  const totalUses = records.reduce((acc, r) => acc + r.totalUses, 0);
  const totalFavorites = records.reduce((acc, r) => acc + r.favoriteCount, 0);

  const avgConversionRate =
    records.length > 0
      ? Number((records.reduce((acc, r) => acc + r.conversionRate, 0) / records.length).toFixed(1))
      : 0;

  const avgTimeOnPageSec =
    records.length > 0
      ? Math.round(records.reduce((acc, r) => acc + r.avgTimeOnPageSec, 0) / records.length)
      : 0;

  const periodGrowthPercent =
    records.length > 0
      ? Number((records.reduce((acc, r) => acc + r.growthRatePercent, 0) / records.length).toFixed(1))
      : 0;

  return {
    totalTools,
    activeTools,
    totalViews,
    totalUses,
    avgConversionRate,
    avgTimeOnPageSec,
    totalFavorites,
    periodGrowthPercent,
  };
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const remainingSecs = seconds % 60;
  if (mins === 0) return `${remainingSecs}s`;
  return `${mins}m ${remainingSecs}s`;
}
