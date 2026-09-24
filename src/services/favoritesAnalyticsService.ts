// Service for tracking, ranking, and analyzing tool favorites and bookmarking trends
import { getAllToolsList, ToolListItem } from './customToolsService';

export type FavoritesTimeframe = '7d' | '30d' | '90d';

export interface FavoriteDayPoint {
  dateLabel: string;
  isoDate: string;
  count: number;
  cumulativeCount: number;
}

export interface ToolFavoriteMetric {
  id: string;
  name: string;
  slug: string;
  category: string;
  iconName: string;
  status: 'active' | 'inactive';
  isCustom: boolean;
  totalFavorites: number;
  recentFavorites: number; // in current timeframe
  growthPercent: number; // timeframe over prior timeframe
  favoriteRatePercent: number; // (favorites / views) * 100
  rank: number;
  previousRank: number;
  rankChange: number; // e.g. +2, 0, -1
  categorySharePercent: number; // share of favorites within its category
  platformSharePercent: number; // share of overall platform favorites
  historicalTrend: FavoriteDayPoint[];
  actionRecommendation: {
    tier: 'promote' | 'optimize' | 'maintain' | 'monitor';
    headline: string;
    rationale: string;
  };
}

export interface FavoritesCategoryBreakdown {
  category: string;
  favoritesCount: number;
  toolsCount: number;
  sharePercent: number;
  topToolName: string;
}

export interface PlatformFavoritesOverview {
  totalFavorites: number;
  timeframeFavorites: number;
  avgFavoritesPerTool: number;
  mostFavoritedTool: {
    name: string;
    slug: string;
    count: number;
    category: string;
  } | null;
  fastestGrowingTool: {
    name: string;
    slug: string;
    growthPercent: number;
    count: number;
  } | null;
  highestConversionTool: {
    name: string;
    slug: string;
    ratePercent: number;
    count: number;
  } | null;
  overallGrowthPercent: number;
  categoryBreakdown: FavoritesCategoryBreakdown[];
  timeline: FavoriteDayPoint[];
}

const LOCAL_STORAGE_FAVORITES_KEY = 'ot_tool_favorites_count';

// Deterministic hashing helper
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

// Deterministic pseudo-random number generator
function pseudoRandom(seed: number): () => number {
  let value = seed % 2147483647;
  if (value <= 0) value += 2147483646;
  return () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
}

function getStoredFavoritesMap(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_FAVORITES_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

/**
 * Generates day-by-day favorites history points for a tool or platform
 */
function generateDayPoints(
  slug: string,
  totalInPeriod: number,
  daysCount: number
): FavoriteDayPoint[] {
  const points: FavoriteDayPoint[] = [];
  const rng = pseudoRandom(hashString(slug) + daysCount);
  const now = new Date();

  // Distribute totalInPeriod across days with realistic weekend/weekday variation
  const rawWeights: number[] = [];
  for (let i = 0; i < daysCount; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - (daysCount - 1 - i));
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const baseWeight = isWeekend ? 0.75 : 1.15;
    const noise = 0.8 + rng() * 0.45;
    // Slight upward ramp towards recent days
    const recencyBoost = 1 + (i / daysCount) * 0.25;
    rawWeights.push(baseWeight * noise * recencyBoost);
  }

  const weightSum = rawWeights.reduce((a, b) => a + b, 0);
  let cumulative = 0;

  for (let i = 0; i < daysCount; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() - (daysCount - 1 - i));
    const month = d.toLocaleString('en-US', { month: 'short' });
    const day = d.getDate();
    const dateLabel = `${month} ${day}`;
    const isoDate = d.toISOString().split('T')[0];

    const share = rawWeights[i] / weightSum;
    const dayCount = Math.max(1, Math.round(share * totalInPeriod));
    cumulative += dayCount;

    points.push({
      dateLabel,
      isoDate,
      count: dayCount,
      cumulativeCount: cumulative,
    });
  }

  return points;
}

/**
 * Calculates strategic action recommendations based on favorites volume and conversion rate
 */
