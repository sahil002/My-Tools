import React from 'react';
import {
  ThemeSettings,
  ACCENT_COLOR_PALETTE,
  DesignSystemAccent,
} from '../../services/siteSettingsService';
import {
  Palette,
  Sun,
  Moon,
  Monitor,
  Check,
  Sparkles,
  Sliders,
  CheckCircle2,
} from 'lucide-react';

interface ThemeSettingsTabProps {
  settings: ThemeSettings;
  onChange: (updated: ThemeSettings) => void;
}

export function ThemeSettingsTab({ settings, onChange }: ThemeSettingsTabProps) {
  const handleModeChange = (mode: ThemeSettings['defaultMode']) => {
    onChange({
      ...settings,
      defaultMode: mode,
    });
  };

  const handleAccentChange = (accentId: string) => {
    onChange({
      ...settings,
      accentColorId: accentId,
    });
  };

  const handleSecondaryToneChange = (tone: ThemeSettings['secondaryTone']) => {
    onChange({
      ...settings,
      secondaryTone: tone,
    });
  };

  const handleDensityChange = (density: ThemeSettings['uiDensity']) => {
    onChange({
      ...settings,
      uiDensity: density,
    });
  };

  const currentAccent =
    ACCENT_COLOR_PALETTE.find((a) => a.id === settings.accentColorId) ||
    ACCENT_COLOR_PALETTE[0];

  return (
    <div className="space-y-6">
      {/* 1. Default Theme Mode */}
      <section className="bg-[#FFFFFF] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="border-b border-[#E4E8EF] dark:border-[#1B233A] pb-3">
          <h2 className="text-sm font-bold text-[#131A2B] dark:text-[#F4F6F9] flex items-center gap-2">
            <Sun className="w-4 h-4 text-[#2563EB]" />
            <span>Default Theme Appearance</span>
          </h2>
          <p className="text-xs text-[#5B6577] dark:text-[#9AA5B8] mt-0.5">
            Initial color scheme loaded when a visitor accesses the platform before personal local preferences.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Light Mode */}
          <button
            type="button"
            onClick={() => handleModeChange('light')}
            className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
              settings.defaultMode === 'light'
                ? 'border-[#2563EB] bg-blue-50/40 dark:bg-blue-950/20 ring-1 ring-[#2563EB]'
                : 'border-[#E4E8EF] dark:border-[#1B233A] bg-[#F4F6F9] dark:bg-[#131A2B] hover:border-[#E4E8EF]'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#FFFFFF] border border-[#E4E8EF] text-[#131A2B] flex items-center justify-center">
                <Sun className="w-4 h-4 text-amber-500" />
              </div>
              {settings.defaultMode === 'light' && (
                <div className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center">
                  <Check className="w-3 h-3" />
                </div>
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-[#131A2B] dark:text-[#F4F6F9]">
                Light Mode (Default)
              </p>
              <p className="text-[11px] text-[#5B6577] dark:text-[#9AA5B8] mt-0.5">
                High-contrast neutral white canvas with crisp typography.
              </p>
            </div>
          </button>

          {/* Dark Mode */}
          <button
            type="button"
            onClick={() => handleModeChange('dark')}
            className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
              settings.defaultMode === 'dark'
                ? 'border-[#2563EB] bg-blue-50/40 dark:bg-blue-950/20 ring-1 ring-[#2563EB]'
                : 'border-[#E4E8EF] dark:border-[#1B233A] bg-[#F4F6F9] dark:bg-[#131A2B] hover:border-[#E4E8EF]'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#131A2B] border border-[#1B233A] text-[#F4F6F9] flex items-center justify-center">
                <Moon className="w-4 h-4 text-blue-400" />
              </div>
              {settings.defaultMode === 'dark' && (
                <div className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center">
                  <Check className="w-3 h-3" />
                </div>
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-[#131A2B] dark:text-[#F4F6F9]">
                Dark Mode
              </p>
              <p className="text-[11px] text-[#5B6577] dark:text-[#9AA5B8] mt-0.5">
                Refined #131A2B deep obsidian palette with soft borders.
              </p>
            </div>
          </button>

          {/* System Preference */}
          <button
            type="button"
            onClick={() => handleModeChange('system')}
            className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
              settings.defaultMode === 'system'
                ? 'border-[#2563EB] bg-blue-50/40 dark:bg-blue-950/20 ring-1 ring-[#2563EB]'
                : 'border-[#E4E8EF] dark:border-[#1B233A] bg-[#F4F6F9] dark:bg-[#131A2B] hover:border-[#E4E8EF]'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-r from-white to-[#131A2B] border border-[#E4E8EF] text-[#2563EB] flex items-center justify-center">
                <Monitor className="w-4 h-4 text-[#2563EB]" />
              </div>
              {settings.defaultMode === 'system' && (
                <div className="w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center">
                  <Check className="w-3 h-3" />
                </div>
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-[#131A2B] dark:text-[#F4F6F9]">
                System Synchronized
              </p>
              <p className="text-[11px] text-[#5B6577] dark:text-[#9AA5B8] mt-0.5">
                Automatically matches the user operating system setting.
              </p>
            </div>
          </button>
        </div>
      </section>

      {/* 2. Constrained Accent Color Picker */}
      <section className="bg-[#FFFFFF] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] rounded-xl p-5 sm:p-6 shadow-2xs space-y-5">
        <div className="border-b border-[#E4E8EF] dark:border-[#1B233A] pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-sm font-bold text-[#131A2B] dark:text-[#F4F6F9] flex items-center gap-2">
              <Palette className="w-4 h-4 text-[#2563EB]" />
              <span>Primary Brand Accent Color</span>
            </h2>
            <p className="text-xs text-[#5B6577] dark:text-[#9AA5B8] mt-0.5">
              Strictly constrained to the design system palette to ensure WCAG AA readability and avoid visual clutter.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#F4F6F9] dark:bg-[#1B233A] text-[#131A2B] dark:text-[#F4F6F9]">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: currentAccent.hex }}
            />
            <span>{currentAccent.name} ({currentAccent.hex})</span>
          </div>
        </div>

        {/* Color Swatches Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ACCENT_COLOR_PALETTE.map((accent) => {
            const isSelected = accent.id === settings.accentColorId;
            return (
              <button
                key={accent.id}
                type="button"
                onClick={() => handleAccentChange(accent.id)}
                className={`p-3.5 rounded-xl border text-left flex items-start gap-3 transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#131A2B] dark:border-[#F4F6F9] bg-[#F4F6F9] dark:bg-[#131A2B] shadow-xs'
                    : 'border-[#E4E8EF] dark:border-[#1B233A] hover:border-[#E4E8EF] dark:hover:border-[#1B233A]'
                }`}
              >
                <div
                  className="w-8 h-8 rounded-lg shrink-0 flex items-center justify-center text-white shadow-xs"
                  style={{ backgroundColor: accent.hex }}
                >
                  {isSelected && <Check className="w-4 h-4 stroke-[3]" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-[#131A2B] dark:text-[#F4F6F9] truncate">
                      {accent.name}
                    </p>
                    <span className="text-[10px] font-mono text-[#5B6577] dark:text-[#9AA5B8]">
                      {accent.hex}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#5B6577] dark:text-[#9AA5B8] mt-0.5 truncate">
                    {accent.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Live Accent UI Component Preview */}
        <div className="mt-4 pt-4 border-t border-[#E4E8EF] dark:border-[#1B233A] space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#131A2B] dark:text-[#F4F6F9] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />
              <span>Interactive Design System Live Preview</span>
            </span>
            <span className="text-[10px] text-[#5B6577] dark:text-[#9AA5B8]">
              Simulates real interface components with {currentAccent.name}
            </span>
          </div>

          <div className="p-4 rounded-xl border border-[#E4E8EF] dark:border-[#1B233A] bg-[#FFFFFF] dark:bg-[#131A2B] grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            {/* Action Buttons */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase text-[#5B6577] dark:text-[#9AA5B8]">
                Interactive Buttons
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  style={{ backgroundColor: currentAccent.hex }}
                  className="px-3.5 py-1.5 rounded-lg text-white text-xs font-semibold shadow-xs cursor-pointer"
                >
                  Primary Action
                </button>
                <button
                  type="button"
                  style={{ color: currentAccent.hex, borderColor: currentAccent.hex }}
                  className="px-3 py-1.5 rounded-lg border text-xs font-semibold bg-transparent cursor-pointer"
                >
                  Outlined
                </button>
              </div>
            </div>

            {/* Badges & Status Pills */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase text-[#5B6577] dark:text-[#9AA5B8]">
                Status Badges & Tabs
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  style={{
                    backgroundColor: `${currentAccent.hex}15`,
                    color: currentAccent.hex,
                    borderColor: `${currentAccent.hex}40`,
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border"
                >
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Active Feature</span>
                </span>

                <span
                  style={{ backgroundColor: currentAccent.hex }}
                  className="px-2 py-0.5 rounded-full text-white text-[10px] font-bold"
                >
                  New Tool
                </span>
              </div>
            </div>

            {/* Focus Input */}
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase text-[#5B6577] dark:text-[#9AA5B8]">
                Form Input & Focus Ring
              </p>
              <input
                type="text"
                readOnly
                value="Standard input field focus"
                style={{ borderColor: currentAccent.hex }}
                className="w-full text-xs p-2 rounded-lg bg-[#F4F6F9] dark:bg-[#1B233A] border text-[#131A2B] dark:text-[#F4F6F9]"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Secondary Tone & UI Density */}
      <section className="bg-[#FFFFFF] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
        <div className="border-b border-[#E4E8EF] dark:border-[#1B233A] pb-3">
          <h2 className="text-sm font-bold text-[#131A2B] dark:text-[#F4F6F9] flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#2563EB]" />
            <span>Neutral Surface & UI Density</span>
          </h2>
          <p className="text-xs text-[#5B6577] dark:text-[#9AA5B8] mt-0.5">
            Secondary neutral balance and container padding scale across all tools.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Secondary Tone */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#131A2B] dark:text-[#F4F6F9]">
              Secondary Neutral Tone
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['slate', 'zinc', 'neutral'] as const).map((tone) => (
                <button
                  key={tone}
                  type="button"
                  onClick={() => handleSecondaryToneChange(tone)}
                  className={`p-2.5 rounded-lg border text-xs font-semibold capitalize cursor-pointer transition-all ${
                    settings.secondaryTone === tone
                      ? 'border-[#2563EB] bg-blue-50 text-[#2563EB] dark:bg-blue-950 dark:text-blue-300'
                      : 'border-[#E4E8EF] dark:border-[#1B233A] text-[#5B6577] dark:text-[#9AA5B8] hover:bg-[#F4F6F9] dark:hover:bg-[#1B233A]'
                  }`}
                >
                  {tone}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-[#5B6577] dark:text-[#9AA5B8]">
              Controls the cool or warm undertone of background cards and dividers.
            </p>
          </div>

          {/* Density */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-[#131A2B] dark:text-[#F4F6F9]">
              Component Padding & Density
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleDensityChange('comfortable')}
                className={`p-2.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                  settings.uiDensity === 'comfortable'
                    ? 'border-[#2563EB] bg-blue-50 text-[#2563EB] dark:bg-blue-950 dark:text-blue-300'
                    : 'border-[#E4E8EF] dark:border-[#1B233A] text-[#5B6577] dark:text-[#9AA5B8] hover:bg-[#F4F6F9] dark:hover:bg-[#1B233A]'
                }`}
              >
                Comfortable (Spacious)
              </button>
              <button
                type="button"
                onClick={() => handleDensityChange('compact')}
                className={`p-2.5 rounded-lg border text-xs font-semibold cursor-pointer transition-all ${
                  settings.uiDensity === 'compact'
                    ? 'border-[#2563EB] bg-blue-50 text-[#2563EB] dark:bg-blue-950 dark:text-blue-300'
                    : 'border-[#E4E8EF] dark:border-[#1B233A] text-[#5B6577] dark:text-[#9AA5B8] hover:bg-[#F4F6F9] dark:hover:bg-[#1B233A]'
                }`}
              >
                Compact (High Density)
              </button>
            </div>
            <p className="text-[11px] text-[#5B6577] dark:text-[#9AA5B8]">
              Comfortable provides 24px container padding; Compact scales down to 16px.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
