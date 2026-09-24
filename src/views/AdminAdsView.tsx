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
import { AdminSidebar } from '../components/admin/AdminSidebar';
import { AdminTopNav } from '../components/admin/AdminTopNav';
import { AdPlacementVisualPreview } from '../components/admin/AdPlacementVisualPreview';
import { AdPlacementEditor } from '../components/admin/AdPlacementEditor';
import {
  getAdConfig,
  saveAdConfig,
  resetAdConfig,
  GlobalAdSettings,
  PageTypeId,
  AdPlacementConfig,
  PlacementPosition,
} from '../services/adManagerService';
import {
  Megaphone,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Plus,
  Power,
  ShieldCheck,
  Radio,
  Sparkles,
  RotateCcw,
  ExternalLink,
  Code,
  Layout,
  Info,
} from 'lucide-react';

const PREDEFINED_POSITIONS: { position: PlacementPosition; name: string; description: string }[] = [
  {
    position: 'below_hero',
    name: 'Below Hero',
    description: 'Prominent banner positioned directly underneath the primary hero heading or search box',
  },
  {
    position: 'sidebar',
    name: 'Sidebar',
    description: 'Dedicated desktop side rail placement alongside the central utility or article',
  },
  {
    position: 'between_sections',
    name: 'Between Sections',
    description: 'Divider banner separating major content blocks or formula breakdown and FAQs',
  },
  {
    position: 'before_footer',
    name: 'Before Footer',
    description: 'Pre-footer placement sitting right above global footer navigation and links',
  },
  {
    position: 'in_content',
    name: 'In-Content',
    description: 'Editorial break banner embedded between article paragraphs or guide subheadings',
  },
  {
    position: 'in_feed',
    name: 'In-Feed',
    description: 'Sponsored card woven directly into directory utility grids or card archives',
  },
  {
    position: 'below_tool',
    name: 'Below Tool',
    description: 'Immediate post-calculation placement underneath interactive converter or calculator cards',
  },
];