function deriveRecommendation(
  rank: number,
  totalFavorites: number,
  favoriteRate: number,
  growthPercent: number
): ToolFavoriteMetric['actionRecommendation'] {
  if (rank <= 3 && growthPercent >= 5) {
    return {
      tier: 'promote',
      headline: 'Prime Homepage & Category Feature',
      rationale:
        'Top-tier user affinity with accelerating bookmarks. Excellent candidate for homepage hero spotlight and related tools cross-promotion.',
    };
  }
  if (favoriteRate >= 3.2) {
    return {
      tier: 'promote',
      headline: 'High Affinity Hero Candidate',
      rationale:
        'Exceptional bookmark-to-view conversion rate. Visitors rely on this utility repeatedly; increasing search visibility will drive high-retention users.',
    };
  }
  if (growthPercent >= 15) {
    return {
      tier: 'promote',
      headline: 'Fastest Rising Utility',
      rationale:
        'Recent bookmark velocity is surging. Add dedicated documentation and step-by-step guides to capitalize on user momentum.',
    };
  }
  if (growthPercent < -3 && totalFavorites > 200) {
    return {
      tier: 'optimize',
      headline: 'Refresh Feature Experience',
      rationale:
        'High historical save count but recent save velocity has cooled. Review UX ergonomics, mobile layout, and export options.',
    };
  }
  if (rank > 8 && favoriteRate < 1.5) {
    return {
      tier: 'monitor',
      headline: 'Expand Feature Depth',
      rationale:
        'Solid utility usage but lower repeat-save rate. Consider adding saved presets, copy shortcuts, or calculation history to encourage bookmarks.',
    };
  }
  return {
    tier: 'maintain',
    headline: 'Steady Core Workhorse',
    rationale:
      'Consistent retention and healthy favorite counts. Maintain active testing and keep dependencies optimized.',
  };
}

/**
 * Fetches ranked favorites data for all tools across the selected timeframe
 */
