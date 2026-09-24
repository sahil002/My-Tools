import React, { useState, useEffect, useCallback } from 'react';
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
import {
  SiteSettingsData,
  getSiteSettings,
  saveSiteSettings,
  resetSiteSettings,
  applyThemeSettings,
} from '../services/siteSettingsService';
import { GeneralSettingsTab } from '../components/admin/GeneralSettingsTab';
import { ThemeSettingsTab } from '../components/admin/ThemeSettingsTab';
import { AdminUsersTab } from '../components/admin/AdminUsersTab';
import { SeoSettingsTab } from '../components/admin/SeoSettingsTab';
import {
  Settings,
  Globe,
  Palette,
  Users,
  SearchCheck,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Key,
  ShieldCheck,
  X,
} from 'lucide-react';

type SettingsTab = 'general' | 'theme' | 'admin_users' | 'seo';

export function AdminSettingsView() {
  const { navigate } = useRouter();
  const { theme, toggleTheme, setTheme } = useTheme();
  const [session, setSession] = useState<AdminSession | null>(null);
  const [loading, setLoading] = useState(true);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  // Settings State
  const [settings, setSettings] = useState<SiteSettingsData>(() => getSiteSettings());
  const [savedSettingsSnapshot, setSavedSettingsSnapshot] = useState<string>(() =>
    JSON.stringify(getSiteSettings())
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveBanner, setSaveBanner] = useState<{ show: boolean; message: string; isError?: boolean }>({
    show: false,
    message: '',
  });

  // Reset confirmation modal
  const [showResetModal, setShowResetModal] = useState(false);

  // Password update modal for current admin
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [savingPassword, setSavingPassword] = useState(false);

  // Check auth session
  useEffect(() => {
    async function verifyAuth() {
      const currentSession = await getActiveAdminSession();
      if (!currentSession) {
        navigate(getAdminLoginRoute());
        return;
      }
      setSession(currentSession);
      setLoading(false);
    }
    verifyAuth();
  }, [navigate]);

  const hasUnsavedChanges = JSON.stringify(settings) !== savedSettingsSnapshot;

  const handleSaveSettings = useCallback(() => {
    setIsSaving(true);
    try {
      const updated: SiteSettingsData = {
        ...settings,
        lastUpdated: new Date().toISOString(),
        updatedBy: session?.user.email || 'admin@onlinetools.internal',
      };
      saveSiteSettings(updated);
      setSettings(updated);
      setSavedSettingsSnapshot(JSON.stringify(updated));

      // If theme mode changed explicitly to light or dark, sync immediate UI
      if (updated.theme.defaultMode === 'light' || updated.theme.defaultMode === 'dark') {
        setTheme(updated.theme.defaultMode);
      }

      // Show toast
      setSaveBanner({
        show: true,
        message: 'Site configuration and design system settings saved successfully.',
        isError: false,
      });
      setTimeout(() => {
        setSaveBanner({ show: false, message: '' });
      }, 3500);
    } catch {
      setSaveBanner({
        show: true,
        message: 'Failed to save site settings.',
        isError: true,
      });
    } finally {
      setIsSaving(false);
    }
  }, [settings, session]);

  // Keyboard shortcut Ctrl+S / Cmd+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleSaveSettings();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSaveSettings]);

  const handleResetToDefaults = () => {
    const defaults = resetSiteSettings();
    setSettings(defaults);
    setSavedSettingsSnapshot(JSON.stringify(defaults));
    setShowResetModal(false);
    setSaveBanner({
      show: true,
      message: 'Restored factory default site configuration.',
      isError: false,
    });
    setTimeout(() => {
      setSaveBanner({ show: false, message: '' });
    }, 3500);
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordStatus(null);

    if (newPassword.length < 8) {
      setPasswordStatus({
        success: false,
        message: 'Password must be at least 8 characters long.',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordStatus({
        success: false,
        message: 'Passwords do not match.',
      });
      return;
    }

    setSavingPassword(true);
    try {
      const ok = await updateAdminPassword(newPassword);
      if (ok) {
        setPasswordStatus({
          success: true,
          message: 'Password updated successfully.',
        });
        setTimeout(() => {
          setShowPasswordModal(false);
          setNewPassword('');
          setConfirmPassword('');
          setPasswordStatus(null);
        }, 1500);
      } else {
        setPasswordStatus({
          success: false,
          message: 'Failed to update password.',
        });
      }
    } catch {
      setPasswordStatus({
        success: false,
        message: 'An error occurred during password update.',
      });
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF9FE] text-[#1E1035] flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-[#7C3AED] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-medium text-[#6D6582]">
            Verifying admin authorization...
          </p>
        </div>
      </div>
    );
  }

  const navTabs: { id: SettingsTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'general', label: 'General', icon: Globe },
    { id: 'theme', label: 'Theme & Branding', icon: Palette },
    { id: 'admin_users', label: 'Admin Accounts', icon: Users },
    { id: 'seo', label: 'SEO & Analytics', icon: SearchCheck },
  ];

  return (
    <div className="min-h-screen flex bg-[#FAF9FE] text-[#1E1035]">
      <SEOHelmet
        title="Site Settings & System Preferences | Admin Console"
        description="Configure site name, branding logos, theme accents, administrator accounts, robots.txt, and XML sitemaps."
      />

      {/* Admin Sidebar */}
      <AdminSidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        adminEmail={session?.user.email || 'admin'}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopNav
          pageTitle="Site Settings"
          adminTheme={theme}
          onToggleTheme={toggleTheme}
          onToggleSidebar={() => setSidebarOpen(true)}
          onOpenPasswordModal={() => setShowPasswordModal(true)}
          onLogout={() => {
            logoutAdmin();
            navigate(getAdminLoginRoute());
          }}
        />

        {/* Action Header & Tabs */}
        <header className="bg-[#FFFFFF] border-b border-[#EDE9FE] sticky top-14 z-20">
          <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] flex items-center justify-center">
                    <Settings className="w-4 h-4" />
                  </div>
                  <h1 className="text-lg sm:text-xl font-heading font-bold text-[#1E1035] tracking-tight">
                    Site Settings &amp; Preferences
                  </h1>
                </div>
                <p className="text-xs text-[#6D6582] mt-0.5">
                  Global branding, constrained theme system, zero-public-registration admin controls, and crawl directives.
                </p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
                {hasUnsavedChanges && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 border border-amber-300 text-[11px] font-semibold text-amber-800">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span>Unsaved Changes</span>
                  </div>
                )}

                <button
                  type="button"
                  id="reset-settings-defaults-btn"
                  onClick={() => setShowResetModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#EDE9FE] bg-[#FFFFFF] text-xs font-heading font-semibold text-[#6D6582] hover:text-[#1E1035] hover:bg-[#F5F3FF] transition-colors cursor-pointer shadow-2xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Reset Defaults</span>
                </button>

                <button
                  type="button"
                  id="save-site-settings-btn"
                  onClick={handleSaveSettings}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#7C3AED] text-white text-xs font-heading font-semibold hover:bg-[#6D28D9] transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                  title="Save configuration (Ctrl+S / Cmd+S)"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
                </button>
              </div>
            </div>

            {/* Navigation Tabs Bar */}
            <div className="flex items-center gap-1.5 mt-4 pt-2 border-t border-[#EDE9FE] overflow-x-auto scrollbar-none">
              {navTabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-heading font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-[#F5F3FF] text-[#7C3AED] border border-[#DDD6FE] shadow-2xs'
                        : 'text-[#6D6582] hover:text-[#1E1035] hover:bg-[#F5F3FF]'
                    }`}
                  >
                    <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#7C3AED]' : ''}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        {/* Main Content Body */}
        <main className="flex-1 w-full max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Notification Banner */}
          {saveBanner.show && (
            <div
              className={`mb-6 p-3.5 rounded-xl border text-xs flex items-center justify-between gap-3 animate-in fade-in ${
                saveBanner.isError
                  ? 'bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-300 dark:border-rose-800'
                  : 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {saveBanner.isError ? (
                  <AlertCircle className="w-4 h-4 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                )}
                <span className="font-semibold">{saveBanner.message}</span>
              </div>
              <button
                type="button"
                onClick={() => setSaveBanner({ show: false, message: '' })}
                className="hover:opacity-70"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Active Tab View */}
          {activeTab === 'general' && (
            <GeneralSettingsTab
              settings={settings.general}
              onChange={(updated) => setSettings({ ...settings, general: updated })}
            />
          )}

          {activeTab === 'theme' && (
            <ThemeSettingsTab
              settings={settings.theme}
              onChange={(updated) => setSettings({ ...settings, theme: updated })}
            />
          )}

          {activeTab === 'admin_users' && (
            <AdminUsersTab currentAdminEmail={session?.user.email || 'admin'} />
          )}

          {activeTab === 'seo' && (
            <SeoSettingsTab
              settings={settings.seo}
              onChange={(updated) => setSettings({ ...settings, seo: updated })}
            />
          )}
        </main>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div
          id="reset-settings-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-[#FFFFFF] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                Reset All Settings to Defaults?
              </h3>
            </div>

            <p className="text-xs text-[#64748B] dark:text-[#94A3B8] leading-relaxed">
              This will restore all general branding, theme palette, and crawler configurations to original factory presets. Registered administrator accounts will remain unaffected.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                className="px-3.5 py-1.5 rounded-lg text-xs text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetToDefaults}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 cursor-pointer shadow-xs"
              >
                Reset Configuration
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Change Password Modal (Current Admin) */}
      {showPasswordModal && (
        <div
          id="admin-settings-password-modal"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in"
        >
          <div className="bg-[#FFFFFF] dark:bg-[#0F172A] border border-[#E2E8F0] dark:border-[#1E293B] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E2E8F0] dark:border-[#1E293B] pb-3">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-[#2563EB]" />
                <h3 className="text-sm font-bold text-[#0F172A] dark:text-[#F8FAFC]">
                  Change Administrator Password
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="p-1 text-[#64748B] hover:text-[#0F172A] dark:hover:text-[#F8FAFC]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

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

            <form onSubmit={handlePasswordUpdate} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="block font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                  New Password (min 8 chars)
                </label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-[#0B0F17] border border-[#CBD5E1] dark:border-[#334155] text-[#0F172A] dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>

              <div className="space-y-1">
                <label className="block font-semibold text-[#0F172A] dark:text-[#F8FAFC]">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full p-2.5 rounded-lg bg-[#F8FAFC] dark:bg-[#0B0F17] border border-[#CBD5E1] dark:border-[#334155] text-[#0F172A] dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-3.5 py-2 rounded-lg text-xs text-[#64748B] dark:text-[#94A3B8] hover:bg-[#F1F5F9] dark:hover:bg-[#1E293B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#2563EB] text-white hover:bg-[#1D4ED8] disabled:opacity-50 cursor-pointer shadow-xs"
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
