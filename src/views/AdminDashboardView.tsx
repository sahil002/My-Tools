import React, { useState, useEffect } from 'react';
import { useRouter } from '../context/RouterContext';
import { useTheme } from '../context/ThemeContext';
import { SEOHelmet } from '../components/SEOHelmet';
import {
  getActiveAdminSession,
  logoutAdmin,
  updateAdminPassword,
  AdminSession,
  getAdminLoginRoute,
} from '../services/adminAuth';
import { useMergedTools } from '../services/toolRegistryService';
import { ADMIN_STATS_SUMMARY } from '../data/adminOverviewData';
import { getCommentsStats, COMMENTS_CHANGED_EVENT } from '../services/commentModerationService';
import { getToolRequestsStats, TOOL_REQUESTS_CHANGED_EVENT } from '../services/toolRequestsService';
import { getSubscribers, SUBSCRIBERS_UPDATED_EVENT, SubscriberItem } from '../services/subscriberService';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { AdminTopNav } from '../components/admin/AdminTopNav';
import { TrafficChart } from '../components/admin/TrafficChart';
import { ToolUsageChart } from '../components/admin/ToolUsageChart';
import { RecentActivityFeed } from '../components/admin/RecentActivityFeed';
import {
  getAllMergedGuidesSync,
  GUIDES_UPDATED_EVENT,
  calculateRankMathScore,
} from '../services/guideStorageDB';
import {
  getAllGuideMetricsSync,
  getAllGuideCommentsSync,
  GUIDE_METRICS_UPDATED_EVENT,
  GUIDE_COMMENTS_UPDATED_EVENT,
  GuideMetrics,
  GuideComment,
} from '../services/guideAnalyticsService';
import { GuideArticle } from '../types';
import {
  Wrench,
  Users,
  MessageSquare,
  Sparkles,
  Eye,
  ArrowUpRight,
  ShieldCheck,
  KeyRound,
  CheckCircle,
  AlertCircle,
  Clock,
  Layers,
  Mail,
  TrendingUp,
  Send,
  BookOpen,
  Heart,
  Share2,
  Plus,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';

export function AdminDashboardView() {
  const { navigate } = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Sidebar mobile toggle
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Dynamic merged tools catalog
  const { tools } = useMergedTools();

  // Real live page views computed from client tracking
  const [livePageViews, setLivePageViews] = useState<number>(0);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('ot_analytics_live_views');
      if (raw) {
        const parsed = JSON.parse(raw);
        const sum = Object.values(parsed).reduce((a: any, b: any) => a + (Number(b) || 0), 0);
        setLivePageViews(Number(sum) || 0);
      }
    } catch {
      setLivePageViews(0);
    }
  }, []);

  // Live comment moderation stats
  const [commentStats, setCommentStats] = useState(() => {
    try {
      return getCommentsStats();
    } catch {
      return {
        total: ADMIN_STATS_SUMMARY.totalComments,
        pending: ADMIN_STATS_SUMMARY.pendingComments,
        approved: 0,
        rejected: 0,
        spam: 0,
      };
    }
  });

  useEffect(() => {
    const handleCommentsUpdate = () => {
      try {
        setCommentStats(getCommentsStats());
      } catch {
        // fallback
      }
    };
    window.addEventListener(COMMENTS_CHANGED_EVENT, handleCommentsUpdate);
    return () => window.removeEventListener(COMMENTS_CHANGED_EVENT, handleCommentsUpdate);
  }, []);

  // Live tool requests stats
  const [requestStats, setRequestStats] = useState(() => {
    try {
      return getToolRequestsStats();
    } catch {
      return {
        total: ADMIN_STATS_SUMMARY.totalRequests,
        newCount: ADMIN_STATS_SUMMARY.pendingRequests,
        inProgress: 0,
        completed: 0,
        declined: 0,
        uniqueToolsCount: 0,
      };
    }
  });

  useEffect(() => {
    const handleRequestsUpdate = () => {
      try {
        setRequestStats(getToolRequestsStats());
      } catch {
        // fallback
      }
    };
    window.addEventListener(TOOL_REQUESTS_CHANGED_EVENT, handleRequestsUpdate);
    return () => window.removeEventListener(TOOL_REQUESTS_CHANGED_EVENT, handleRequestsUpdate);
  }, []);

  // Live subscribers
  const [subscribersList, setSubscribersList] = useState<SubscriberItem[]>(() => {
    try {
      return getSubscribers();
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handleSubscribersUpdate = () => {
      try {
        setSubscribersList(getSubscribers());
      } catch {
        // fallback
      }
    };
    window.addEventListener(SUBSCRIBERS_UPDATED_EVENT, handleSubscribersUpdate);
    return () => window.removeEventListener(SUBSCRIBERS_UPDATED_EVENT, handleSubscribersUpdate);
  }, []);

  // Live guides, educational articles & metrics
  const [guidesList, setGuidesList] = useState<GuideArticle[]>(() => {
    try {
      return getAllMergedGuidesSync();
    } catch {
      return [];
    }
  });

  const [guideMetrics, setGuideMetrics] = useState<Record<string, GuideMetrics>>(() => {
    try {
      return getAllGuideMetricsSync();
    } catch {
      return {};
    }
  });

  const [guideComments, setGuideComments] = useState<GuideComment[]>(() => {
    try {
      return getAllGuideCommentsSync();
    } catch {
      return [];
    }
  });

  useEffect(() => {
    const handleGuidesUpdate = () => {
      try {
        setGuidesList(getAllMergedGuidesSync());
      } catch {
        // fallback
      }
    };
    const handleMetricsUpdate = () => {
      try {
        setGuideMetrics(getAllGuideMetricsSync());
      } catch {
        // fallback
      }
    };
    const handleCommentsUpdate = () => {
      try {
        setGuideComments(getAllGuideCommentsSync());
      } catch {
        // fallback
      }
    };

    window.addEventListener(GUIDES_UPDATED_EVENT, handleGuidesUpdate);
    window.addEventListener(GUIDE_METRICS_UPDATED_EVENT, handleMetricsUpdate);
    window.addEventListener(GUIDE_COMMENTS_UPDATED_EVENT, handleCommentsUpdate);

    return () => {
      window.removeEventListener(GUIDES_UPDATED_EVENT, handleGuidesUpdate);
      window.removeEventListener(GUIDE_METRICS_UPDATED_EVENT, handleMetricsUpdate);
      window.removeEventListener(GUIDE_COMMENTS_UPDATED_EVENT, handleCommentsUpdate);
    };
  }, []);

  const publishedGuidesCount = guidesList.filter((g) => !g.isDraft).length;
  const draftGuidesCount = guidesList.filter((g) => Boolean(g.isDraft)).length;

  const totalGuideReads = React.useMemo(() => {
    const existingSlugs = new Set(guidesList.map((g) => g.slug));
    return Object.entries(guideMetrics)
      .filter(([slug]) => existingSlugs.has(slug))
      .reduce((acc, [, m]) => acc + (m.views || 0), 0);
  }, [guideMetrics, guidesList]);

  const totalGuideLikes = React.useMemo(() => {
    const existingSlugs = new Set(guidesList.map((g) => g.slug));
    return Object.entries(guideMetrics)
      .filter(([slug]) => existingSlugs.has(slug))
      .reduce((acc, [, m]) => acc + (m.likes || 0), 0);
  }, [guideMetrics, guidesList]);

  const realGuideCommentsCount = React.useMemo(() => {
    const existingSlugs = new Set(guidesList.map((g) => g.slug));
    return guideComments.filter((c) => existingSlugs.has(c.guideSlug)).length;
  }, [guideComments, guidesList]);

  const avgSeoScore = React.useMemo(() => {
    if (!guidesList.length) return 0;
    const sum = guidesList.reduce((acc, g) => {
      const score = typeof g.seoScore === 'number' ? g.seoScore : calculateRankMathScore(g).overallScore;
      return acc + score;
    }, 0);
    return Math.round(sum / guidesList.length);
  }, [guidesList]);

  // Password update modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  // Verify authentication on mount
  useEffect(() => {
    let isMounted = true;
    getActiveAdminSession().then((activeSession) => {
      if (!isMounted) return;
      if (!activeSession) {
        const loginRoute = getAdminLoginRoute();
        navigate(`${loginRoute}?redirect=/admin/dashboard`);
      } else {
        setSession(activeSession);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  const handleLogout = async () => {
    await logoutAdmin();
    const loginRoute = getAdminLoginRoute();
    navigate(loginRoute);
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setPasswordStatus({ success: false, message: 'Password must be at least 8 characters long.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ success: false, message: 'Passwords do not match.' });
      return;
    }

    setSavingPassword(true);
    setPasswordStatus(null);

    try {
      await updateAdminPassword(newPassword);
      setPasswordStatus({ success: true, message: 'Password successfully updated and securely hashed with PBKDF2!' });
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordStatus(null);
      }, 2000);
    } catch {
      setPasswordStatus({ success: false, message: 'Failed to update password.' });
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF9FE] text-[#1E1035]">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[#7C3AED]/20 border-t-[#7C3AED] rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-[#6D6582]">Verifying administrative access...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div>
      <div
        id="admin-dashboard-container"
        className="min-h-screen bg-[#FAF9FE] text-[#1E1035] flex flex-col lg:flex-row font-sans transition-colors duration-200"
      >
        <SEOHelmet
          title="Admin Dashboard Overview | Online Tools"
          description="Administrative control center and platform metrics overview"
          canonicalPath="/admin/dashboard"
          noindex={true}
        />

        {/* Clean Sidebar Navigation for all admin modules */}
        <AdminSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          adminEmail={session.user.email}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Admin Top Navigation */}
          <AdminTopNav
            onToggleSidebar={() => setSidebarOpen(true)}
            adminTheme={theme}
            onToggleTheme={toggleTheme}
            onOpenPasswordModal={() => setShowPasswordModal(true)}
            onLogout={handleLogout}
            pageTitle="Dashboard Overview"
          />

          {/* Main Dashboard Body */}
          <main id="admin-main-content" className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto space-y-5 sm:space-y-6">
            {/* Welcome & Session Information */}
            <div
              id="admin-welcome-card"
              className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-4 sm:p-5 shadow-xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] shadow-2xs flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-sm sm:text-base font-heading font-bold text-[#1E1035] tracking-tight">
                        Platform Control Center
                      </h2>
                      <span className="text-[10px] font-heading font-bold px-2 py-0.5 rounded-full bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]">
                        Live Session
                      </span>
                    </div>
                    <p className="text-xs text-[#6D6582] mt-0.5">
                      Signed in as <span className="font-semibold text-[#1E1035]">{session.user.email}</span> • Super Administrator
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-[#6D6582] shrink-0 self-start sm:self-auto">
                  <Clock className="w-3.5 h-3.5 text-[#7C3AED]" />
                  <span>Session expires in 30 days</span>
                </div>
              </div>
            </div>

            {/* Top Stat Cards (6 metrics) */}
            <section aria-labelledby="overview-stats-heading">
              <h2 id="overview-stats-heading" className="sr-only">Platform Statistics</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5 sm:gap-4 items-stretch">
                {/* 1. Total Tools */}
                <div
                  id="stat-card-total-tools"
                  onClick={() => navigate('/admin/tools')}
                  className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-4 hover:border-[#7C3AED] shadow-xs cursor-pointer transition-colors group h-full flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-[#6D6582] group-hover:text-[#7C3AED] transition-colors">Total Tools</span>
                    <div className="w-7 h-7 rounded-lg bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] flex items-center justify-center shrink-0">
                      <Wrench className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="text-xl sm:text-2xl font-bold text-[#1E1035] font-mono">
                      {tools.length}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5 text-[11px] text-[#7C3AED]">
                      <span className="font-medium">{tools.length} active in catalog</span>
                    </div>
                  </div>
                </div>

                {/* 2. Guides & Educational Articles */}
                <div
                  id="stat-card-total-guides"
                  onClick={() => navigate('/admin/guides')}
                  className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-4 hover:border-[#7C3AED] shadow-xs cursor-pointer transition-colors group h-full flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-[#6D6582] group-hover:text-[#7C3AED] transition-colors">
                      Guides &amp; Articles
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-[#FAF5FF] text-[#7C3AED] border border-[#DDD6FE] flex items-center justify-center shrink-0">
                      <BookOpen className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="text-xl sm:text-2xl font-bold text-[#1E1035] font-mono">
                      {guidesList.length}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5 text-[11px] text-[#7C3AED]">
                      <span className="font-medium">{publishedGuidesCount} live • {draftGuidesCount} draft</span>
                    </div>
                  </div>
                </div>

                {/* 3. Subscribers (Real Active DB) */}
                <div
                  id="stat-card-total-subscribers"
                  onClick={() => navigate('/admin/subscribers')}
                  className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-4 hover:border-[#7C3AED] shadow-xs cursor-pointer transition-colors group h-full flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-[#6D6582] group-hover:text-[#7C3AED] transition-colors">Subscribers</span>
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                      <Mail className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="text-xl sm:text-2xl font-bold text-[#1E1035] font-mono">
                      {subscribersList.filter((s) => s.status === 'active').length}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5 text-[11px] text-emerald-600 font-medium">
                      <TrendingUp className="w-3 h-3 text-emerald-500" />
                      <span>{subscribersList.length} total in DB</span>
                    </div>
                  </div>
                </div>

                {/* 4. Total Comments */}
                <div
                  id="stat-card-total-comments"
                  onClick={() => navigate('/admin/comments')}
                  className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-4 hover:border-[#7C3AED] shadow-xs cursor-pointer transition-colors group h-full flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-[#6D6582] group-hover:text-[#7C3AED] transition-colors">
                      Comments
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A] flex items-center justify-center shrink-0">
                      <MessageSquare className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="text-xl sm:text-2xl font-bold text-[#1E1035] font-mono">
                      {commentStats.total + guideComments.length}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5 text-[11px] text-[#D97706]">
                      <span className="font-medium">{commentStats.pending} pending • {guideComments.length} guides</span>
                    </div>
                  </div>
                </div>

                {/* 5. Total Tool Requests */}
                <div
                  id="stat-card-tool-requests"
                  onClick={() => navigate('/admin/requests')}
                  className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-4 hover:border-[#7C3AED] shadow-xs cursor-pointer transition-colors group h-full flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-[#6D6582] group-hover:text-[#7C3AED] transition-colors">
                      Requests
                    </span>
                    <div className="w-7 h-7 rounded-lg bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] flex items-center justify-center shrink-0">
                      <Sparkles className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="text-xl sm:text-2xl font-bold text-[#1E1035] font-mono">
                      {requestStats.total}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5 text-[11px] text-[#7C3AED]">
                      <span className="font-medium">{requestStats.newCount} needed</span>
                    </div>
                  </div>
                </div>

                {/* 6. Total Live Views */}
                <div
                  id="stat-card-page-views"
                  className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-4 shadow-xs transition-colors h-full flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-[#6D6582]">Total Views</span>
                    <div className="w-7 h-7 rounded-lg bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0] flex items-center justify-center shrink-0">
                      <Eye className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="text-xl sm:text-2xl font-bold text-[#1E1035] font-mono">
                      {(livePageViews + totalGuideReads).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5 text-[11px] text-[#059669]">
                      <span className="font-medium">{totalGuideReads.toLocaleString()} guide reads</span>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Charts Section: Line & Bar */}
            <section aria-labelledby="analytics-trends-heading" className="space-y-3">
              <h2 id="analytics-trends-heading" className="sr-only">Traffic and Usage Trends</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Traffic Trend Line Chart */}
                <TrafficChart />

                {/* Tool Usage Trend Bar Chart */}
                <ToolUsageChart />
              </div>
            </section>

            {/* Recent Activity Feed */}
            <section aria-labelledby="activity-feed-heading">
              <h2 id="activity-feed-heading" className="sr-only">Recent Activity Feed</h2>
              <RecentActivityFeed />
            </section>

            {/* Quick Registry Snapshot */}
            <section aria-labelledby="tool-inventory-heading">
              <div
                id="tool-inventory-card"
                className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-5 sm:p-6 shadow-xs"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#7C3AED]" />
                    <h2 id="tool-inventory-heading" className="text-sm font-heading font-bold text-[#1E1035]">
                      Deployed Tool Inventory
                    </h2>
                  </div>
                  <span className="text-xs text-[#6D6582]">
                    {tools.length} utilities compiled &amp; live
                  </span>
                </div>

                {tools.length === 0 ? (
                  <div className="p-6 text-center text-xs text-[#6D6582] bg-[#FAF9FE] border border-[#EDE9FE] rounded-xl">
                    No custom tools deployed yet. Click "Deploy New Tool" in Tools Manager to upload your first utility!
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                    {tools.map((tool) => (
                      <div
                        key={tool.id}
                        className="p-2.5 rounded-xl border border-[#EDE9FE] bg-[#FAF9FE] text-xs hover:border-[#DDD6FE] transition-colors"
                      >
                        <div className="font-semibold text-[#1E1035] truncate">
                          {tool.name}
                        </div>
                        <div className="text-[10px] text-[#6D6582] mt-0.5 capitalize">
                          {tool.category.replace('-', ' ')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Quick Guides & Editorial Knowledge Base Hub */}
            <section aria-labelledby="guides-quick-heading">
              <div
                id="guides-quick-card"
                className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#EDE9FE]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#FAF5FF] text-[#7C3AED] border border-[#DDD6FE] flex items-center justify-center shrink-0">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 id="guides-quick-heading" className="text-sm font-heading font-bold text-[#1E1035]">
                          Educational Guides &amp; Blog Knowledge Base
                        </h2>
                        <span className="text-[10px] font-heading font-bold px-2 py-0.5 rounded-full bg-[#FAF5FF] text-[#7C3AED] border border-[#DDD6FE]">
                          {publishedGuidesCount} Published
                        </span>
                      </div>
                      <p className="text-xs text-[#6D6582] mt-0.5">
                        Interactive guides, mathematical formulas, RankMath SEO analysis, and reader discussions.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => navigate('/admin/guides')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#FAF5FF] hover:bg-[#F3EEFF] border border-[#DDD6FE] text-[#7C3AED] rounded-xl text-xs font-heading font-bold transition-colors cursor-pointer shadow-2xs"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Write New Guide</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate('/admin/guides')}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white rounded-xl text-xs font-heading font-bold transition-colors cursor-pointer shadow-2xs"
                    >
                      <span>Manage All Guides</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Guides Key Performance Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-[#FAF9FE] border border-[#EDE9FE]">
                    <span className="text-[11px] font-heading font-semibold text-[#6D6582] uppercase tracking-wider block">
                      Total Guide Reads
                    </span>
                    <span className="text-lg font-bold font-mono text-[#1E1035] mt-1 block">
                      {totalGuideReads.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-[#6D6582] mt-0.5 block">Across all published articles</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FAF9FE] border border-[#EDE9FE]">
                    <span className="text-[11px] font-heading font-semibold text-[#6D6582] uppercase tracking-wider block">
                      Reader Reactions
                    </span>
                    <span className="text-lg font-bold font-mono text-[#1E1035] mt-1 block flex items-center gap-1.5">
                      <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                      {totalGuideLikes.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-[#6D6582] mt-0.5 block">Community likes &amp; bookmarks</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FAF9FE] border border-[#EDE9FE]">
                    <span className="text-[11px] font-heading font-semibold text-[#6D6582] uppercase tracking-wider block">
                      Reader Comments
                    </span>
                    <span className="text-lg font-bold font-mono text-[#1E1035] mt-1 block flex items-center gap-1.5">
                      <MessageSquare className="w-4 h-4 text-[#D97706]" />
                      {realGuideCommentsCount}
                    </span>
                    <span className="text-[11px] text-[#6D6582] mt-0.5 block">Guide discussions &amp; feedback</span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-[#FAF9FE] border border-[#EDE9FE]">
                    <span className="text-[11px] font-heading font-semibold text-[#6D6582] uppercase tracking-wider block">
                      Avg RankMath SEO
                    </span>
                    <span className="text-lg font-bold font-mono text-emerald-600 mt-1 block flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      {guidesList.length > 0 ? `${avgSeoScore}/100` : '—'}
                    </span>
                    <span className="text-[11px] text-emerald-700 font-medium mt-0.5 block">
                      {guidesList.length > 0 ? 'RankMath Verified' : 'No guides published'}
                    </span>
                  </div>
                </div>

                {/* Recent Guides List */}
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-heading font-bold text-[#1E1035]">
                      Recent Guides &amp; Real-Time Insights
                    </span>
                    <span className="text-[11px] text-[#6D6582]">
                      Showing latest {Math.min(6, guidesList.length)} of {guidesList.length} articles
                    </span>
                  </div>

                  {guidesList.length === 0 ? (
                    <div className="p-6 text-center text-xs text-[#6D6582] bg-[#FAF9FE] border border-[#EDE9FE] rounded-xl">
                      No educational guides published yet. Click &ldquo;Write New Guide&rdquo; to publish your first article!
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                      {guidesList.slice(0, 6).map((guide) => {
                        const m = guideMetrics[guide.slug] || { views: 0, likes: 0, commentsCount: 0 };
                        const seo = typeof guide.seoScore === 'number' ? guide.seoScore : calculateRankMathScore(guide).overallScore;
                        return (
                          <div
                            key={guide.slug}
                            className="p-3.5 rounded-xl border border-[#EDE9FE] bg-[#FAF9FE] hover:border-[#DDD6FE] transition-colors flex flex-col justify-between gap-3 group"
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2 mb-1.5">
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-heading font-bold uppercase tracking-wider bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE]">
                                  {guide.category}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-heading font-bold ${
                                  seo >= 80
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                    : seo >= 60
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}>
                                  {seo}/100 SEO
                                </span>
                              </div>
                              <h4 className="text-xs font-heading font-bold text-[#1E1035] group-hover:text-[#7C3AED] transition-colors line-clamp-2">
                                {guide.title}
                              </h4>
                              <p className="text-[11px] text-[#6D6582] line-clamp-1 mt-0.5">
                                {guide.description}
                              </p>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-[#6D6582] pt-2 border-t border-[#EDE9FE]/70">
                              <div className="flex items-center gap-2.5">
                                <span className="flex items-center gap-1" title="Views">
                                  <Eye className="w-3 h-3 text-[#6D6582]" />
                                  {m.views}
                                </span>
                                <span className="flex items-center gap-1" title="Likes">
                                  <Heart className="w-3 h-3 text-rose-500" />
                                  {m.likes}
                                </span>
                                <span className="flex items-center gap-1" title="Comments">
                                  <MessageSquare className="w-3 h-3 text-[#D97706]" />
                                  {m.commentsCount || 0}
                                </span>
                              </div>

                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => navigate(`/guide/${guide.slug}`)}
                                  className="p-1 text-[#6D6582] hover:text-[#7C3AED] hover:bg-white rounded transition-colors cursor-pointer"
                                  title="View live article"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => navigate('/admin/guides')}
                                  className="text-[11px] font-heading font-bold text-[#7C3AED] hover:underline cursor-pointer"
                                >
                                  Edit
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Quick Subscribers Hub Snapshot */}
            <section aria-labelledby="subscribers-quick-heading">
              <div
                id="subscribers-quick-card"
                className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center shrink-0">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 id="subscribers-quick-heading" className="text-sm font-heading font-bold text-[#1E1035]">
                        Newsletter &amp; Tool Updates Engine
                      </h2>
                      <span className="text-[10px] font-heading font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {subscribersList.filter((s) => s.status === 'active').length} Active
                      </span>
                    </div>
                    <p className="text-xs text-[#6D6582] mt-0.5">
                      Subscribers receive instant automated alerts whenever a new tool is deployed or updated.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate('/admin/subscribers')}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#FAF9FE] hover:bg-[#F5F3FF] border border-[#DDD6FE] text-[#7C3AED] rounded-xl text-xs font-heading font-semibold transition-colors cursor-pointer shadow-2xs"
                  >
                    <span>Manage All Subscribers</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </section>
          </main>
        </div>

        {/* Change Password Modal */}
        {showPasswordModal && (
          <div
            id="password-change-modal-backdrop"
            className="fixed inset-0 z-50 bg-[#1E1035]/50 backdrop-blur-xs flex items-center justify-center p-4"
          >
            <div
              id="password-change-modal"
              className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-6 max-w-md w-full shadow-xl animate-in fade-in duration-150"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] flex items-center justify-center shadow-2xs">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-heading font-bold text-[#1E1035]">
                    Update Admin Password
                  </h3>
                  <p className="text-xs text-[#6D6582]">
                    Encrypted with PBKDF2 (100,000 rounds)
                  </p>
                </div>
              </div>

              {passwordStatus && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 mb-4 ${
                    passwordStatus.success
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {passwordStatus.success ? (
                    <CheckCircle className="w-4 h-4 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0" />
                  )}
                  <span>{passwordStatus.message}</span>
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-xs font-heading font-semibold text-[#1E1035] mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 8 characters"
                    className="w-full px-3 py-2 text-xs bg-[#FFFFFF] border border-[#EDE9FE] rounded-xl text-[#1E1035] placeholder-[#9D95B3] focus:outline-hidden focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-heading font-semibold text-[#1E1035] mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repeat new password"
                    className="w-full px-3 py-2 text-xs bg-[#FFFFFF] border border-[#EDE9FE] rounded-xl text-[#1E1035] placeholder-[#9D95B3] focus:outline-hidden focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordModal(false);
                      setPasswordStatus(null);
                    }}
                    disabled={savingPassword}
                    className="px-3.5 py-2 text-xs text-[#6D6582] hover:text-[#1E1035] font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingPassword}
                    className="px-4 py-2 bg-[#7C3AED] text-[#FFFFFF] rounded-xl text-xs font-semibold hover:bg-[#6D28D9] shadow-xs shadow-[#7C3AED]/20 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {savingPassword ? 'Encrypting...' : 'Update Password'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
