import React from 'react';
import {
  AdPlacementConfig,
  AdFormat,
  PageTypeAdConfig,
} from '../../services/adManagerService';
import {
  Code,
  CheckCircle,
  Sliders,
  ExternalLink,
  Copy,
  Check,
  HelpCircle,
  Sparkles,
} from 'lucide-react';

interface AdPlacementEditorProps {
  pageConfig: PageTypeAdConfig;
  selectedPlacementId: string | null;
  onSelectPlacement: (placementId: string) => void;
  onUpdatePlacement: (placementId: string, updates: Partial<AdPlacementConfig>) => void;
}

export function AdPlacementEditor({
  pageConfig,
  selectedPlacementId,
  onSelectPlacement,
  onUpdatePlacement,
}: AdPlacementEditorProps) {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const handleCopyCode = (id: string, code: string) => {
    if (!code) return;
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div
      id="placement-control-editor-card"
      className="bg-[#FFFFFF] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] rounded-xl p-5 shadow-2xs space-y-4"
    >
      <div>
        <h3 className="text-sm font-bold text-[#131A2B] dark:text-[#F4F6F9] flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#2563EB]" />
          <span>Placement Slots & Ad Unit Codes</span>
        </h3>
        <p className="text-xs text-[#5B6577] dark:text-[#9AA5B8] mt-0.5">
          Configure Google AdSense slot IDs and display formats for {pageConfig.name}
        </p>
      </div>

      <div className="space-y-3.5">
        {pageConfig.placements.map((placement) => {
          const isSelected = selectedPlacementId === placement.id;

          return (
            <div
              key={placement.id}
              onClick={() => onSelectPlacement(placement.id)}
              className={`rounded-xl border p-4 transition-all ${
                isSelected
                  ? 'border-[#2563EB] bg-blue-50/20 dark:bg-blue-950/10 shadow-xs ring-1 ring-[#2563EB]'
                  : 'border-[#E4E8EF] dark:border-[#1B233A] bg-[#FFFFFF] dark:bg-[#131A2B] hover:border-[#E4E8EF] dark:hover:border-[#1B233A]'
              }`}
            >
              {/* Header: Title, Position, and On/Off Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#E4E8EF] dark:border-[#1B233A]">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#2563EB]" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-[#131A2B] dark:text-[#F4F6F9]">
                        {placement.name}
                      </h4>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#F4F6F9] dark:bg-[#1B233A] text-[#5B6577] dark:text-[#9AA5B8]">
                        {placement.position}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#5B6577] dark:text-[#9AA5B8] mt-0.5">
                      {placement.description}
                    </p>
                  </div>
                </div>

                {/* Individual Placement Toggle Switch */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <span className="text-xs font-medium text-[#5B6577] dark:text-[#9AA5B8]">
                    {placement.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={placement.enabled}
                      onChange={(e) =>
                        onUpdatePlacement(placement.id, { enabled: e.target.checked })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-[#E4E8EF] dark:bg-[#1B233A] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#2563EB]" />
                  </label>
                </div>
              </div>

              {/* Form Controls: Ad Unit Code & Format */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-3 text-xs">
                {/* Ad Code / Unit ID Input */}
                <div className="sm:col-span-8 space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-semibold text-[#131A2B] dark:text-[#F4F6F9] flex items-center gap-1.5">
                      <Code className="w-3.5 h-3.5 text-[#2563EB]" />
                      <span>Ad Unit Code / Slot ID</span>
                    </label>
                    {placement.adUnitCode && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyCode(placement.id, placement.adUnitCode);
                        }}
                        className="text-[10px] text-[#5B6577] dark:text-[#9AA5B8] hover:text-[#131A2B] dark:hover:text-[#F4F6F9] inline-flex items-center gap-1 cursor-pointer"
                      >
                        {copiedId === placement.id ? (
                          <>
                            <Check className="w-3 h-3 text-[#16A34A]" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={placement.adUnitCode}
                    onChange={(e) =>
                      onUpdatePlacement(placement.id, { adUnitCode: e.target.value })
                    }
                    placeholder="e.g. 1029384756 or data-ad-slot snippet"
                    className="w-full text-xs font-mono p-2 rounded-lg bg-[#F4F6F9] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] text-[#131A2B] dark:text-[#F4F6F9] placeholder-[#9AA5B8] focus:outline-none focus:ring-1 focus:ring-[#2563EB]"
                  />
                  <div className="text-[10px] text-[#5B6577] dark:text-[#9AA5B8]">
                    Google AdSense `data-ad-slot` numeric ID or Google Ad Manager unit string
                  </div>
                </div>

                {/* Ad Format Selector */}
                <div className="sm:col-span-4 space-y-1">
                  <label className="font-semibold text-[#131A2B] dark:text-[#F4F6F9] block">
                    Display Format
                  </label>
                  <select
                    value={placement.format}
                    onChange={(e) =>
                      onUpdatePlacement(placement.id, {
                        format: e.target.value as AdFormat,
                      })
                    }
                    className="w-full text-xs p-2 rounded-lg bg-[#F4F6F9] dark:bg-[#131A2B] border border-[#E4E8EF] dark:border-[#1B233A] text-[#131A2B] dark:text-[#F4F6F9] focus:outline-none focus:ring-1 focus:ring-[#2563EB] cursor-pointer"
                  >
                    <option value="responsive">Responsive (Fluid)</option>
                    <option value="leaderboard">Leaderboard (728×90)</option>
                    <option value="medium_rectangle">Medium Rectangle (300×250)</option>
                    <option value="skyscraper">Skyscraper (160×600)</option>
                    <option value="in_article">In-Article Native</option>
                  </select>
                  <div className="text-[10px] text-[#5B6577] dark:text-[#9AA5B8]">
                    Responsive adapts to mobile & desktop viewports
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
