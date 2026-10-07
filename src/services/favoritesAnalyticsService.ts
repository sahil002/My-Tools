// Live favorites analytics backed by Supabase. No seeded, synthetic, or pseudo-random metrics.
import { getAllToolsList, ToolListItem } from './customToolsService';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export type FavoritesTimeframe = '7d' | '30d' | '90d';
export interface FavoriteDayPoint { dateLabel:string; isoDate:string; count:number; cumulativeCount:number; }
export interface ToolFavoriteMetric { id:string; name:string; slug:string; category:string; iconName:string; status:'active'|'inactive'; isCustom:boolean; totalFavorites:number; recentFavorites:number; growthPercent:number; favoriteRatePercent:number; rank:number; previousRank:number; rankChange:number; categorySharePercent:number; platformSharePercent:number; historicalTrend:FavoriteDayPoint[]; actionRecommendation:{tier:'promote'|'optimize'|'maintain'|'monitor';headline:string;rationale:string}; }
export interface FavoritesCategoryBreakdown { category:string; favoritesCount:number; toolsCount:number; sharePercent:number; topToolName:string; }
export interface PlatformFavoritesOverview { totalFavorites:number; timeframeFavorites:number; avgFavoritesPerTool:number; mostFavoritedTool:{name:string;slug:string;count:number;category:string}|null; fastestGrowingTool:{name:string;slug:string;growthPercent:number;count:number}|null; highestConversionTool:{name:string;slug:string;ratePercent:number;count:number}|null; overallGrowthPercent:number; categoryBreakdown:FavoritesCategoryBreakdown[]; timeline:FavoriteDayPoint[]; }

function recommendation(rank:number,total:number,rate:number,growth:number):ToolFavoriteMetric['actionRecommendation'] {
  if(rank<=3 && growth>=5) return {tier:'promote',headline:'Prime Homepage & Category Feature',rationale:'Real favorite activity is increasing.'};
  if(rate>=3.2) return {tier:'promote',headline:'High Affinity Tool',rationale:'Real favorites are strong relative to recorded views.'};
  if(growth>=15) return {tier:'promote',headline:'Fastest Rising Utility',rationale:'Real recent favorite activity is increasing.'};
  if(growth<-3 && total>0) return {tier:'optimize',headline:'Review Feature Experience',rationale:'Recent real favorite activity has declined.'};
  if(rank>8 && rate<1.5) return {tier:'monitor',headline:'Monitor Affinity',rationale:'Real favorite conversion is currently low.'};
  return {tier:'maintain',headline:'Steady Activity',rationale:'Based only on recorded favorite events.'};
}

export async function fetchFavoritesAnalytics(timeframe:FavoritesTimeframe='30d'):Promise<{rankedTools:ToolFavoriteMetric[];overview:PlatformFavoritesOverview}> {
  const tools:ToolListItem[]=await getAllToolsList();
  const days=timeframe==='7d'?7:timeframe==='30d'?30:90;
  const now=Date.now(); const since=new Date(now-days*86400000).toISOString(); const previousSince=new Date(now-days*2*86400000).toISOString();
  const total:Record<string,number>={}, recent:Record<string,number>={}, previous:Record<string,number>={}, daily:Record<string,Record<string,number>>={};
  if(isSupabaseConfigured() && supabase){
    const {data,error}=await supabase.from('tool_favorites').select('tool_slug,created_at').gte('created_at',previousSince);
    if(!error){ for(const row of data||[]){ const slug=String(row.tool_slug).toLowerCase().trim(); total[slug]=(total[slug]||0)+1; if(row.created_at>=since){recent[slug]=(recent[slug]||0)+1; const day=row.created_at.slice(0,10); daily[day]??={}; daily[day][slug]=(daily[day][slug]||0)+1;} else previous[slug]=(previous[slug]||0)+1; } }
  }
  const base=tools.map(t=>{const slug=t.slug.toLowerCase().trim();const tf=total[slug]||0;const rf=recent[slug]||0;const pf=previous[slug]||0;const growth=pf>0?Number((((rf-pf)/pf)*100).toFixed(1)):0;const views=Number(t.performance?.views||0);return {t,tf,rf,growth,rate:views?Number(((tf/views)*100).toFixed(2)):0};}).filter(x=>x.tf>0);
  base.sort((a,b)=>b.tf-a.tf); const grand=base.reduce((s,x)=>s+x.tf,0); const recentTotal=base.reduce((s,x)=>s+x.rf,0); const cat:Record<string,number>={}; base.forEach(x=>cat[x.t.category]=(cat[x.t.category]||0)+x.tf);
  const rankedTools:ToolFavoriteMetric[]=base.map((x,i)=>({id:x.t.id,name:x.t.name,slug:x.t.slug,category:x.t.category,iconName:x.t.iconName,status:x.t.status,isCustom:x.t.isCustom,totalFavorites:x.tf,recentFavorites:x.rf,growthPercent:x.growth,favoriteRatePercent:x.rate,rank:i+1,previousRank:i+1,rankChange:0,categorySharePercent:Number(((x.tf/(cat[x.t.category]||1))*100).toFixed(1)),platformSharePercent:grand?Number(((x.tf/grand)*100).toFixed(1)):0,historicalTrend:[],actionRecommendation:recommendation(i+1,x.tf,x.rate,x.growth)}));
  const categoryBreakdown=Object.entries(cat).map(([category,count])=>({category,favoritesCount:count,toolsCount:base.filter(x=>x.t.category===category).length,sharePercent:grand?Number(((count/grand)*100).toFixed(1)):0,topToolName:base.find(x=>x.t.category===category)?.t.name||''}));
  const timeline:FavoriteDayPoint[]=[]; let cumulative=0; for(let i=days-1;i>=0;i--){const d=new Date(now-i*86400000);const iso=d.toISOString().slice(0,10);const count=Object.values(daily[iso]||{}).reduce((s,n)=>s+n,0);cumulative+=count;timeline.push({dateLabel:d.toLocaleDateString('en-US',{month:'short',day:'numeric'}),isoDate:iso,count,cumulativeCount:cumulative});}
  const most=rankedTools[0]; const fastest=[...rankedTools].sort((a,b)=>b.growthPercent-a.growthPercent)[0]; const highest=[...rankedTools].sort((a,b)=>b.favoriteRatePercent-a.favoriteRatePercent)[0];
  return {rankedTools,overview:{totalFavorites:grand,timeframeFavorites:recentTotal,avgFavoritesPerTool:rankedTools.length?Math.round(grand/rankedTools.length):0,mostFavoritedTool:most?{name:most.name,slug:most.slug,count:most.totalFavorites,category:most.category}:null,fastestGrowingTool:fastest?{name:fastest.name,slug:fastest.slug,growthPercent:fastest.growthPercent,count:fastest.totalFavorites}:null,highestConversionTool:highest?{name:highest.name,slug:highest.slug,ratePercent:highest.favoriteRatePercent,count:highest.totalFavorites}:null,overallGrowthPercent:rankedTools.length?Number((rankedTools.reduce((s,t)=>s+t.growthPercent,0)/rankedTools.length).toFixed(1)):0,categoryBreakdown,timeline}};
}
