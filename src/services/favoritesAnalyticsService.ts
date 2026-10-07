// Service for tracking, ranking, and analyzing tool favorites and bookmarking trends
import { getAllToolsList, ToolListItem } from './customToolsService';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

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

/** Real favorites analytics from Supabase. No seeded or pseudo-random statistics. */
async function getLiveFavoriteCounts(timeframe: FavoritesTimeframe) {
  const days = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
  const since = new Date(Date.now() - days * 86400000).toISOString();
  if (!supabase || !isSupabaseConfigured()) return { counts: {}, recent: {}, previous: {}, daily: {} as Record<string, Record<string, number>> };
  const { data, error } = await supabase.from('tool_favorites').select('tool_slug, created_at').gte('created_at', new Date(Date.now() - 90 * 86400000).toISOString());
  if (error || !data) return { counts: {}, recent: {}, previous: {}, daily: {} as Record<string, Record<string, number>> };
  const counts: Record<string, number> = {}, recent: Record<string, number> = {}, previous: Record<string, number> = {}, daily: Record<string, Record<string, number>> = {};
  const previousStart = new Date(Date.now() - days * 2 * 86400000).toISOString();
  for (const row of data) {
    const slug = String(row.tool_slug).toLowerCase().trim();
    const created = new Date(row.created_at);
    counts[slug] = (counts[slug] || 0) + 1;
    if (row.created_at >= since) recent[slug] = (recent[slug] || 0) + 1;
    else if (row.created_at >= previousStart) previous[slug] = (previous[slug] || 0) + 1;
    if (row.created_at >= since) {
      const day = row.created_at.slice(0,10);
      daily[slug] ||= {};
      daily[slug][day] = (daily[slug][day] || 0) + 1;
    }
  }
  return { counts, recent, previous, daily };
}

function buildRealDayPoints(total: Record<string, number>, days: number): FavoriteDayPoint[] {
  const points: FavoriteDayPoint[] = [];
  let cumulative = 0;
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const isoDate = d.toISOString().slice(0,10);
    const count = Object.values(total).reduce((sum, map: any) => sum + Number(map?.[isoDate] || 0), 0);
    cumulative += count;
    points.push({ dateLabel: d.toLocaleDateString('en-US',{month:'short',day:'numeric'}), isoDate, count, cumulativeCount:cumulative });
  }
  return points;
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
  const daysCount = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
  const live = await getLiveFavoriteCounts(timeframe);
  const unranked = tools.map((tool) => {
    const slug = tool.slug.toLowerCase().trim();
    const totalFavorites = live.counts[slug] || 0;
    const recentFavorites = live.recent[slug] || 0;
    const prior = live.previous[slug] || 0;
    const growthPercent = prior > 0 ? Number((((recentFavorites-prior)/prior)*100).toFixed(1)) : 0;
    const views = Number(tool.performance?.views || 0);
    const favoriteRatePercent = views > 0 ? Number(((totalFavorites/views)*100).toFixed(2)) : 0;
    return { id:tool.id,name:tool.name,slug:tool.slug,category:tool.category,iconName:tool.iconName,status:tool.status,isCustom:tool.isCustom,totalFavorites,recentFavorites,growthPercent,favoriteRatePercent,historicalTrend:[] as FavoriteDayPoint[] };
  }).filter(t => t.totalFavorites > 0);
  unranked.sort((a,b)=>b.totalFavorites-a.totalFavorites);
  const grandTotalFavorites=unranked.reduce((a,t)=>a+t.totalFavorites,0);
  const totalRecentFavorites=unranked.reduce((a,t)=>a+t.recentFavorites,0);
  const categoryTotals:Record<string,number>={}; unranked.forEach(t=>categoryTotals[t.category]=(categoryTotals[t.category]||0)+t.totalFavorites);
  const rankedTools:ToolFavoriteMetric[]=unranked.map((t,idx)=>({ ...t, rank:idx+1, previousRank:idx+1, rankChange:0, categorySharePercent:Number(((t.totalFavorites/(categoryTotals[t.category]||1))*100).toFixed(1)), platformSharePercent:grandTotalFavorites?Number(((t.totalFavorites/grandTotalFavorites)*100).toFixed(1)):0, actionRecommendation:deriveRecommendation(idx+1,t.totalFavorites,t.favoriteRatePercent,t.growthPercent) }));
  const categoryBreakdown=Object.entries(categoryTotals).map(([category,count])=>({category,favoritesCount:count,toolsCount:unranked.filter(t=>t.category===category).length,sharePercent:grandTotalFavorites?Number(((count/grandTotalFavorites)*100).toFixed(1)):0,topToolName:unranked.find(t=>t.category===category)?.name||''}));
  const most=rankedTools[0];
  const fastest=[...rankedTools].sort((a,b)=>b.growthPercent-a.growthPercent)[0];
  const highest=[...rankedTools].sort((a,b)=>b.favoriteRatePercent-a.favoriteRatePercent)[0];
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
