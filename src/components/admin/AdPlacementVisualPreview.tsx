import React from 'react';
import {
  PageTypeAdConfig,
  AdPlacementConfig,
  GlobalAdSettings,
} from '../../services/adManagerService';
import { Eye, CheckCircle2, XCircle, Megaphone, Info } from 'lucide-react';

interface AdPlacementVisualPreviewProps {
  pageConfig: PageTypeAdConfig;
  globalEnabled: boolean;
  selectedPlacementId: string | null;
  onSelectPlacement: (placementId: string) => void;
  onTogglePlacement: (placementId: string, enabled: boolean) => void;
}

export function AdPlacementVisualPreview({
  pageConfig,
  globalEnabled,
  selectedPlacementId,
  onSelectPlacement,
  onTogglePlacement,
}: AdPlacementVisualPreviewProps) {
  const isPageEnabled = pageConfig.enabled;
  const isOperational = globalEnabled && isPageEnabled;

  // Helper to find a placement config by position
  const getPlacement = (position: string) => {
    return pageConfig.placements.find((p) => p.position === position);
  };

  const renderSlot = (position: string, labelFallback: string) => {
    const placement = getPlacement(position);
    if (!placement) return null;

    const isSelected = selectedPlacementId === placement.id;
    const isSlotActive = isOperational && placement.enabled;

    return (
      <div
        key={placement.id}
        onClick={() => onSelectPlacement(placement.id)}
        className={`group relative rounded-lg p-2.5 transition-all cursor-pointer select-none ${
          isSelected
            ? 'ring-2 ring-[#2563EB] ring-offset-2 dark:ring-offset-[#131A2B]'
            : 'hover:border-[#2563EB] dark:hover:border-[#2563EB]'
        } ${
          isSlotActive
            ? 'bg-blue-50/70 dark:bg-blue-950/30 border border-[#2563EB]/40 dark:border-[#2563EB]/40 text-[#131A2B] dark:text-[#F4F6F9]'
            : 'bg-[#F4F6F9]/70 dark:bg-[#1B233A]/40 border border-dashed border-[#E4E8EF] dark:border-[#1B233A] text-[#9AA5B8] dark:text-[#5B6577]'
        }`}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                isSlotActive ? 'bg-[#2563EB] animate-pulse' : 'bg-[#9AA5B8]'
              }`}
            />
            <span className="text-[11px] font-bold truncate">
              {placement.name}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#FFFFFF] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] text-[#5B6577] dark:text-[#9AA5B8] uppercase">
              {placement.format.replace('_', ' ')}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onTogglePlacement(placement.id, !placement.enabled);
              }}
              title={placement.enabled ? 'Click to disable' : 'Click to enable'}
              className={`text-[10px] font-semibold px-1.5 py-0.5 rounded transition-colors ${
                placement.enabled
                  ? 'bg-[#E9F8EF] text-[#16A34A] dark:bg-[#1B233A] dark:text-[#16A34A]'
                  : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
              }`}
            >
              {placement.enabled ? 'ON' : 'OFF'}
            </button>
          </div>
        </div>

        <div className="mt-1 flex items-center justify-between text-[10px] text-[#5B6577] dark:text-[#9AA5B8]">
          <span className="truncate">Unit: {placement.adUnitCode || 'Not Set'}</span>
          <span className="text-[9px] underline opacity-0 group-hover:opacity-100 transition-opacity">
            Edit Code →
          </span>
        </div>
      </div>
    );
  };

  return (
    <div
      id="visual-placement-preview-panel"
      className="bg-[#FFFFFF] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] rounded-xl p-5 shadow-2xs space-y-4"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E4E8EF] dark:border-[#1B233A]">
        <div>
          <div className="flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#2563EB]" />
            <h3 className="text-sm font-bold text-[#131A2B] dark:text-[#F4F6F9]">
              Visual Placement Preview — {pageConfig.name}
            </h3>
          </div>
          <p className="text-xs text-[#5B6577] dark:text-[#9AA5B8] mt-0.5">
            Click any ad position in the wireframe below to inspect its slot code
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[#5B6577] dark:text-[#9AA5B8]">Status:</span>
          {isOperational ? (
            <span className="inline-flex items-center gap-1 font-semibold text-[#16A34A] dark:text-[#16A34A] text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Active on Live Site
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 font-semibold text-[#F59E0B] dark:text-[#F59E0B] text-[11px]">
              <XCircle className="w-3.5 h-3.5" />
              {!globalEnabled ? 'Global Switch OFF' : 'Page Switch OFF'}
            </span>
          )}
        </div>
      </div>

      {/* Warning banner if muted */}
      {!isOperational && (
        <div className="p-3 rounded-lg bg-[#FFFBEB] dark:bg-[#1B233A] border border-[#F59E0B]/30 dark:border-amber-800 text-[#F59E0B] dark:text-amber-200 text-xs flex items-center gap-2">
          <Info className="w-4 h-4 shrink-0 text-[#F59E0B] dark:text-[#F59E0B]" />
          <span>
            {!globalEnabled
              ? 'Site-wide master switch is OFF. All ads are currently hidden across the website.'
              : `Ads on the ${pageConfig.name} are currently disabled.`}
          </span>
        </div>
      )}

      {/* Miniature Architectural Wireframe Container */}
      <div className="bg-[#F4F6F9] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] rounded-xl p-4 sm:p-5 max-w-xl mx-auto space-y-3 font-sans">
        {/* Mockup Header Bar */}
        <div className="bg-[#FFFFFF] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] rounded-md p-2 flex items-center justify-between text-[10px] text-[#9AA5B8]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#2563EB]" />
            <span className="font-bold text-[#131A2B] dark:text-[#F4F6F9]">Online Tools</span>
          </div>
          <div className="flex items-center gap-2 font-mono">
            <span className="w-8 h-1.5 rounded-full bg-[#E4E8EF] dark:bg-[#1B233A]" />
            <span className="w-10 h-1.5 rounded-full bg-[#E4E8EF] dark:bg-[#1B233A]" />
            <span className="w-6 h-1.5 rounded-full bg-[#E4E8EF] dark:bg-[#1B233A]" />
          </div>
        </div>

        {/* 1. HOMEPAGE WIREFRAME */}
        {pageConfig.id === 'homepage' && (
          <div className="space-y-3">
            {/* Hero Mockup */}
            <div className="bg-[#FFFFFF] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] rounded-md p-4 text-center space-y-1.5">
              <div className="w-44 h-3 rounded bg-[#131A2B] dark:bg-[#F4F6F9] mx-auto" />
              <div className="w-64 h-2 rounded bg-[#E4E8EF] dark:bg-[#1B233A] mx-auto" />
              <div className="w-52 h-6 rounded-lg border border-[#E4E8EF] dark:border-[#1B233A] bg-[#F4F6F9] dark:bg-[#131A2B] mx-auto mt-2" />
            </div>

            {/* Ad Slot: Below Hero */}
            {renderSlot('below_hero', 'Below Hero')}

            {/* Featured Tools Grid Mockup */}
            <div className="bg-[#FFFFFF] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] rounded-md p-3 space-y-2">
              <div className="w-28 h-2.5 rounded bg-[#9AA5B8]" />
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="h-14 rounded border border-[#E4E8EF] dark:border-[#1B233A] bg-[#F4F6F9] dark:bg-[#131A2B] p-2 space-y-1"
                  >
                    <div className="w-4 h-4 rounded bg-[#E4E8EF] dark:bg-[#1B233A]" />
                    <div className="w-10 h-1.5 rounded bg-[#9AA5B8]" />
                  </div>
                ))}
              </div>
            </div>

            {/* Ad Slot: Between Sections */}
            {renderSlot('between_sections', 'Between Sections')}

            {/* Categories Explorer Mockup */}
            <div className="bg-[#FFFFFF] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] rounded-md p-3 space-y-2">
              <div className="w-32 h-2.5 rounded bg-[#9AA5B8]" />
              <div className="grid grid-cols-2 gap-2">
                <div className="h-10 rounded border border-[#E4E8EF] dark:border-[#1B233A] bg-[#F4F6F9] dark:bg-[#131A2B]" />
                <div className="h-10 rounded border border-[#E4E8EF] dark:border-[#1B233A] bg-[#F4F6F9] dark:bg-[#131A2B]" />
              </div>
            </div>

            {/* Ad Slot: Before Footer */}
            {renderSlot('before_footer', 'Before Footer')}
          </div>
        )}

        {/* 2. TOOL PAGE WIREFRAME */}
        {pageConfig.id === 'tool_page' && (
          <div className="space-y-3">
            {/* Tool Header Mockup */}
            <div className="bg-[#FFFFFF] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] rounded-md p-3 space-y-1">
              <div className="w-32 h-3 rounded bg-[#131A2B] dark:bg-[#F4F6F9]" />
              <div className="w-48 h-2 rounded bg-[#9AA5B8]" />
            </div>

            {/* Tool Interactive Calculator & Sidebar Split */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-3">
                {/* Calculator Body */}
                <div className="bg-[#FFFFFF] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] rounded-md p-3 space-y-2">
                  <div className="w-full h-8 rounded border border-[#E4E8EF] dark:border-[#1B233A] bg-[#F4F6F9] dark:bg-[#131A2B]" />
                  <div className="w-full h-10 rounded bg-[#2563EB]/20 border border-[#2563EB]/40 flex items-center justify-center text-[10px] text-[#2563EB] font-bold">
                    Interactive Result
                  </div>
                </div>

                {/* Ad Slot: Below Tool Interface */}
                {renderSlot('below_tool', 'Below Tool Interface')}
              </div>

              {/* Sidebar Column */}
              <div className="space-y-3">
                {renderSlot('sidebar', 'Sidebar')}
                <div className="bg-[#FFFFFF] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] rounded-md p-2 space-y-1.5 text-[9px] text-[#9AA5B8]">
                  <div className="font-semibold text-[#131A2B] dark:text-[#F4F6F9]">Quick Info</div>
                  <div className="w-full h-1.5 rounded bg-[#E4E8EF] dark:bg-[#1B233A]" />
                  <div className="w-3/4 h-1.5 rounded bg-[#E4E8EF] dark:bg-[#1B233A]" />
                </div>
              </div>
            </div>

            {/* Formula / Content Section Mockup */}
            <div className="bg-[#FFFFFF] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] rounded-md p-3 space-y-1.5">
              <div className="w-36 h-2.5 rounded bg-[#9AA5B8]" />
              <div className="w-full h-2 rounded bg-[#E4E8EF] dark:bg-[#1B233A]" />
              <div className="w-5/6 h-2 rounded bg-[#E4E8EF] dark:bg-[#1B233A]" />
            </div>

            {/* Ad Slot: Between Sections */}
            {renderSlot('between_sections', 'Between Sections')}

            {/* FAQ Mockup */}
            <div className="bg-[#FFFFFF] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] rounded-md p-3 space-y-2">
              <div className="w-24 h-2.5 rounded bg-[#9AA5B8]" />
              <div className="w-full h-6 rounded border border-[#E4E8EF] dark:border-[#1B233A]" />
              <div className="w-full h-6 rounded border border-[#E4E8EF] dark:border-[#1B233A]" />
            </div>

            {/* Ad Slot: Before Footer */}
            {renderSlot('before_footer', 'Before Footer')}
          </div>
        )}

        {/* 3. CATEGORY PAGE WIREFRAME */}
        {pageConfig.id === 'category_page' && (
          <div className="space-y-3">
            {/* Category Header */}
            <div className="bg-[#FFFFFF] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] rounded-md p-3 space-y-1.5">
              <div className="w-36 h-3 rounded bg-[#131A2B] dark:bg-[#F4F6F9]" />
              <div className="w-56 h-2 rounded bg-[#9AA5B8]" />
              <div className="flex gap-1.5 pt-1">
                <div className="w-12 h-4 rounded-full bg-[#E4E8EF] dark:bg-[#1B233A]" />
                <div className="w-12 h-4 rounded-full bg-[#E4E8EF] dark:bg-[#1B233A]" />
              </div>
            </div>

            {/* Ad Slot: Below Hero */}
            {renderSlot('below_hero', 'Below Hero')}

            {/* Category Tools Grid with In-Feed Slot */}
            <div className="grid grid-cols-2 gap-2">
              <div className="h-16 rounded border border-[#E4E8EF] dark:border-[#1B233A] bg-[#FFFFFF] dark:bg-[#131A2B] p-2 space-y-1">
                <div className="w-16 h-2 rounded bg-[#9AA5B8]" />
                <div className="w-full h-1.5 rounded bg-[#E4E8EF] dark:bg-[#1B233A]" />
              </div>
              <div className="h-16 rounded border border-[#E4E8EF] dark:border-[#1B233A] bg-[#FFFFFF] dark:bg-[#131A2B] p-2 space-y-1">
                <div className="w-16 h-2 rounded bg-[#9AA5B8]" />
                <div className="w-full h-1.5 rounded bg-[#E4E8EF] dark:bg-[#1B233A]" />
              </div>
            </div>

            {/* Ad Slot: In-Feed */}
            {renderSlot('in_feed', 'In-Feed Grid Card')}

            <div className="grid grid-cols-2 gap-2">
              <div className="h-16 rounded border border-[#E4E8EF] dark:border-[#1B233A] bg-[#FFFFFF] dark:bg-[#131A2B] p-2 space-y-1">
                <div className="w-16 h-2 rounded bg-[#9AA5B8]" />
                <div className="w-full h-1.5 rounded bg-[#E4E8EF] dark:bg-[#1B233A]" />
              </div>
              <div className="h-16 rounded border border-[#E4E8EF] dark:border-[#1B233A] bg-[#FFFFFF] dark:bg-[#131A2B] p-2 space-y-1">
                <div className="w-16 h-2 rounded bg-[#9AA5B8]" />
                <div className="w-full h-1.5 rounded bg-[#E4E8EF] dark:bg-[#1B233A]" />
              </div>
            </div>

            {/* Ad Slot: Before Footer */}
            {renderSlot('before_footer', 'Before Footer')}
          </div>
        )}

        {/* 4. BLOG POST WIREFRAME */}
        {pageConfig.id === 'blog_post' && (
          <div className="space-y-3">
            {/* Article Header */}
            <div className="bg-[#FFFFFF] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] rounded-md p-3 space-y-1.5">
              <div className="w-48 h-3 rounded bg-[#131A2B] dark:bg-[#F4F6F9]" />
              <div className="w-24 h-2 rounded bg-[#9AA5B8]" />
            </div>

            {/* Ad Slot: Below Article Header */}
            {renderSlot('below_hero', 'Below Article Header')}

            {/* Content & Sidebar Layout */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2 space-y-3">
                {/* Paragraph 1 */}
                <div className="bg-[#FFFFFF] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] rounded-md p-3 space-y-1.5">
                  <div className="w-full h-2 rounded bg-[#E4E8EF] dark:bg-[#1B233A]" />
                  <div className="w-full h-2 rounded bg-[#E4E8EF] dark:bg-[#1B233A]" />
                  <div className="w-3/4 h-2 rounded bg-[#E4E8EF] dark:bg-[#1B233A]" />
                </div>

                {/* Ad Slot: In-Content */}
                {renderSlot('in_content', 'In-Content (Editorial Break)')}

                {/* Paragraph 2 */}
                <div className="bg-[#FFFFFF] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] rounded-md p-3 space-y-1.5">
                  <div className="w-full h-2 rounded bg-[#E4E8EF] dark:bg-[#1B233A]" />
                  <div className="w-4/5 h-2 rounded bg-[#E4E8EF] dark:bg-[#1B233A]" />
                </div>
              </div>

              {/* Sidebar Rail */}
              <div className="space-y-3">
                {renderSlot('sidebar', 'Sticky Sidebar')}
              </div>
            </div>

            {/* Ad Slot: Before Footer */}
            {renderSlot('before_footer', 'Before Footer')}
          </div>
        )}

        {/* 5. BLOG LISTING WIREFRAME */}
        {pageConfig.id === 'blog_listing' && (
          <div className="space-y-3">
            {/* Directory Header */}
            <div className="bg-[#FFFFFF] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] rounded-md p-3 space-y-1.5">
              <div className="w-36 h-3 rounded bg-[#131A2B] dark:bg-[#F4F6F9]" />
              <div className="w-48 h-2 rounded bg-[#9AA5B8]" />
            </div>

            {/* Ad Slot: Below Hero */}
            {renderSlot('below_hero', 'Below Hero')}

            {/* Guides Grid with In-Feed Slot */}
            <div className="grid grid-cols-2 gap-2">
              <div className="h-16 rounded border border-[#E4E8EF] dark:border-[#1B233A] bg-[#FFFFFF] dark:bg-[#131A2B] p-2 space-y-1">
                <div className="w-20 h-2 rounded bg-[#9AA5B8]" />
                <div className="w-full h-1.5 rounded bg-[#E4E8EF] dark:bg-[#1B233A]" />
              </div>
              <div className="h-16 rounded border border-[#E4E8EF] dark:border-[#1B233A] bg-[#FFFFFF] dark:bg-[#131A2B] p-2 space-y-1">
                <div className="w-20 h-2 rounded bg-[#9AA5B8]" />
                <div className="w-full h-1.5 rounded bg-[#E4E8EF] dark:bg-[#1B233A]" />
              </div>
            </div>

            {/* Ad Slot: In-Feed */}
            {renderSlot('in_feed', 'In-Feed Sponsored Tile')}

            <div className="grid grid-cols-2 gap-2">
              <div className="h-16 rounded border border-[#E4E8EF] dark:border-[#1B233A] bg-[#FFFFFF] dark:bg-[#131A2B] p-2 space-y-1">
                <div className="w-20 h-2 rounded bg-[#9AA5B8]" />
                <div className="w-full h-1.5 rounded bg-[#E4E8EF] dark:bg-[#1B233A]" />
              </div>
              <div className="h-16 rounded border border-[#E4E8EF] dark:border-[#1B233A] bg-[#FFFFFF] dark:bg-[#131A2B] p-2 space-y-1">
                <div className="w-20 h-2 rounded bg-[#9AA5B8]" />
                <div className="w-full h-1.5 rounded bg-[#E4E8EF] dark:bg-[#1B233A]" />
              </div>
            </div>

            {/* Ad Slot: Before Footer */}
            {renderSlot('before_footer', 'Before Footer')}
          </div>
        )}

        {/* Mockup Footer Bar */}
        <div className="bg-[#FFFFFF] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] rounded-md p-2 flex items-center justify-between text-[9px] text-[#9AA5B8]">
          <span className="font-mono">© Online Tools</span>
          <div className="flex gap-2">
            <span className="w-8 h-1 rounded bg-[#E4E8EF] dark:bg-[#1B233A]" />
            <span className="w-8 h-1 rounded bg-[#E4E8EF] dark:bg-[#1B233A]" />
          </div>
        </div>
      </div>
    </div>
  );
}