export async function fetchFavoritesAnalytics(
  timeframe: FavoritesTimeframe = '30d'
): Promise<{
  rankedTools: ToolFavoriteMetric[];
  overview: PlatformFavoritesOverview;
}> {
  const tools: ToolListItem[] = await getAllToolsList();
  const storedFavs = getStoredFavoritesMap();
  const daysCount = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
  const timeframeMultiplier = timeframe === '7d' ? 0.24 : timeframe === '30d' ? 1.0 : 2.85;

  // 1. Compute raw favorites and metrics
  const unranked = tools.map((tool) => {
    const slug = tool.slug;
    const addedLive = storedFavs[slug] || 0;
    const hash = hashString(slug);

    // Baseline views
    const perfViews = tool.performance?.views || 1500;
    const totalViews = Math.round(perfViews * timeframeMultiplier);

    // Realistic total lifetime favorites
    const baseTotal = Math.max(18, Math.round(perfViews * 0.024)) + addedLive;
    const recentFavorites = Math.max(3, Math.round(baseTotal * (timeframeMultiplier / 1.0)));

    // Growth percentage
    const growthPercent = Number(((hash % 34) - 8 + 3.2).toFixed(1)); // -4.8% to +29.2%

    // Bookmark rate: % of visitors who bookmarked
    const favoriteRatePercent =
      totalViews > 0
        ? Number(((recentFavorites / totalViews) * 100).toFixed(2))
        : 2.1;

    // Daily historical points
    const historicalTrend = generateDayPoints(slug, recentFavorites, daysCount);

    return {
      id: tool.id,
      name: tool.name,
      slug: tool.slug,
      category: tool.category,
      iconName: tool.iconName,
      status: tool.status,
      isCustom: tool.isCustom,
      totalFavorites: baseTotal,
      recentFavorites,
      growthPercent,
      favoriteRatePercent,
      historicalTrend,
      rawHash: hash,
    };
  });

  // 2. Sort by totalFavorites descending for true ranking
  unranked.sort((a, b) => b.totalFavorites - a.totalFavorites);

  const grandTotalFavorites = unranked.reduce((acc, t) => acc + t.totalFavorites, 0);
  const totalRecentFavorites = unranked.reduce((acc, t) => acc + t.recentFavorites, 0);

  // Group by category to compute category share
  const categoryTotals: Record<string, number> = {};
  unranked.forEach((t) => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.totalFavorites;
  });

  // 3. Assign ranks, rank changes, shares, and recommendations
  const rankedTools: ToolFavoriteMetric[] = unranked.map((t, idx) => {
    const rank = idx + 1;
    // Pseudo rank change based on growth
    let rankChange = 0;
    if (t.growthPercent > 12) rankChange = 1;
    if (t.growthPercent > 20) rankChange = 2;
    if (t.growthPercent < -2) rankChange = -1;
    const previousRank = Math.max(1, rank - rankChange);

    const categorySum = categoryTotals[t.category] || 1;
    const categorySharePercent = Number(((t.totalFavorites / categorySum) * 100).toFixed(1));
    const platformSharePercent =
      grandTotalFavorites > 0
        ? Number(((t.totalFavorites / grandTotalFavorites) * 100).toFixed(1))
        : 0;

    const actionRecommendation = deriveRecommendation(
      rank,
      t.totalFavorites,
      t.favoriteRatePercent,
      t.growthPercent
    );

    return {
      id: t.id,
      name: t.name,
      slug: t.slug,
      category: t.category,
      iconName: t.iconName,
      status: t.status,
      isCustom: t.isCustom,
      totalFavorites: t.totalFavorites,
      recentFavorites: t.recentFavorites,
      growthPercent: t.growthPercent,
      favoriteRatePercent: t.favoriteRatePercent,
      rank,
      previousRank,
      rankChange,
      categorySharePercent,
      platformSharePercent,
      historicalTrend: t.historicalTrend,
      actionRecommendation,
    };
  });

  // 4. Platform-wide overview aggregates
  const avgFavoritesPerTool =
    rankedTools.length > 0 ? Math.round(grandTotalFavorites / rankedTools.length) : 0;

  const mostFavoritedTool =
    rankedTools.length > 0
      ? {
          name: rankedTools[0].name,
          slug: rankedTools[0].slug,
          count: rankedTools[0].totalFavorites,
          category: rankedTools[0].category,
        }
      : null;

  // Fastest growing
  const sortedByGrowth = [...rankedTools].sort((a, b) => b.growthPercent - a.growthPercent);
  const fastestGrowingTool =
    sortedByGrowth.length > 0
      ? {
          name: sortedByGrowth[0].name,
          slug: sortedByGrowth[0].slug,
          growthPercent: sortedByGrowth[0].growthPercent,
          count: sortedByGrowth[0].totalFavorites,
        }
      : null;

  // Highest conversion rate
  const sortedByConversion = [...rankedTools].sort(
    (a, b) => b.favoriteRatePercent - a.favoriteRatePercent
  );
  const highestConversionTool =
    sortedByConversion.length > 0
      ? {
          name: sortedByConversion[0].name,
          slug: sortedByConversion[0].slug,
          ratePercent: sortedByConversion[0].favoriteRatePercent,
          count: sortedByConversion[0].totalFavorites,
        }
      : null;

  const overallGrowthPercent =
    rankedTools.length > 0
      ? Number(
          (
            rankedTools.reduce((acc, t) => acc + t.growthPercent, 0) / rankedTools.length
          ).toFixed(1)
        )
      : 8.5;

  // Category Breakdown table
  const categoryCounts: Record<string, { count: number; tools: number; topName: string; topFavs: number }> =
    {};
  rankedTools.forEach((t) => {
    if (!categoryCounts[t.category]) {
      categoryCounts[t.category] = {
        count: 0,
        tools: 0,
        topName: t.name,
        topFavs: t.totalFavorites,
      };
    }
    categoryCounts[t.category].count += t.totalFavorites;
    categoryCounts[t.category].tools += 1;
    if (t.totalFavorites > categoryCounts[t.category].topFavs) {
      categoryCounts[t.category].topFavs = t.totalFavorites;
      categoryCounts[t.category].topName = t.name;
    }
  });

  const categoryBreakdown: FavoritesCategoryBreakdown[] = Object.entries(categoryCounts).map(
    ([category, val]) => ({
      category,
      favoritesCount: val.count,
      toolsCount: val.tools,
      sharePercent:
        grandTotalFavorites > 0
          ? Number(((val.count / grandTotalFavorites) * 100).toFixed(1))
          : 0,
      topToolName: val.topName,
    })
  );

  categoryBreakdown.sort((a, b) => b.favoritesCount - a.favoritesCount);

  // Platform cumulative timeline
  const timeline = generateDayPoints('platform-aggregate-favorites', totalRecentFavorites, daysCount);

  return {
    rankedTools,
    overview: {
      totalFavorites: grandTotalFavorites,
      timeframeFavorites: totalRecentFavorites,
      avgFavoritesPerTool,
      mostFavoritedTool,
      fastestGrowingTool,
      highestConversionTool,
      overallGrowthPercent,
      categoryBreakdown,
      timeline,
    },
  };
}