export function AdminAdsView() {
  const { navigate } = useRouter();
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

  // Ads Settings State
  const [config, setConfig] = useState<GlobalAdSettings>(() => getAdConfig());
  const [selectedPageId, setSelectedPageId] = useState<PageTypeId>('homepage');
  const [selectedPlacementId, setSelectedPlacementId] = useState<string | null>(null);
  const [saveBanner, setSaveBanner] = useState<string | null>(null);

  // Auth guard
  useEffect(() => {
    let isMounted = true;
    getActiveAdminSession().then((activeSession) => {
      if (!isMounted) return;
      if (!activeSession) {
        const loginRoute = getAdminLoginRoute();
        navigate(`${loginRoute}?redirect=/admin/ads`);
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

  const showLiveFeedback = (message: string) => {
    setSaveBanner(message);
    setTimeout(() => {
      setSaveBanner((prev) => (prev === message ? null : prev));
    }, 3000);
  };

  // 1. Master Global Toggle
  const handleToggleGlobal = (enabled: boolean) => {
    const updated: GlobalAdSettings = {
      ...config,
      globalEnabled: enabled,
    };
    setConfig(updated);
    saveAdConfig(updated);
    showLiveFeedback(
      enabled
        ? 'Global ad delivery enabled across the entire website.'
        : 'Global ad delivery disabled. All ads hidden site-wide.'
    );
  };

  // 2. Publisher ID Update
  const handlePublisherIdChange = (pubId: string) => {
    const updated: GlobalAdSettings = {
      ...config,
      publisherId: pubId.trim(),
    };
    setConfig(updated);
    saveAdConfig(updated);
  };

  // 3. Test Mode Toggle
  const handleToggleTestMode = (testMode: boolean) => {
    const updated: GlobalAdSettings = {
      ...config,
      testMode,
    };
    setConfig(updated);
    saveAdConfig(updated);
    showLiveFeedback(
      testMode
        ? 'Test mode enabled: subtle slot outlines and slot IDs rendered.'
        : 'Test mode disabled: production ad format active.'
    );
  };

  // 4. Per-Page On/Off Toggle
  const handleTogglePage = (pageId: PageTypeId, enabled: boolean) => {
    const currentPage = config.pages[pageId];
    if (!currentPage) return;

    const updatedPages = {
      ...config.pages,
      [pageId]: {
        ...currentPage,
        enabled,
      },
    };

    const updated: GlobalAdSettings = {
      ...config,
      pages: updatedPages,
    };
    setConfig(updated);
    saveAdConfig(updated);
    showLiveFeedback(
      enabled
        ? `Ads activated on ${currentPage.name}.`
        : `Ads turned OFF on ${currentPage.name}.`
    );
  };

  // 5. Update specific placement
  const handleUpdatePlacement = (
    placementId: string,
    updates: Partial<AdPlacementConfig>
  ) => {
    const currentPage = config.pages[selectedPageId];
    if (!currentPage) return;

    const updatedPlacements = currentPage.placements.map((p) =>
      p.id === placementId ? { ...p, ...updates } : p
    );

    const updated: GlobalAdSettings = {
      ...config,
      pages: {
        ...config.pages,
        [selectedPageId]: {
          ...currentPage,
          placements: updatedPlacements,
        },
      },
    };

    setConfig(updated);
    saveAdConfig(updated);
    showLiveFeedback('Placement configuration saved and broadcasted live.');
  };

  // 6. Toggle placement enabled/disabled from preview
  const handleTogglePlacement = (placementId: string, enabled: boolean) => {
    handleUpdatePlacement(placementId, { enabled });
  };

  // 7. Add a new placement position if not existing
  const handleAddPlacement = (posInfo: typeof PREDEFINED_POSITIONS[0]) => {
    const currentPage = config.pages[selectedPageId];
    if (!currentPage) return;

    const exists = currentPage.placements.some((p) => p.position === posInfo.position);
    if (exists) {
      // Just select it
      const existing = currentPage.placements.find((p) => p.position === posInfo.position);
      if (existing) setSelectedPlacementId(existing.id);
      return;
    }

    const newId = `${selectedPageId}_${posInfo.position}`;
    const newPlacement: AdPlacementConfig = {
      id: newId,
      position: posInfo.position,
      name: posInfo.name,
      description: posInfo.description,
      enabled: true,
      adUnitCode: '',
      format: posInfo.position === 'sidebar' ? 'skyscraper' : 'responsive',
      minHeightPx: 90,
    };

    const updated: GlobalAdSettings = {
      ...config,
      pages: {
        ...config.pages,
        [selectedPageId]: {
          ...currentPage,
          placements: [...currentPage.placements, newPlacement],
        },
      },
    };

    setConfig(updated);
    saveAdConfig(updated);
    setSelectedPlacementId(newId);
    showLiveFeedback(`Added new placement "${posInfo.name}" to ${currentPage.name}.`);
  };

  // 8. Reset to default config
  const handleResetConfig = () => {
    if (window.confirm('Reset all Google Ads settings to default template? Custom unit codes will be reverted.')) {
      const reset = resetAdConfig();
      setConfig(reset);
      showLiveFeedback('Ads configuration reset to original factory defaults.');
    }
  };

  const activePageConfig = config.pages[selectedPageId];

  // Calculate global stats
  const pageEntries = Object.values(config.pages);
  const totalPlacementsCount = pageEntries.reduce(
    (acc, page) => acc + page.placements.length,
    0
  );
  const activePlacementsCount = pageEntries.reduce(
    (acc, page) =>
      acc + (page.enabled ? page.placements.filter((p) => p.enabled).length : 0),
    0
  );

  // Predefined positions not yet added on active page
  const availablePositions = PREDEFINED_POSITIONS.filter(
    (pos) => !activePageConfig.placements.some((p) => p.position === pos.position)
  );

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
        title="Google Ads Manager – Admin Controls"
        description="Configure site-wide ad delivery, per-page toggle controls, visual placement wireframes, and Google AdSense ad unit IDs."
        canonicalPath="/admin/ads"
      />

      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        adminEmail={session?.user?.email || 'admin@onlinetools.internal'}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopNav
          pageTitle="Google Ads Manager"
          adminTheme={theme}
          onToggleTheme={toggleTheme}
          onToggleSidebar={() => setSidebarOpen(true)}
          onOpenPasswordModal={() => setShowPasswordModal(true)}
          onLogout={handleLogout}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto space-y-5 sm:space-y-6">
          {/* Header & Live Notification Toast */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-[#7C3AED]" />
                <h1 className="text-xl sm:text-2xl font-heading font-bold tracking-tight text-[#1E1035]">
                  Google Ads &amp; Placement Manager
                </h1>
              </div>
              <p className="text-xs sm:text-sm text-[#6D6582] mt-0.5">
                Manage global monetization, per-page toggles, and live Google AdSense ad unit IDs without code redeployment.
              </p>
            </div>

            <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
              <button
                type="button"
                id="reset-ads-config-btn"
                onClick={handleResetConfig}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#EDE9FE] bg-[#FFFFFF] text-xs font-heading font-semibold text-[#6D6582] hover:text-[#7C3AED] hover:bg-[#F5F3FF] transition-colors cursor-pointer shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Defaults</span>
              </button>
            </div>
          </div>

          {/* Live Notification Banner */}
          {saveBanner && (
            <div
              id="ads-live-toast"
              className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-[#2563EB]/40 text-xs text-[#0F172A] dark:text-[#F8FAFC] flex items-center justify-between gap-2 animate-in fade-in"
            >
              <div className="flex items-center gap-2">
                <Radio className="w-4 h-4 text-[#2563EB] animate-pulse shrink-0" />
                <span className="font-semibold">{saveBanner}</span>
              </div>
              <span className="text-[10px] font-mono text-[#64748B] dark:text-[#94A3B8]">
                Real-time broadcast dispatched
              </span>
            </div>
          )}

          {/* SECTION 1: GLOBAL MASTER CONTROLS */}
          <div
            id="global-ads-control-card"
            className="bg-[#FFFFFF] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-xl p-5 shadow-2xs space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E2E8F0] dark:border-[#1E293B]">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    config.globalEnabled
                      ? 'bg-blue-50 text-[#2563EB] dark:bg-blue-950/40 dark:text-[#60A5FA]'
                      : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
                  }`}
                >
                  <Power className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                      Global Ads Delivery Switch
                    </h2>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        config.globalEnabled
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                      }`}
                    >
                      {config.globalEnabled ? 'SITE-WIDE ACTIVE' : 'ALL ADS MUTED'}
                    </span>
                  </div>
                  <p className="text-xs text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                    Master toggle to instantly enable or shut down all advertisements across the entire platform
                  </p>
                </div>
              </div>

              {/* Master Switch */}
              <div className="flex items-center gap-3 self-end sm:self-center">
                <span className="text-xs font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                  {config.globalEnabled ? 'Enabled' : 'Disabled'}
                </span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    id="global-ads-toggle"
                    checked={config.globalEnabled}
                    onChange={(e) => handleToggleGlobal(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-[#CBD5E1] dark:bg-[#334155] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#2563EB]" />
                </label>
              </div>
            </div>

            {/* Quick Global Settings: Publisher ID & Test Mode */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 text-xs">
              <div className="sm:col-span-7 space-y-1.5">
                <label
                  htmlFor="ads-publisher-id-input"
                  className="font-semibold text-[#0F172A] dark:text-[#F8FAFC] flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Google AdSense Publisher ID</span>
                </label>
                <input
                  id="ads-publisher-id-input"
                  type="text"
                  value={config.publisherId}
                  onChange={(e) => handlePublisherIdChange(e.target.value)}
                  placeholder="e.g. ca-pub-1234567890123456"
                  className="w-full text-xs font-mono p-2 rounded-lg bg-[#F8FAFC] dark:bg-[#0B0F17] border border-[#CBD5E1] dark:border-[#334155] text-[#0F172A] dark:text-[#F8FAFC] placeholder-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                />
                <p className="text-[10px] text-[#64748B] dark:text-[#94A3B8]">
                  Used for the account header snippet and client validation.
                </p>
              </div>

              <div className="sm:col-span-5 p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#0B0F17] border border-[#E2E8F0] dark:border-[#1E293B] flex items-center justify-between">
                <div>
                  <div className="font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                    Slot Preview Outlines
                  </div>
                  <div className="text-[10px] text-[#64748B] dark:text-[#94A3B8] mt-0.5">
                    Renders dashed outlines & slot IDs on public pages for placement testing
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer ml-3">
                  <input
                    type="checkbox"
                    id="ads-test-mode-toggle"
                    checked={config.testMode}
                    onChange={(e) => handleToggleTestMode(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-[#CBD5E1] dark:bg-[#334155] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2563EB]" />
                </label>
              </div>
            </div>
          </div>

          {/* SECTION 2: PER-PAGE TOGGLE & SELECTION GRID */}
          <div className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                  Per-Page Controls & Routing
                </h2>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                  Each page type has an independent on/off toggle and custom placement configuration
                </p>
              </div>
              <div className="text-xs font-medium text-[#64748B] dark:text-[#94A3B8]">
                Active Slots: <span className="font-bold text-[#0F172A] dark:text-[#F8FAFC]">{config.globalEnabled ? activePlacementsCount : 0}</span> / {totalPlacementsCount}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {(Object.keys(config.pages) as PageTypeId[]).map((pageId) => {
                const page = config.pages[pageId];
                const isSelected = selectedPageId === pageId;
                const activeSlotsInPage = page.placements.filter((p) => p.enabled).length;

                return (
                  <div
                    key={pageId}
                    id={`page-card-${pageId}`}
                    onClick={() => {
                      setSelectedPageId(pageId);
                      setSelectedPlacementId(null);
                    }}
                    className={`rounded-xl border p-3.5 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-[#2563EB] bg-[#FFFFFF] dark:bg-[#0F172A] shadow-xs ring-2 ring-[#2563EB]/50'
                        : 'border-[#E2E8F0] dark:border-[#1E293B] bg-[#FFFFFF] dark:bg-[#0F172A] hover:border-[#CBD5E1] dark:hover:border-[#334155]'
                    }`}
                  >
                    <div className="flex items-center justify-between pb-2 border-b border-[#E2E8F0] dark:border-[#1E293B]">
                      <span className="text-xs font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                        {page.name}
                      </span>
                      {/* Individual Page On/Off Toggle */}
                      <label
                        className="relative inline-flex items-center cursor-pointer"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={page.enabled}
                          onChange={(e) => handleTogglePage(pageId, e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-8 h-4 bg-[#CBD5E1] dark:bg-[#334155] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#2563EB]" />
                      </label>
                    </div>

                    <div className="mt-2 space-y-1 text-[11px]">
                      <div className="font-mono text-[10px] text-[#64748B] dark:text-[#94A3B8] truncate">
                        {page.routeExample}
                      </div>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[#64748B] dark:text-[#94A3B8]">Placements:</span>
                        <span
                          className={`font-semibold ${
                            page.enabled
                              ? 'text-[#2563EB] dark:text-[#60A5FA]'
                              : 'text-[#94A3B8]'
                          }`}
                        >
                          {page.enabled ? `${activeSlotsInPage}/${page.placements.length} active` : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 3: DETAILED PLACEMENT CONTROL & VISUAL PREVIEW FOR SELECTED PAGE */}
          <div className="space-y-4 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-[#0F172A] dark:text-[#F8FAFC] flex items-center gap-2">
                  <Layout className="w-4 h-4 text-[#2563EB]" />
                  <span>Placements & Slot Setup: {activePageConfig.name}</span>
                </h2>
                <p className="text-xs text-[#64748B] dark:text-[#94A3B8]">
                  Select slots to customize AdSense ad units, or add predefined positions to this template
                </p>
              </div>

              {/* Add Predefined Placement Dropdown / Button */}
              {availablePositions.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#64748B] dark:text-[#94A3B8]">Add Position:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {availablePositions.map((pos) => (
                      <button
                        key={pos.position}
                        type="button"
                        onClick={() => handleAddPlacement(pos)}
                        className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-lg border border-[#CBD5E1] dark:border-[#334155] bg-[#FFFFFF] dark:bg-[#0F172A] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B] text-[#0F172A] dark:text-[#F8FAFC] transition-colors cursor-pointer"
                      >
                        <Plus className="w-3 h-3 text-[#2563EB]" />
                        <span>{pos.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Split Grid: Visual Placement Preview wireframe on Left, Form Controls on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Visual Placement Preview Wireframe */}
              <div className="lg:col-span-6">
                <AdPlacementVisualPreview
                  pageConfig={activePageConfig}
                  globalEnabled={config.globalEnabled}
                  selectedPlacementId={selectedPlacementId}
                  onSelectPlacement={(id) => setSelectedPlacementId(id)}
                  onTogglePlacement={handleTogglePlacement}
                />
              </div>

              {/* Right Column: Placement Editor & Ad Unit Codes */}
              <div className="lg:col-span-6">
                <AdPlacementEditor
                  pageConfig={activePageConfig}
                  selectedPlacementId={selectedPlacementId}
                  onSelectPlacement={(id) => setSelectedPlacementId(id)}
                  onUpdatePlacement={handleUpdatePlacement}
                />
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Password Update Modal */}
      {showPasswordModal && (
        <div
          id="admin-password-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
        >
          <div className="bg-[#FFFFFF] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-xl max-w-sm w-full p-5 space-y-4 shadow-xl">
            <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
              Update Admin Password
            </h3>
            {passwordStatus && (
              <div
                className={`p-2.5 rounded-lg text-xs ${
                  passwordStatus.success
                    ? 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : 'bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                }`}
              >
                {passwordStatus.message}
              </div>
            )}
            <form onSubmit={handleChangePassword} className="space-y-3 text-xs">
              <div>
                <label className="block text-[#64748B] dark:text-[#94A3B8] mb-1">
                  New Password (min 8 chars)
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  className="w-full p-2 rounded-lg bg-[#F8FAFC] dark:bg-[#0B0F17] border border-[#CBD5E1] dark:border-[#334155] text-[#0F172A] dark:text-[#F8FAFC]"
                />
              </div>
              <div>
                <label className="block text-[#64748B] dark:text-[#94A3B8] mb-1">
                  Confirm Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full p-2 rounded-lg bg-[#F8FAFC] dark:bg-[#0B0F17] border border-[#CBD5E1] dark:border-[#334155] text-[#0F172A] dark:text-[#F8FAFC]"
                />
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordStatus(null);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#2563EB] text-white hover:bg-[#1D4ED8] disabled:opacity-50"
                >
                  {savingPassword ? 'Updating...' : 'Save Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
