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
import { ToolTrendChart } from '../components/admin/ToolTrendChart';
import { TopPerformingToolsTable } from '../components/admin/TopPerformingToolsTable';
import { UnderperformingToolsTable } from '../components/admin/UnderperformingToolsTable';
import {
  fetchAllToolsAnalytics,
  computeAnalyticsOverview,
  ToolAnalyticsRecord,
  TimeframePeriod,
  formatDuration,
} from '../services/toolAnalyticsService';
import {
  BarChart3,
  Eye,
  MousePointerClick,
  Clock,
  Heart,
  TrendingUp,
  Search,
  ExternalLink,
  ChevronDown,
  Layers,
  Wrench,
  Sparkles,
  Smartphone,
  Monitor,
  CheckCircle,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';

export function AdminAnalyticsView() {
  const { currentPath, navigate } = useRouter();
  const { theme, toggleTheme } = useTheme();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Password Update Modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  // Analytics Data
  const [timeframe, setTimeframe] = useState<TimeframePeriod>('30d');
  const [allToolRecords, setAllToolRecords] = useState<ToolAnalyticsRecord[]>([]);
  const [selectedToolSlug, setSelectedToolSlug] = useState<string>('percentage-calculator');
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(true);
  const [toolSearchQuery, setToolSearchQuery] = useState('');
  const [selectorOpen, setSelectorOpen] = useState(false);

  // Parse tool query param from URL if present (e.g. /admin/analytics?tool=word-counter)
  useEffect(() => {
    try {
      const urlParams = new URLSearchParams(window.location.search || '');
      const toolParam = urlParams.get('tool');
      if (toolParam) {
        setSelectedToolSlug(toolParam);
      }
    } catch {
      // ignore
    }
  }, [currentPath]);

  // Verify authentication on mount
  useEffect(() => {
    let isMounted = true;
    getActiveAdminSession().then((activeSession) => {
      if (!isMounted) return;
      if (!activeSession) {
        const loginRoute = getAdminLoginRoute();
        navigate(`${loginRoute}?redirect=/admin/analytics`);
      } else {
        setSession(activeSession);
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  // Load analytics records whenever timeframe changes
  useEffect(() => {
    let isMounted = true;
    setIsLoadingAnalytics(true);

    fetchAllToolsAnalytics(timeframe).then((records) => {
      if (!isMounted) return;
      setAllToolRecords(records);
      // If current selected slug isn't found, pick the first one
      if (records.length > 0 && !records.some((r) => r.slug === selectedToolSlug)) {
        setSelectedToolSlug(records[0].slug);
      }
      setIsLoadingAnalytics(false);
    });

    return () => {
      isMounted = false;
    };
  }, [timeframe]);

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
    const success = await updateAdminPassword(newPassword);
    setSavingPassword(false);

    if (success) {
      setPasswordStatus({ success: true, message: 'Password updated successfully.' });
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowPasswordModal(false);
        setPasswordStatus(null);
      }, 1500);
    } else {
      setPasswordStatus({ success: false, message: 'Failed to update password. Please try again.' });
    }
  };

  // Find currently active tool record
  const selectedTool = useMemo(() => {
    return allToolRecords.find((t) => t.slug === selectedToolSlug) || allToolRecords[0] || null;
  }, [allToolRecords, selectedToolSlug]);

  const overviewSummary = useMemo(() => {
    return computeAnalyticsOverview(allToolRecords);
  }, [allToolRecords]);

  // Filter tools for dropdown picker
  const filteredPickerTools = useMemo(() => {
    return allToolRecords.filter((t) =>
      t.name.toLowerCase().includes(toolSearchQuery.toLowerCase()) ||
      t.slug.toLowerCase().includes(toolSearchQuery.toLowerCase())
    );
  }, [allToolRecords, toolSearchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9FE] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#7C3AED]/20 border-t-[#7C3AED] rounded-full animate-spin" />
          <p className="text-xs font-medium text-[#6D6582]">
            Validating administrative session...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={theme === 'dark' ? 'dark' : ''}>
      <SEOHelmet
        title="Tool Performance Analytics – Admin Dashboard"
        description="Detailed per-tool views, invocations, average duration, conversion rates, and sortable performance analytics."
        canonicalPath="/admin/analytics"
        noindex={true}
      />

      <div
        id="admin-analytics-container"
        className="min-h-screen bg-[#FAF9FE] text-[#1E1035] flex font-sans antialiased transition-colors"
      >
        {/* Admin Sidebar Navigation */}
        <AdminSidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          adminEmail={session?.user?.email || 'admin@onlinetools.internal'}
        />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <AdminTopNav
            pageTitle="Tool Performance Analytics"
            adminTheme={theme}
            onToggleTheme={toggleTheme}
            onToggleSidebar={() => setSidebarOpen(true)}
            onOpenPasswordModal={() => setShowPasswordModal(true)}
            onLogout={handleLogout}
          />

          <main id="admin-analytics-main" className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto space-y-6 sm:space-y-8">
            {/* Header & Global Selector */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#EDE9FE]">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#7C3AED]/10 dark:bg-[#7C3AED]/20 flex items-center justify-center text-[#7C3AED]">
                    <BarChart3 className="w-4 h-4" />
                  </div>
                  <div>
                    <h1 className="text-lg sm:text-xl font-bold tracking-tight text-[#1E1035]">
                      Tool Performance Analytics
                    </h1>
                    <p className="text-xs text-[#6D6582]">
                      Real-time usage metrics, conversion efficiency, and engagement diagnostics
                    </p>
                  </div>
                </div>
              </div>

              {/* Tool Picker Combobox & Timeframe Switcher */}
              <div className="flex flex-wrap items-center gap-3">
                {/* Tool Selector Dropdown */}
                <div className="relative">
                  <button
                    type="button"
                    id="tool-selector-btn"
                    onClick={() => setSelectorOpen(!selectorOpen)}
                    className="flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-lg border border-[#EDE9FE] bg-[#FFFFFF] hover:border-[#7C3AED] text-[#1E1035] shadow-2xs cursor-pointer min-w-[220px] justify-between"
                  >
                    <span className="truncate">
                      {selectedTool ? selectedTool.name : 'Select a tool...'}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-[#94A3B8] shrink-0" />
                  </button>

                  {selectorOpen && (
                    <div
                      id="tool-selector-dropdown"
                      className="absolute right-0 top-full mt-1.5 w-72 bg-[#FFFFFF] border border-[#EDE9FE] rounded-xl shadow-lg z-30 p-2"
                    >
                      <div className="relative mb-2">
                        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                        <input
                          type="text"
                          value={toolSearchQuery}
                          onChange={(e) => setToolSearchQuery(e.target.value)}
                          placeholder="Search tool name..."
                          autoFocus
                          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#EDE9FE] bg-[#FAF9FE] text-[#1E1035] focus:outline-hidden focus:border-[#7C3AED]"
                        />
                      </div>

                      <div className="max-h-56 overflow-y-auto space-y-0.5 text-xs">
                        {filteredPickerTools.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => {
                              setSelectedToolSlug(t.slug);
                              setSelectorOpen(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-md flex items-center justify-between transition-colors cursor-pointer ${
                              t.slug === selectedToolSlug
                                ? 'bg-[#7C3AED] text-white'
                                : 'hover:bg-[#F5F3FF]  text-[#1E1035]'
                            }`}
                          >
                            <span className="truncate font-medium">{t.name}</span>
                            <span className="text-[10px] opacity-75 font-mono ml-2 shrink-0">
                              {t.totalViews.toLocaleString()} views
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Global Timeframe Selector */}
                <div className="flex items-center p-0.5 rounded-lg bg-[#FAF9FE] border border-[#EDE9FE] text-xs font-semibold">
                  {(['7d', '30d', '90d'] as TimeframePeriod[]).map((tf) => (
                    <button
                      key={tf}
                      type="button"
                      onClick={() => setTimeframe(tf)}
                      className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                        timeframe === tf
                          ? 'bg-[#FFFFFF] text-[#1E1035] shadow-2xs'
                          : 'text-[#6D6582] hover:text-[#0F172A] dark:hover:text-[#F8FAFC]'
                      }`}
                    >
                      {tf === '7d' ? '7 Days' : tf === '30d' ? '30 Days' : '90 Days'}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Global Sitewide Metrics Summary */}
            <section aria-labelledby="global-analytics-summary" className="space-y-3">
              <h2 id="global-analytics-summary" className="sr-only">
                Global Performance Summary
              </h2>
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 sm:gap-4">
                {/* Total Tools Active */}
                <div className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-xl p-4 shadow-2xs">
                  <div className="flex items-center justify-between text-[#6D6582] text-xs mb-1.5">
                    <span>Monitored Tools</span>
                    <Wrench className="w-3.5 h-3.5 text-[#7C3AED]" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-[#1E1035]">
                    {overviewSummary.totalTools}
                  </div>
                  <div className="text-[11px] text-[#6D6582] mt-1">
                    {overviewSummary.activeTools} active in production
                  </div>
                </div>

                {/* Overall Views */}
                <div className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-xl p-4 shadow-2xs">
                  <div className="flex items-center justify-between text-[#6D6582] text-xs mb-1.5">
                    <span>Total Page Views</span>
                    <Eye className="w-3.5 h-3.5 text-[#7C3AED]" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-[#1E1035]">
                    {overviewSummary.totalViews.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1 font-semibold flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    +{overviewSummary.periodGrowthPercent}% vs prior period
                  </div>
                </div>

                {/* Invocations / Uses */}
                <div className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-xl p-4 shadow-2xs">
                  <div className="flex items-center justify-between text-[#6D6582] text-xs mb-1.5">
                    <span>Total Uses / Clicks</span>
                    <MousePointerClick className="w-3.5 h-3.5 text-[#64748B]" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-[#1E1035]">
                    {overviewSummary.totalUses.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-[#6D6582] mt-1">
                    {overviewSummary.avgConversionRate}% avg conversion
                  </div>
                </div>

                {/* Avg Time on Page */}
                <div className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-xl p-4 shadow-2xs">
                  <div className="flex items-center justify-between text-[#6D6582] text-xs mb-1.5">
                    <span>Avg Time on Page</span>
                    <Clock className="w-3.5 h-3.5 text-[#64748B]" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-[#1E1035]">
                    {formatDuration(overviewSummary.avgTimeOnPageSec)}
                  </div>
                  <div className="text-[11px] text-[#6D6582] mt-1">
                    Healthy engagement rate
                  </div>
                </div>

                {/* Total Favorites */}
                <div
                  onClick={() => navigate('/admin/favorites')}
                  className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-xl p-4 shadow-2xs col-span-2 lg:col-span-1 hover:border-[#7C3AED]  cursor-pointer transition-colors group"
                >
                  <div className="flex items-center justify-between text-[#6D6582] text-xs mb-1.5">
                    <span className="group-hover:text-[#7C3AED] dark:group-hover:text-[#60A5FA] transition-colors">
                      Total User Favorites
                    </span>
                    <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
                  </div>
                  <div className="text-xl sm:text-2xl font-bold font-mono text-[#1E1035]">
                    {overviewSummary.totalFavorites.toLocaleString()}
                  </div>
                  <div className="text-[11px] text-[#7C3AED] text-[#7C3AED] mt-1 flex items-center justify-between">
                    <span>Saved across profiles</span>
                    <span className="font-medium text-[10px]">View rankings →</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Selected Tool Deep-Dive Section */}
            {selectedTool && (
              <section
                id="selected-tool-deep-dive"
                aria-labelledby="tool-detail-heading"
                className="space-y-5"
              >
                {/* Tool Metadata Banner */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-xl bg-[#FFFFFF] border border-[#EDE9FE] shadow-2xs">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 id="tool-detail-heading" className="text-base sm:text-lg font-bold text-[#1E1035]">
                        {selectedTool.name}
                      </h2>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          selectedTool.status === 'active'
                            ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                        }`}
                      >
                        {selectedTool.status === 'active' ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-[#FAF9FE] text-[#6D6582] font-mono">
                        {selectedTool.category}
                      </span>
                      {selectedTool.isCustom && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800 font-mono">
                          Zip Embedded
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#6D6582] mt-1">
                      Target route: <code className="font-mono text-[#7C3AED] text-[#7C3AED]">/tools/{selectedTool.slug}</code>
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`/tools/${selectedTool.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#EDE9FE] hover:border-[#7C3AED] bg-[#FFFFFF] text-[#1E1035] shadow-2xs"
                    >
                      <span>Open Live Tool</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <button
                      type="button"
                      onClick={() => navigate('/admin/tools')}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-2xs cursor-pointer"
                    >
                      <Wrench className="w-3.5 h-3.5" />
                      <span>Manage Tool</span>
                    </button>
                  </div>
                </div>

                {/* 4 Tool Specific Metric Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4">
                  {/* Views */}
                  <div className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between text-[#6D6582] text-xs mb-1.5">
                      <span>Total Views ({timeframe})</span>
                      <Eye className="w-3.5 h-3.5 text-[#7C3AED]" />
                    </div>
                    <div className="text-2xl font-bold font-mono text-[#1E1035]">
                      {selectedTool.totalViews.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-[#6D6582] mt-1 flex items-center gap-1">
                      <span className={selectedTool.growthRatePercent >= 0 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-rose-600 dark:text-rose-400 font-semibold'}>
                        {selectedTool.growthRatePercent >= 0 ? `+${selectedTool.growthRatePercent}%` : `${selectedTool.growthRatePercent}%`}
                      </span>
                      <span>trend</span>
                    </div>
                  </div>

                  {/* Uses / Invocations */}
                  <div className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between text-[#6D6582] text-xs mb-1.5">
                      <span>Total Uses / Clicks</span>
                      <MousePointerClick className="w-3.5 h-3.5 text-[#64748B]" />
                    </div>
                    <div className="text-2xl font-bold font-mono text-[#1E1035]">
                      {selectedTool.totalUses.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-[#6D6582] mt-1">
                      <span className="font-semibold text-[#1E1035]">{selectedTool.conversionRate}%</span> interaction rate
                    </div>
                  </div>

                  {/* Avg Time on Page */}
                  <div className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between text-[#6D6582] text-xs mb-1.5">
                      <span>Average Time on Page</span>
                      <Clock className="w-3.5 h-3.5 text-[#64748B]" />
                    </div>
                    <div className="text-2xl font-bold font-mono text-[#1E1035]">
                      {formatDuration(selectedTool.avgTimeOnPageSec)}
                    </div>
                    <div className="text-[11px] text-[#6D6582] mt-1">
                      {selectedTool.bounceRatePercent}% bounce rate
                    </div>
                  </div>

                  {/* Favorites */}
                  <div className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-xl p-4 shadow-2xs">
                    <div className="flex items-center justify-between text-[#6D6582] text-xs mb-1.5">
                      <span>Favorite Count</span>
                      <Heart className="w-3.5 h-3.5 text-rose-500" />
                    </div>
                    <div className="text-2xl font-bold font-mono text-[#1E1035]">
                      {selectedTool.favoriteCount.toLocaleString()}
                    </div>
                    <div className="text-[11px] text-[#6D6582] mt-1">
                      Bookmarked by active users
                    </div>
                  </div>
                </div>

                {/* Trend Graph Over Time (7 / 30 / 90 days) */}
                <ToolTrendChart
                  toolName={selectedTool.name}
                  data={selectedTool.trend}
                  timeframe={timeframe}
                  onTimeframeChange={(tf) => setTimeframe(tf)}
                />

                {/* Device Split & Engagement Diagnostics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Device Distribution */}
                  <div className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-xl p-5 shadow-2xs">
                    <h3 className="text-xs font-bold text-[#1E1035] mb-3">
                      Device Traffic Split
                    </h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex items-center justify-between text-xs mb-1 text-[#6D6582]">
                          <span className="flex items-center gap-1.5">
                            <Monitor className="w-3.5 h-3.5 text-[#7C3AED]" />
                            Desktop / Laptop
                          </span>
                          <span className="font-mono font-semibold text-[#1E1035]">
                            {selectedTool.desktopPercent}%
                          </span>
                        </div>
                        <div className="w-full bg-[#E2E8F0] dark:bg-[#1E293B] h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-[#7C3AED] h-full rounded-full"
                            style={{ width: `${selectedTool.desktopPercent}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-xs mb-1 text-[#6D6582]">
                          <span className="flex items-center gap-1.5">
                            <Smartphone className="w-3.5 h-3.5 text-[#64748B]" />
                            Mobile & Tablet
                          </span>
                          <span className="font-mono font-semibold text-[#1E1035]">
                            {selectedTool.mobilePercent}%
                          </span>
                        </div>
                        <div className="w-full bg-[#E2E8F0] dark:bg-[#1E293B] h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-[#64748B] h-full rounded-full"
                            style={{ width: `${selectedTool.mobilePercent}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Funnel Completion */}
                  <div className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-xl p-5 shadow-2xs">
                    <h3 className="text-xs font-bold text-[#1E1035] mb-3">
                      Interaction Funnel
                    </h3>
                    <div className="space-y-2 text-xs">
                      <div className="flex items-center justify-between py-1 border-b border-[#EDE9FE]">
                        <span className="text-[#6D6582]">Page Impression</span>
                        <span className="font-mono font-bold text-[#1E1035]">100%</span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-[#EDE9FE]">
                        <span className="text-[#6D6582]">Input Interaction</span>
                        <span className="font-mono font-bold text-[#1E1035]">
                          {Math.min(96, Math.round(selectedTool.conversionRate * 1.15))}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-1 border-b border-[#EDE9FE]">
                        <span className="text-[#6D6582]">Calculation / Invocations</span>
                        <span className="font-mono font-bold text-[#7C3AED] text-[#7C3AED]">
                          {selectedTool.conversionRate}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <span className="text-[#6D6582]">Result Copied / Shared</span>
                        <span className="font-mono font-bold text-[#1E1035]">
                          {Math.round(selectedTool.conversionRate * 0.42)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Diagnostic / Health Assessment */}
                  <div className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-xl p-5 shadow-2xs">
                    <h3 className="text-xs font-bold text-[#1E1035] mb-2 flex items-center gap-1.5">
                      {selectedTool.performanceTier === 'underperforming' ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                      ) : (
                        <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                      )}
                      <span>Performance Diagnostic</span>
                    </h3>
                    <p className="text-xs text-[#6D6582] leading-relaxed mb-3">
                      {selectedTool.diagnosticIssue ||
                        'This utility sustains solid engagement, low bounce rates, and healthy repeat calculation sessions.'}
                    </p>
                    <div className="p-2.5 rounded-lg bg-[#FAF9FE] border border-[#EDE9FE] text-[11px] text-[#1E1035]">
                      <span className="font-bold block text-[#7C3AED] text-[#7C3AED] mb-0.5">
                        Recommendation:
                      </span>
                      {selectedTool.recommendation ||
                        'Maintain active status and cross-link from newly published how-to guides.'}
                    </div>
                  </div>
                </div>
              </section>
            )}

            {/* Sortable Top Performing Tools Table */}
            <section aria-labelledby="top-tools-heading" className="space-y-4">
              <TopPerformingToolsTable
                tools={allToolRecords}
                selectedSlug={selectedToolSlug}
                onSelectTool={(slug) => {
                  setSelectedToolSlug(slug);
                  window.scrollTo({ top: 120, behavior: 'smooth' });
                }}
              />
            </section>

            {/* Sortable Underperforming Tools Table */}
            <section aria-labelledby="underperforming-tools-heading" className="space-y-4">
              <UnderperformingToolsTable
                tools={allToolRecords}
                selectedSlug={selectedToolSlug}
                onSelectTool={(slug) => {
                  setSelectedToolSlug(slug);
                  window.scrollTo({ top: 120, behavior: 'smooth' });
                }}
              />
            </section>
          </main>
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordModal && (
        <div
          id="admin-analytics-password-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
        >
          <div className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-6 max-w-md w-full shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-[#7C3AED]/10 dark:bg-[#7C3AED]/20 flex items-center justify-center text-[#7C3AED]">
                <KeyRound className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#1E1035]">
                  Change Admin Password
                </h3>
                <p className="text-xs text-[#6D6582]">
                  Update your dashboard administrative credentials
                </p>
              </div>
            </div>

            {passwordStatus && (
              <div
                className={`p-3 rounded-lg text-xs flex items-center gap-2 mb-4 ${
                  passwordStatus.success
                    ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
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
                <label className="block text-xs font-semibold text-[#1E1035] mb-1">
                  New Password (min 8 chars)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#EDE9FE] bg-[#FAF9FE] text-[#1E1035] focus:outline-hidden focus:border-[#7C3AED]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#1E1035] mb-1">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-[#EDE9FE] bg-[#FAF9FE] text-[#1E1035] focus:outline-hidden focus:border-[#7C3AED]"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-lg text-[#64748B] hover:text-[#0F172A] dark:hover:text-[#F8FAFC] hover:bg-[#F5F3FF]  cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {savingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
