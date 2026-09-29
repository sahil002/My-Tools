export interface TrafficDataPoint {
  label: string;
  pageViews: number;
  uniqueVisitors: number;
}

export interface CategoryUsage {
  category: string;
  slug: string;
  count: number;
  percentage: number;
}

export interface ToolUsageItem {
  name: string;
  category: string;
  count: number;
  percentage: number;
}

export type ActivityType = 'comment' | 'request' | 'tool_added';

export interface AdminActivity {
  id: string;
  type: ActivityType;
  title: string;
  description: string;
  targetName: string;
  authorName: string;
  authorEmail?: string;
  timestamp: string;
  status: 'approved' | 'pending' | 'active' | 'in_review';
}

export const ADMIN_STATS_SUMMARY = {
  totalUsers: 0,
  usersGrowthPercent: 0,
  totalComments: 0,
  pendingComments: 0,
  totalRequests: 0,
  pendingRequests: 0,
  pageViewsThisMonth: 0,
  pageViewsGrowthPercent: 0,
  bounceRatePercent: 0,
  avgSessionDurationSec: 0,
};

// Generates real traffic data points based on live views or zero baseline
export function getRealTrafficTrend(days: 7 | 30): TrafficDataPoint[] {
  const points: TrafficDataPoint[] = [];
  const now = new Date();

  // Read live views
  let liveViewsMap: Record<string, number> = {};
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('ot_analytics_live_views');
      if (raw) liveViewsMap = JSON.parse(raw);
    } catch {
      // ignore
    }
  }

  const totalLiveViews = Object.values(liveViewsMap).reduce((a, b) => a + b, 0);

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const label =
      days === 7
        ? d.toLocaleDateString('en-US', { weekday: 'short' })
        : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

    // If today, allocate today's recorded live views
    const isToday = i === 0;
    const dayViews = isToday ? totalLiveViews : 0;
    const dayVisitors = isToday && totalLiveViews > 0 ? 1 : 0;

    points.push({
      label,
      pageViews: dayViews,
      uniqueVisitors: dayVisitors,
    });
  }

  return points;
}

export const TRAFFIC_TREND_30D: TrafficDataPoint[] = getRealTrafficTrend(30);
export const TRAFFIC_TREND_7D: TrafficDataPoint[] = getRealTrafficTrend(7);

export const CATEGORY_USAGE_DATA: CategoryUsage[] = [];

export const TOP_TOOLS_USAGE_DATA: ToolUsageItem[] = [];

export const RECENT_ACTIVITIES: AdminActivity[] = [];
