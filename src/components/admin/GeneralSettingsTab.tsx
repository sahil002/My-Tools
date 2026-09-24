import React, { useRef } from 'react';
import {
  GeneralSettings,
  SocialLink,
} from '../../services/siteSettingsService';
import {
  Globe,
  Upload,
  Image as ImageIcon,
  Trash2,
  Plus,
  ExternalLink,
  Info,
  Check,
  AlertCircle,
  Link as LinkIcon,
} from 'lucide-react';

interface GeneralSettingsTabProps {
  settings: GeneralSettings;
  onChange: (updated: GeneralSettings) => void;
}

export function GeneralSettingsTab({ settings, onChange }: GeneralSettingsTabProps) {
  const logoInputRef = useRef<HTMLInputElement>(null);
  const faviconInputRef = useRef<HTMLInputElement>(null);

  const handleFieldChange = <K extends keyof GeneralSettings>(
    field: K,
    value: GeneralSettings[K]
  ) => {
    onChange({
      ...settings,
      [field]: value,
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Logo image must be smaller than 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        handleFieldChange('logoUrl', reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFaviconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 512 * 1024) {
      alert('Favicon must be smaller than 512KB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        handleFieldChange('faviconUrl', reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSocialToggle = (id: string) => {
    const updated = settings.socialLinks.map((s) =>
      s.id === id ? { ...s, enabled: !s.enabled } : s
    );
    handleFieldChange('socialLinks', updated);
  };

  const handleSocialUrlChange = (id: string, url: string) => {
    const updated = settings.socialLinks.map((s) =>
      s.id === id ? { ...s, url } : s
    );
    handleFieldChange('socialLinks', updated);
  };

  const handleAddSocialLink = () => {
    const newId = `soc-custom-${Date.now()}`;
    const newLink: SocialLink = {
      id: newId,
      platform: 'custom',
      label: 'Custom Link',
      url: 'https://',
      enabled: true,
    };
    handleFieldChange('socialLinks', [...settings.socialLinks, newLink]);
  };

  const handleRemoveSocialLink = (id: string) => {
    const updated = settings.socialLinks.filter((s) => s.id !== id);
    handleFieldChange('socialLinks', updated);
  };

  const descLength = settings.defaultMetaDescription.length;

  return (
    <div className="space-y-6">
      {/* 1. Basic Site Identity */}
      <section className="bg-[#FFFFFF] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] rounded-xl p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="border-b border-[#E4E8EF] dark:border-[#1B233A] pb-3">
          <h2 className="text-sm font-bold text-[#131A2B] dark:text-[#F4F6F9] flex items-center gap-2">
            <Globe className="w-4 h-4 text-[#2563EB]" />
            <span>Site Identity & Branding</span>
          </h2>
          <p className="text-xs text-[#5B6577] dark:text-[#9AA5B8] mt-0.5">
            Configure your application's public brand name, global slogan, and contact emails.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Site Name */}
          <div className="space-y-1.5">
            <label
              htmlFor="settings-site-name"
              className="block text-xs font-semibold text-[#131A2B] dark:text-[#F4F6F9]"
            >
              Site Name
            </label>
            <input
              id="settings-site-name"
              type="text"
              value={settings.siteName}
              onChange={(e) => handleFieldChange('siteName', e.target.value)}
              placeholder="Online Tools"
              className="w-full text-xs p-2.5 rounded-lg bg-[#F4F6F9] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] text-[#131A2B] dark:text-[#F4F6F9] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
            />
            <p className="text-[11px] text-[#5B6577] dark:text-[#9AA5B8]">
              Appears in browser tabs, navigation bar, and structured schema markup.
            </p>
          </div>

          {/* Tagline / Subtitle */}
          <div className="space-y-1.5">
            <label
              htmlFor="settings-site-tagline"
              className="block text-xs font-semibold text-[#131A2B] dark:text-[#F4F6F9]"
            >
              Tagline / Mission Slogan
            </label>
            <input
              id="settings-site-tagline"
              type="text"
              value={settings.tagline}
              onChange={(e) => handleFieldChange('tagline', e.target.value)}
              placeholder="Fast, accurate online calculators and utilities"
              className="w-full text-xs p-2.5 rounded-lg bg-[#F4F6F9] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] text-[#131A2B] dark:text-[#F4F6F9] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
            />
            <p className="text-[11px] text-[#5B6577] dark:text-[#9AA5B8]">
              Displayed on hero banners and directory subheadings.
            </p>
          </div>

          {/* Contact Email */}
          <div className="space-y-1.5">
            <label
              htmlFor="settings-contact-email"
              className="block text-xs font-semibold text-[#131A2B] dark:text-[#F4F6F9]"
            >
              Official Contact Email
            </label>
            <input
              id="settings-contact-email"
              type="email"
              value={settings.contactEmail}
              onChange={(e) => handleFieldChange('contactEmail', e.target.value)}
              placeholder="contact@onlinetools.app"
              className="w-full text-xs p-2.5 rounded-lg bg-[#F4F6F9] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] text-[#131A2B] dark:text-[#F4F6F9] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
            />
          </div>

          {/* Copyright Text */}
          <div className="space-y-1.5">
            <label
              htmlFor="settings-copyright"
              className="block text-xs font-semibold text-[#131A2B] dark:text-[#F4F6F9]"
            >
              Footer Copyright Notice
            </label>
            <input
              id="settings-copyright"
              type="text"
              value={settings.copyrightText}
              onChange={(e) => handleFieldChange('copyrightText', e.target.value)}
              placeholder="© 2026 Online Tools. All rights reserved."
              className="w-full text-xs p-2.5 rounded-lg bg-[#F4F6F9] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] text-[#131A2B] dark:text-[#F4F6F9] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
            />
          </div>
        </div>
      </section>

      {/* 2. Logo & Favicon Upload */}
      <section className="bg-[#FFFFFF] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] rounded-xl p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="border-b border-[#E4E8EF] dark:border-[#1B233A] pb-3">
          <h2 className="text-sm font-bold text-[#131A2B] dark:text-[#F4F6F9] flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-[#2563EB]" />
            <span>Logo & Favicon Media</span>
          </h2>
          <p className="text-xs text-[#5B6577] dark:text-[#9AA5B8] mt-0.5">
            Upload custom vector or raster graphics for header navigation and browser tab favicons.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Logo Upload Box */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-[#131A2B] dark:text-[#F4F6F9]">
              Header Brand Logo
            </label>

            <div className="p-4 rounded-xl border border-dashed border-[#E4E8EF] dark:border-[#1B233A] bg-[#F4F6F9] dark:bg-[#131A2B] flex flex-col items-center justify-center text-center gap-3">
              {settings.logoUrl ? (
                <div className="relative group p-2 bg-[#FFFFFF] dark:bg-[#1B233A] rounded-lg border border-[#E4E8EF] dark:border-[#1B233A] max-w-full">
                  <img
                    src={settings.logoUrl}
                    alt={settings.logoAlt || 'Site Logo'}
                    loading="lazy"
                    className="max-h-16 max-w-full object-contain rounded"
                    referrerPolicy="no-referrer"
                  />
                  <button
                    type="button"
                    onClick={() => handleFieldChange('logoUrl', '')}
                    className="absolute -top-2 -right-2 p-1 rounded-full bg-rose-600 text-white shadow hover:bg-rose-700 transition-colors"
                    title="Remove custom logo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 py-2">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#2563EB] flex items-center justify-center font-bold text-sm">
                    OT
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-[#131A2B] dark:text-[#F4F6F9]">
                      Default Vector Logo
                    </p>
                    <p className="text-[11px] text-[#5B6577] dark:text-[#9AA5B8]">
                      No custom file uploaded. Using default typographical emblem.
                    </p>
                  </div>
                </div>
              )}

              <input
                type="file"
                ref={logoInputRef}
                onChange={handleLogoUpload}
                accept="image/png,image/svg+xml,image/jpeg,image/webp"
                className="hidden"
                id="site-logo-file-input"
              />

              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E4E8EF] dark:border-[#1B233A] bg-[#FFFFFF] dark:bg-[#1B233A] text-xs font-semibold text-[#131A2B] dark:text-[#F4F6F9] hover:bg-[#F4F6F9] dark:hover:bg-[#1B233A] cursor-pointer transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Upload Logo File</span>
                </button>

                {settings.logoUrl && (
                  <button
                    type="button"
                    onClick={() => handleFieldChange('logoUrl', '')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#DC2626]/30 dark:border-rose-950 text-xs font-medium text-[#DC2626] dark:text-[#DC2626] hover:bg-[#FEF2F2] dark:hover:bg-rose-950/30 cursor-pointer"
                  >
                    Reset to Default
                  </button>
                )}
              </div>

              <p className="text-[10px] text-[#5B6577] dark:text-[#9AA5B8]">
                Recommended format: SVG or transparent PNG (max 2MB, height ~40px).
              </p>
            </div>

            {/* Logo Alt Text */}
            <div className="space-y-1">
              <label
                htmlFor="settings-logo-alt"
                className="text-[11px] font-medium text-[#5B6577] dark:text-[#9AA5B8]"
              >
                Logo Image Accessibility Alt Text
              </label>
              <input
                id="settings-logo-alt"
                type="text"
                value={settings.logoAlt}
                onChange={(e) => handleFieldChange('logoAlt', e.target.value)}
                placeholder="Online Tools Brand Logo"
                className="w-full text-xs p-2 rounded-lg bg-[#F4F6F9] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] text-[#131A2B] dark:text-[#F4F6F9]"
              />
            </div>
          </div>

          {/* Favicon Upload Box */}
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-[#131A2B] dark:text-[#F4F6F9]">
              Browser Tab Favicon (.ico / .png / .svg)
            </label>

            <div className="p-4 rounded-xl border border-dashed border-[#E4E8EF] dark:border-[#1B233A] bg-[#F4F6F9] dark:bg-[#131A2B] flex flex-col items-center justify-center text-center gap-3">
              <div className="flex items-center gap-3 py-2">
                <div className="w-10 h-10 rounded-lg bg-[#FFFFFF] dark:bg-[#1B233A] border border-[#E4E8EF] dark:border-[#1B233A] flex items-center justify-center shadow-xs">
                  {settings.faviconUrl && settings.faviconUrl.startsWith('data:') ? (
                    <img
                      src={settings.faviconUrl}
                      alt="Favicon preview"
                      loading="lazy"
                      className="w-6 h-6 object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-6 h-6 rounded bg-[#2563EB] text-white flex items-center justify-center text-[10px] font-bold">
                      OT
                    </div>
                  )}
                </div>
                <div className="text-left">
                  <p className="text-xs font-semibold text-[#131A2B] dark:text-[#F4F6F9]">
                    {settings.faviconUrl.startsWith('data:') ? 'Custom Favicon Active' : 'Default System Favicon'}
                  </p>
                  <p className="text-[11px] text-[#5B6577] dark:text-[#9AA5B8]">
                    Rendered in browser tab, bookmarks, and mobile home screen shortcuts.
                  </p>
                </div>
              </div>

              <input
                type="file"
                ref={faviconInputRef}
                onChange={handleFaviconUpload}
                accept="image/x-icon,image/png,image/svg+xml"
                className="hidden"
                id="site-favicon-file-input"
              />

              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => faviconInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E4E8EF] dark:border-[#1B233A] bg-[#FFFFFF] dark:bg-[#1B233A] text-xs font-semibold text-[#131A2B] dark:text-[#F4F6F9] hover:bg-[#F4F6F9] dark:hover:bg-[#1B233A] cursor-pointer transition-colors"
                >
                  <Upload className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Upload Favicon</span>
                </button>

                {settings.faviconUrl.startsWith('data:') && (
                  <button
                    type="button"
                    onClick={() => handleFieldChange('faviconUrl', '/favicon.ico')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#DC2626]/30 dark:border-rose-950 text-xs font-medium text-[#DC2626] dark:text-[#DC2626] hover:bg-[#FEF2F2] dark:hover:bg-rose-950/30 cursor-pointer"
                  >
                    Restore Default
                  </button>
                )}
              </div>

              <p className="text-[10px] text-[#5B6577] dark:text-[#9AA5B8]">
                Recommended dimensions: 32x32px or 64x64px square (PNG, SVG, or ICO).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Default Meta Description */}
      <section className="bg-[#FFFFFF] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="border-b border-[#E4E8EF] dark:border-[#1B233A] pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#131A2B] dark:text-[#F4F6F9]">
              Default Global Meta Description
            </h2>
            <p className="text-xs text-[#5B6577] dark:text-[#9AA5B8] mt-0.5">
              Fallback meta description served to search engine crawlers when a specific tool or guide lacks custom metadata.
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <span
              className={`text-[11px] font-mono font-bold ${
                descLength >= 120 && descLength <= 160
                  ? 'text-[#16A34A] dark:text-[#16A34A]'
                  : 'text-[#F59E0B] dark:text-[#F59E0B]'
              }`}
            >
              {descLength} / 160 chars
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <textarea
            id="settings-meta-description"
            rows={3}
            value={settings.defaultMetaDescription}
            onChange={(e) => handleFieldChange('defaultMetaDescription', e.target.value)}
            placeholder="Enter a compelling 120-160 character summary of your entire web tools platform..."
            className="w-full text-xs p-3 rounded-lg bg-[#F4F6F9] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] text-[#131A2B] dark:text-[#F4F6F9] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
          />
          <div className="w-full h-1.5 bg-[#E4E8EF] dark:bg-[#1B233A] rounded-full overflow-hidden">
            <div
              className={`h-full ${
                descLength >= 120 && descLength <= 160
                  ? 'bg-[#16A34A]'
                  : descLength > 160
                  ? 'bg-rose-500'
                  : 'bg-[#F59E0B]'
              }`}
              style={{ width: `${Math.min(100, (descLength / 160) * 100)}%` }}
            />
          </div>
          <p className="text-[11px] text-[#5B6577] dark:text-[#9AA5B8]">
            Optimal search snippet length is between 120 and 160 characters to prevent SERP truncation on mobile.
          </p>
        </div>
      </section>

      {/* 4. Social Links */}
      <section className="bg-[#FFFFFF] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="border-b border-[#E4E8EF] dark:border-[#1B233A] pb-3 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-[#131A2B] dark:text-[#F4F6F9] flex items-center gap-2">
              <LinkIcon className="w-4 h-4 text-[#2563EB]" />
              <span>Social Profiles & Community Links</span>
            </h2>
            <p className="text-xs text-[#5B6577] dark:text-[#9AA5B8] mt-0.5">
              Public channel links rendered in footer navigation, about pages, and OpenGraph publisher metadata.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddSocialLink}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E4E8EF] dark:border-[#1B233A] text-xs font-semibold text-[#131A2B] dark:text-[#F4F6F9] hover:bg-[#F4F6F9] dark:hover:bg-[#1B233A] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#2563EB]" />
            <span>Add Link</span>
          </button>
        </div>

        <div className="space-y-3">
          {settings.socialLinks.map((link) => (
            <div
              key={link.id}
              className="p-3.5 rounded-xl border border-[#E4E8EF] dark:border-[#1B233A] bg-[#F4F6F9] dark:bg-[#131A2B] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id={`toggle-${link.id}`}
                  checked={link.enabled}
                  onChange={() => handleSocialToggle(link.id)}
                  className="w-4 h-4 text-[#2563EB] rounded border-gray-300 focus:ring-[#2563EB] cursor-pointer"
                />
                <div>
                  <label
                    htmlFor={`toggle-${link.id}`}
                    className="text-xs font-semibold text-[#131A2B] dark:text-[#F4F6F9] cursor-pointer"
                  >
                    {link.label}
                  </label>
                  <p className="text-[10px] text-[#5B6577] dark:text-[#9AA5B8] capitalize">
                    {link.platform} channel
                  </p>
                </div>
              </div>

              <div className="flex-1 max-w-md flex items-center gap-2">
                <input
                  type="url"
                  value={link.url}
                  onChange={(e) => handleSocialUrlChange(link.id, e.target.value)}
                  disabled={!link.enabled}
                  placeholder="https://..."
                  className="w-full text-xs font-mono p-2 rounded-lg bg-[#FFFFFF] dark:bg-[#1B233A] border border-[#E4E8EF] dark:border-[#1B233A] text-[#131A2B] dark:text-[#F4F6F9] disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveSocialLink(link.id)}
                  className="p-2 rounded-lg text-[#5B6577] hover:text-[#DC2626] hover:bg-[#FEF2F2] dark:hover:bg-rose-950/40 transition-colors"
                  title="Remove link"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
