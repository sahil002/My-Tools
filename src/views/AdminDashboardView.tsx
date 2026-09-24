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
import { TOOLS } from '../data/tools';
import { ADMIN_STATS_SUMMARY } from '../data/adminOverviewData';
import { getCommentsStats, COMMENTS_CHANGED_EVENT } from '../services/commentModerationService';
import { getToolRequestsStats, TOOL_REQUESTS_CHANGED_EVENT } from '../services/toolRequestsService';
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { AdminTopNav } from '../components/admin/AdminTopNav';
import { TrafficChart } from '../components/admin/TrafficChart';
import { ToolUsageChart } from '../components/admin/ToolUsageChart';
import { RecentActivityFeed } from '../components/admin/RecentActivityFeed';
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
} from 'lucide-react';

export function AdminDashboardView() {
  const { navigate } = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);

  // Sidebar mobile toggle
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const handleLogout = () => {
    logoutAdmin();
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

            {/* Top Stat Cards (5 metrics) */}
            <section aria-labelledby="overview-stats-heading">
              <h2 id="overview-stats-heading" className="sr-only">Platform Statistics</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4 items-stretch">
                {/* 1. Total Tools */}
                <div
                  id="stat-card-total-tools"
                  className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-4 shadow-xs transition-colors h-full flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-[#6D6582]">Total Tools</span>
                    <div className="w-7 h-7 rounded-lg bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] flex items-center justify-center shrink-0">
                      <Wrench className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="text-xl sm:text-2xl font-bold text-[#1E1035] font-mono">
                      {TOOLS.length}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5 text-[11px] text-[#059669]">
                      <ArrowUpRight className="w-3 h-3" />
                      <span className="font-medium">+2 this month</span>
                    </div>
                  </div>
                </div>

                {/* 2. Total Users */}
                <div
                  id="stat-card-total-users"
                  className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-4 shadow-xs transition-colors h-full flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-[#6D6582]">Total Users</span>
                    <div className="w-7 h-7 rounded-lg bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] flex items-center justify-center shrink-0">
                      <Users className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="text-xl sm:text-2xl font-bold text-[#1E1035] font-mono">
                      {ADMIN_STATS_SUMMARY.totalUsers.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5 text-[11px] text-[#059669]">
                      <ArrowUpRight className="w-3 h-3" />
                      <span className="font-medium">+{ADMIN_STATS_SUMMARY.usersGrowthPercent}% MoM</span>
                    </div>
                  </div>
                </div>

                {/* 3. Total Comments */}
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
                      {commentStats.total}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5 text-[11px] text-[#D97706]">
                      <span className="font-medium">{commentStats.pending} awaiting</span>
                    </div>
                  </div>
                </div>

                {/* 4. Total Tool Requests */}
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

                {/* 5. Total Page Views (this month) */}
                <div
                  id="stat-card-page-views"
                  className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-4 shadow-xs transition-colors h-full flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-medium text-[#6D6582]">Page Views</span>
                    <div className="w-7 h-7 rounded-lg bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0] flex items-center justify-center shrink-0">
                      <Eye className="w-3.5 h-3.5" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="text-xl sm:text-2xl font-bold text-[#1E1035] font-mono">
                      {ADMIN_STATS_SUMMARY.pageViewsThisMonth.toLocaleString()}
                    </div>
                    <div className="flex items-center gap-1 mt-0.5 text-[11px] text-[#059669]">
                      <ArrowUpRight className="w-3 h-3" />
                      <span className="font-medium">+{ADMIN_STATS_SUMMARY.pageViewsGrowthPercent}% MoM</span>
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
                    {TOOLS.length} utilities compiled &amp; live
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {TOOLS.map((tool) => (
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
              </div>
            </section>
          </main>
        </div>

        {/* Change Password Modal */}
        {showPasswordModal && (
          <div
            id="password-change-modal-backdrop"
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4"
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
