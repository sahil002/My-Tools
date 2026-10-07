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
export async function fetchFavoritesAnalytics(timeframe: FavoritesTimeframe = '30d'): Promise<{ rankedTools: ToolFavoriteMetric[]; overview: PlatformFavoritesOverview }> {
  const tools = await getAllToolsList();
  const daysCount = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
  const since = new Date(Date.now() - daysCount * 86400000).toISOString();
  const previousSince = new Date(Date.now() - daysCount * 2 * 86400000).toISOString();
  const counts: Record<string,number> = {}, recent: Record<string,number> = {}, previous: Record<string,number> = {};
  const daily: Record<string,Record<string,number>> = {};
  if (supabase && isSupabaseConfigured()) {
    const { data } = await supabase.from('tool_favorites').select('tool_slug,created_at').gte('created_at', previousSince);
    for (const row of data || []) {
      const slug=String(row.tool_slug).toLowerCase().trim(); counts[slug]=(counts[slug]||0)+1;
      if (row.created_at >= since) { recent[slug]=(recent[slug]||0)+1; const day=row.created_at.slice(0,10); daily[day]=(daily[day]||{}); daily[day][slug]=(daily[day][slug]||0)+1; }
      else previous[slug]=(previous[slug]||0)+1;
    }
  }
  const base=tools.map(tool=>{ const slug=tool.slug.toLowerCase().trim(); const total=counts[slug]||0; const rec=recent[slug]||0; const prev=previous[slug]||0; const growth=prev>0?Number((((rec-prev)/prev)*100).toFixed(1)):0; const views=Number(tool.performance?.views||0); return {id:tool.id,name:tool.name,slug:tool.slug,category:tool.category,iconName:tool.iconName,status:tool.status,isCustom:tool.isCustom,totalFavorites:total,recentFavorites:rec,growthPercent:growth,favoriteRatePercent:views?Number(((total/views)*100).toFixed(2)):0,historicalTrend:[] as FavoriteDayPoint[]}; }).filter(t=>t.totalFavorites>0);
  base.sort((a,b)=>b.totalFavorites-a.totalFavorites); const grand=base.reduce((s,t)=>s+t.totalFavorites,0); const recentTotal=base.reduce((s,t)=>s+t.recentFavorites,0);
  const categoryTotals:Record<string,number>={}; base.forEach(t=>categoryTotals[t.category]=(categoryTotals[t.category]||0)+t.totalFavorites);
  const rankedTools:ToolFavoriteMetric[]=base.map((t,i)=>({ ...t,rank:i+1,previousRank:i+1,rankChange:0,categorySharePercent:Number(((t.totalFavorites/(categoryTotals[t.category]||1))*100).toFixed(1)),platformSharePercent:grand?Number(((t.totalFavorites/grand)*100).toFixed(1)):0,actionRecommendation:deriveRecommendation(i+1,t.totalFavorites,t.favoriteRatePercent,t.growthPercent) }));
  const categoryBreakdown:FavoritesCategoryBreakdown[]=Object.entries(categoryTotals).map(([category,count])=>({category,favoritesCount:count,toolsCount:base.filter(t=>t.category===category).length,sharePercent:grand?Number(((count/grand)*100).toFixed(1)):0,topToolName:base.find(t=>t.category===category)?.name||''}));
  const timeline:FavoriteDayPoint[]=Array.from({length:daysCount},(_,i)=>{const d=new Date(Date.now()-(daysCount-1-i)*86400000);const iso=d.toISOString().slice(0,10);const count=Object.values(daily[iso]||{}).reduce((a,b)=>a+b,0);return {dateLabel:d.toLocaleDateString('en-US',{month:'short',day:'numeric'}),isoDate:iso,count,cumulativeCount:0};}); let cum=0; timeline.forEach(p=>{cum+=p.count;p.cumulativeCount=cum;});
  const most=rankedTools[0]; const fastest=[...rankedTools].sort((a,b)=>b.growthPercent-a.growthPercent)[0]; const highest=[...rankedTools].sort((a,b)=>b.favoriteRatePercent-a.favoriteRatePercent)[0];
  return {rankedTools,overview:{totalFavorites:grand,timeframeFavorites:recentTotal,avgFavoritesPerTool:rankedTools.length?Math.round(grand/rankedTools.length):0,mostFavoritedTool:most?{name:most.name,slug:most.slug,count:most.totalFavorites,category:most.category}:null,fastestGrowingTool:fastest?{name:fastest.name,slug:fastest.slug,growthPercent:fastest.growthPercent,count:fastest.totalFavorites}:null,highestConversionTool:highest?{name:highest.name,slug:highest.slug,ratePercent:highest.favoriteRatePercent,count:highest.totalFavorites}:null,overallGrowthPercent:rankedTools.length?Number((rankedTools.reduce((s,t)=>s+t.growthPercent,0)/rankedTools.length).toFixed(1)):0,categoryBreakdown,timeline}};
}
