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
  totalUsers: 2845,
  usersGrowthPercent: 14.2,
  totalComments: 418,
  pendingComments: 24,
  totalRequests: 37,
  pendingRequests: 9,
  pageViewsThisMonth: 148920,
  pageViewsGrowthPercent: 18.5,
  bounceRatePercent: 32.4,
  avgSessionDurationSec: 168,
};

// 30 Days Traffic History
export const TRAFFIC_TREND_30D: TrafficDataPoint[] = [
  { label: 'Day 1', pageViews: 3820, uniqueVisitors: 2100 },
  { label: 'Day 3', pageViews: 4100, uniqueVisitors: 2280 },
  { label: 'Day 5', pageViews: 3950, uniqueVisitors: 2190 },
  { label: 'Day 7', pageViews: 4480, uniqueVisitors: 2520 },
  { label: 'Day 9', pageViews: 4720, uniqueVisitors: 2680 },
  { label: 'Day 11', pageViews: 4590, uniqueVisitors: 2590 },
  { label: 'Day 13', pageViews: 4920, uniqueVisitors: 2790 },
  { label: 'Day 15', pageViews: 5120, uniqueVisitors: 2910 },
  { label: 'Day 17', pageViews: 4880, uniqueVisitors: 2750 },
  { label: 'Day 19', pageViews: 5290, uniqueVisitors: 3020 },
  { label: 'Day 21', pageViews: 5480, uniqueVisitors: 3140 },
  { label: 'Day 23', pageViews: 5310, uniqueVisitors: 3010 },
  { label: 'Day 25', pageViews: 5690, uniqueVisitors: 3260 },
  { label: 'Day 27', pageViews: 5880, uniqueVisitors: 3390 },
  { label: 'Day 29', pageViews: 6140, uniqueVisitors: 3510 },
  { label: 'Day 30', pageViews: 6380, uniqueVisitors: 3670 },
];

export const TRAFFIC_TREND_7D: TrafficDataPoint[] = [
  { label: 'Mon', pageViews: 5290, uniqueVisitors: 3020 },
  { label: 'Tue', pageViews: 5480, uniqueVisitors: 3140 },
  { label: 'Wed', pageViews: 5310, uniqueVisitors: 3010 },
  { label: 'Thu', pageViews: 5690, uniqueVisitors: 3260 },
  { label: 'Fri', pageViews: 5880, uniqueVisitors: 3390 },
  { label: 'Sat', pageViews: 6140, uniqueVisitors: 3510 },
  { label: 'Sun', pageViews: 6380, uniqueVisitors: 3670 },
];

export const CATEGORY_USAGE_DATA: CategoryUsage[] = [
  { category: 'Calculators', slug: 'calculators', count: 42500, percentage: 28.5 },
  { category: 'Text Tools', slug: 'text-tools', count: 38200, percentage: 25.6 },
  { category: 'Converters', slug: 'converters', count: 29100, percentage: 19.5 },
  { category: 'Developer Tools', slug: 'developer-tools', count: 21400, percentage: 14.4 },
  { category: 'Generators', slug: 'generators', count: 17720, percentage: 12.0 },
];

export const TOP_TOOLS_USAGE_DATA: ToolUsageItem[] = [
  { name: 'Percentage Calculator', category: 'calculators', count: 28400, percentage: 19.1 },
  { name: 'Word Counter', category: 'text-tools', count: 24100, percentage: 16.2 },
  { name: 'Password Generator', category: 'generators', count: 19800, percentage: 13.3 },
  { name: 'Unit Converter', category: 'converters', count: 16900, percentage: 11.4 },
  { name: 'JSON Formatter', category: 'developer-tools', count: 14200, percentage: 9.5 },
];

export const RECENT_ACTIVITIES: AdminActivity[] = [
  {
    id: 'act-1',
    type: 'comment',
    title: 'New User Comment',
    description: '"The real-time entropy score is super helpful when testing password strength."',
    targetName: 'Password Generator',
    authorName: 'Alex Mercer',
    authorEmail: 'alex.m@example.com',
    timestamp: '14 minutes ago',
    status: 'approved',
  },
  {
    id: 'act-2',
    type: 'request',
    title: 'Tool Request Submitted',
    description: 'Requested client-side SVG to PNG/JPEG rasterizer with custom DPI multiplier.',
    targetName: 'SVG to PNG Converter',
    authorName: 'David Zhang',
    authorEmail: 'david.dev@studio.net',
    timestamp: '42 minutes ago',
    status: 'in_review',
  },
  {
    id: 'act-3',
    type: 'comment',
    title: 'New User Comment',
    description: '"Does this calculator support 3-way discount and sales tax calculation together?"',
    targetName: 'Percentage Calculator',
    authorName: 'Fatima Noor',
    authorEmail: 'fatima.n@domain.com',
    timestamp: '2 hours ago',
    status: 'pending',
  },
  {
    id: 'act-4',
    type: 'tool_added',
    title: 'New Utility Deployed',
    description: 'Word Counter & Keyword Density Analyzer with reading time estimation.',
    targetName: 'Word Counter',
    authorName: 'Admin System',
    timestamp: '5 hours ago',
    status: 'active',
  },
  {
    id: 'act-5',
    type: 'request',
    title: 'Tool Request Submitted',
    description: 'Need a Base64 image to CSS data URI converter with instant preview.',
    targetName: 'Base64 Image Decoder',
    authorName: 'Marcus Cole',
    authorEmail: 'marcus@agency.io',
    timestamp: '8 hours ago',
    status: 'in_review',
  },
  {
    id: 'act-6',
    type: 'comment',
    title: 'New User Comment',
    description: '"Instant copy and JSON validation caught a trailing comma bug in my config. Thanks!"',
    targetName: 'JSON Formatter',
    authorName: 'Elena Rostova',
    authorEmail: 'elena@frontend.org',
    timestamp: '1 day ago',
    status: 'approved',
  },
];
