import React, { useState, useEffect, useMemo } from 'react';
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
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { AdminTopNav } from '../components/admin/AdminTopNav';
import { FavoritesTrendChart } from '../components/admin/FavoritesTrendChart';
import { FavoritesRankingTable } from '../components/admin/FavoritesRankingTable';
import { FavoritesInsightSidebar } from '../components/admin/FavoritesInsightSidebar';
import {
  fetchFavoritesAnalytics,
  ToolFavoriteMetric,
  PlatformFavoritesOverview,
  FavoritesTimeframe,
} from '../services/favoritesAnalyticsService';
import {
  Heart,
  TrendingUp,
  Bookmark,
  Award,
  Zap,
  ArrowUpRight,
  Filter,
  RefreshCw,
  Sparkles,
  Info,
} from 'lucide-react';

export function AdminFavoritesView() {
  const { currentPath, navigate } = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Password update modal states
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  // Favorites Analytics Data
  const [timeframe, setTimeframe] = useState<FavoritesTimeframe>('30d');
  const [rankedTools, setRankedTools] = useState<ToolFavoriteMetric[]>([]);
  const [overview, setOverview] = useState<PlatformFavoritesOverview | null>(null);
  const [selectedTool, setSelectedTool] = useState<ToolFavoriteMetric | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Auth guard
  useEffect(() => {
    let isMounted = true;
    getActiveAdminSession().then((activeSession) => {
      if (!isMounted) return;
      if (!activeSession) {
        const loginRoute = getAdminLoginRoute();
        navigate(`${loginRoute}?redirect=/admin/favorites`);
      } else {
        setSession(activeSession);
      }
      setLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, [navigate]);

  // Load analytics data
  const loadData = async (tf: FavoritesTimeframe) => {
    setIsRefreshing(true);
    try {
      const data = await fetchFavoritesAnalytics(tf);
      setRankedTools(data.rankedTools);
      setOverview(data.overview);
      if (data.rankedTools.length > 0) {
        setSelectedTool((prev) => {
          if (!prev) return data.rankedTools[0];
          const found = data.rankedTools.find((t) => t.slug === prev.slug);
          return found || data.rankedTools[0];
        });
      }
    } catch {
      // error handling
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    if (session) {
      loadData(timeframe);
    }
  }, [session, timeframe]);

  const handleLogout = async () => {
    await logoutAdmin();
    navigate(getAdminLoginRoute());
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);
    if (newPassword.length < 8) {
      setPasswordStatus({ success: false, message: 'Password must be at least 8 characters.' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordStatus({ success: false, message: 'Passwords do not match.' });
      return;
    }
    setSavingPassword(true);
    try {
      const ok = await updateAdminPassword(newPassword);
      if (ok) {
        setPasswordStatus({ success: true, message: 'Password updated successfully.' });
        setTimeout(() => {
          setShowPasswordModal(false);
          setNewPassword('');
          setConfirmPassword('');
          setPasswordStatus(null);
        }, 1200);
      } else {
        setPasswordStatus({ success: false, message: 'Failed to update password.' });
      }
    } catch {
      setPasswordStatus({ success: false, message: 'Error updating password.' });
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9FE] text-[#1E1035] flex items-center justify-center">
        <div className="text-xs text-[#6D6582]">
          Verifying administrator credentials...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF9FE] text-[#1E1035] flex">
      <SEOHelmet
        title="Favorites Analytics – Admin Insights"
        description="Comprehensive rankings, affinity velocity, and user bookmark trends to guide roadmap decisions."
        canonicalPath="/admin/favorites"
      />

      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        adminEmail={session?.user?.email || 'admin@onlinetools.internal'}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopNav
          pageTitle="Favorites Analytics"
          adminTheme={theme}
          onToggleTheme={toggleTheme}
          onToggleSidebar={() => setSidebarOpen(true)}
          onOpenPasswordModal={() => setShowPasswordModal(true)}
          onLogout={handleLogout}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto space-y-5 sm:space-y-6">
          {/* Header & Quick Intro */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-heading font-bold tracking-tight text-[#1E1035]">
                Tool Favorites &amp; Bookmark Analytics
              </h1>
              <p className="text-xs sm:text-sm text-[#6D6582] mt-0.5">
                Read-only behavioral insights tracking which calculators and utilities users save most frequently.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => loadData(timeframe)}
                disabled={isRefreshing}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#EDE9FE] bg-[#FFFFFF] text-xs font-heading font-semibold text-[#6D6582] hover:text-[#7C3AED] hover:bg-[#F5F3FF] transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </button>
            </div>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Total Platform Favorites */}
            <div
              id="kpi-total-favorites"
              className="bg-[#FFFFFF] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-xl p-5 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">
                  Total Saved Tools
                </span>
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400 flex items-center justify-center">
                  <Heart className="w-4 h-4 fill-rose-600 dark:fill-rose-400" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-2xl font-bold font-mono text-[#0F172A] dark:text-[#F8FAFC]">
                  {overview?.totalFavorites.toLocaleString() || '—'}
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#64748B] dark:text-[#94A3B8]">
                  <span>Avg {overview?.avgFavoritesPerTool || 0} saves per tool</span>
                </div>
              </div>
            </div>

            {/* 2. Most Favorited Tool */}
            <div
              id="kpi-most-favorited"
              className="bg-[#FFFFFF] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-xl p-5 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">
                  #1 Most Favorited
                </span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950 dark:text-amber-400 flex items-center justify-center">
                  <Award className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC] truncate">
                  {overview?.mostFavoritedTool?.name || '—'}
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#2563EB] dark:text-[#60A5FA] font-mono">
                  <span>{overview?.mostFavoritedTool?.count.toLocaleString()} bookmarks</span>
                </div>
              </div>
            </div>

            {/* 3. Fastest Growing Affinity */}
            <div
              id="kpi-fastest-growing"
              className="bg-[#FFFFFF] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-xl p-5 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">
                  Fastest Velocity
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center">
                  <Zap className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC] truncate">
                  {overview?.fastestGrowingTool?.name || '—'}
                </div>
                <div className="flex items-center gap-1 mt-1 text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold font-mono">
                  <span>+{overview?.fastestGrowingTool?.growthPercent}%</span>
                  <span className="text-[#64748B] dark:text-[#94A3B8] font-normal">this period</span>
                </div>
              </div>
            </div>

            {/* 4. Highest Save Conversion Rate */}
            <div
              id="kpi-highest-conversion"
              className="bg-[#FFFFFF] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-xl p-5 shadow-2xs"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">
                  Top Bookmark Rate
                </span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563EB] dark:bg-blue-950 dark:text-[#60A5FA] flex items-center justify-center">
                  <Bookmark className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-3">
                <div className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC] truncate">
                  {overview?.highestConversionTool?.name || '—'}
                </div>
                <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#64748B] dark:text-[#94A3B8] font-mono">
                  <span>{overview?.highestConversionTool?.ratePercent}% save rate</span>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Trend Chart */}
          <FavoritesTrendChart
            data={overview?.timeline || []}
            timeframe={timeframe}
            onTimeframeChange={setTimeframe}
            title={
              selectedTool
                ? `Platform Trend vs ${selectedTool.name}`
                : 'Platform Favorites Velocity'
            }
            subtitle="Historical timeline tracking new bookmark adds and cumulative growth across the directory"
            totalPeriodFavorites={overview?.timeframeFavorites || 0}
            growthPercent={overview?.overallGrowthPercent || 0}
          />

          {/* Split Content: Ranking Table + Deep Dive Sidebar */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 8 Cols: Ranked Tools Table */}
            <div className="lg:col-span-8">
              <FavoritesRankingTable
                tools={rankedTools}
                onSelectTool={setSelectedTool}
                selectedToolSlug={selectedTool?.slug || null}
              />
            </div>

            {/* Right 4 Cols: Insight Sidebar */}
            <div className="lg:col-span-4">
              <FavoritesInsightSidebar
                selectedTool={selectedTool}
                categoryBreakdown={overview?.categoryBreakdown || []}
                totalPlatformFavorites={overview?.totalFavorites || 0}
              />
            </div>
          </div>
        </main>
      </div>

      {/* Admin Password Change Modal */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md bg-[#FFFFFF] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E2E8F0] dark:border-[#1E293B]">
              <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                Update Admin Password
              </h3>
              <button
                type="button"
                onClick={() => {
                  setShowPasswordModal(false);
                  setPasswordStatus(null);
                }}
                className="p-1 rounded text-[#64748B] hover:text-[#0F172A] dark:hover:text-[#F8FAFC]"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-3.5">
              {passwordStatus && (
                <div
                  className={`p-2.5 rounded-lg text-xs flex items-center gap-2 ${
                    passwordStatus.success
                      ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                      : 'bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                  }`}
                >
                  <span>{passwordStatus.message}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1">
                  New Password (min 8 characters)
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs p-2 rounded-lg bg-[#F8FAFC] dark:bg-[#0B0F17] border border-[#CBD5E1] dark:border-[#334155] text-[#0F172A] dark:text-[#F8FAFC]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC] mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs p-2 rounded-lg bg-[#F8FAFC] dark:bg-[#0B0F17] border border-[#CBD5E1] dark:border-[#334155] text-[#0F172A] dark:text-[#F8FAFC]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordStatus(null);
                  }}
                  className="px-3 py-1.5 rounded-md border border-[#E2E8F0] dark:border-[#1E293B] text-xs font-semibold text-[#64748B] dark:text-[#94A3B8]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="px-4 py-1.5 rounded-md bg-[#2563EB] hover:bg-[#1D4ED8] text-[#FFFFFF] text-xs font-semibold disabled:opacity-50"
                >
                  {savingPassword ? 'Saving...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
