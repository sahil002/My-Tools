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
      className="bg-[#FFFFFF] border border-[#EDE9FE] rounded-2xl p-5 shadow-xs space-y-4"
    >
      <div>
        <h3 className="text-sm font-heading font-bold text-[#1E1035] flex items-center gap-2">
          <Sliders className="w-4 h-4 text-[#7C3AED]" />
          <span>Placement Slots &amp; Ad Unit Codes</span>
        </h3>
        <p className="text-xs text-[#6D6582] mt-0.5">
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
                  ? 'border-[#7C3AED] bg-[#F5F3FF]/40 shadow-xs ring-1 ring-[#7C3AED]'
                  : 'border-[#EDE9FE] bg-[#FFFFFF] hover:border-[#DDD6FE]'
              }`}
            >
              {/* Header: Title, Position, and On/Off Toggle */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#EDE9FE]">
                <div className="flex items-center gap-2.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#7C3AED]" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-heading font-bold text-[#1E1035]">
                        {placement.name}
                      </h4>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#FAF9FE] text-[#6D6582] border border-[#EDE9FE]">
                        {placement.position}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#6D6582] mt-0.5">
                      {placement.description}
                    </p>
                  </div>
                </div>

                {/* Individual Placement Toggle Switch */}
                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <span className="text-xs font-medium text-[#6D6582]">
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
                    <div className="w-9 h-5 bg-[#EDE9FE] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#7C3AED]" />
                  </label>
                </div>
              </div>

              {/* Form Controls: Ad Unit Code & Format */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-3 text-xs">
                {/* Ad Code / Unit ID Input */}
                <div className="sm:col-span-8 space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="font-heading font-semibold text-[#1E1035] flex items-center gap-1.5">
                      <Code className="w-3.5 h-3.5 text-[#7C3AED]" />
                      <span>Ad Unit Code / Slot ID</span>
                    </label>
                    {placement.adUnitCode && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyCode(placement.id, placement.adUnitCode);
                        }}
                        className="text-[10px] text-[#6D6582] hover:text-[#7C3AED] inline-flex items-center gap-1 cursor-pointer font-medium"
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
                    className="w-full text-xs font-mono p-2 rounded-xl bg-white border border-[#DDD6FE] text-[#1E1035] placeholder-[#9D95B3] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED]"
                  />
                  <div className="text-[10px] text-[#6D6582]">
                    Google AdSense `data-ad-slot` numeric ID or Google Ad Manager unit string
                  </div>
                </div>

                {/* Ad Format Selector */}
                <div className="sm:col-span-4 space-y-1">
                  <label className="font-heading font-semibold text-[#1E1035] block">
                    Display Format
                  </label>
                  <select
                    value={placement.format}
                    onChange={(e) =>
                      onUpdatePlacement(placement.id, {
                        format: e.target.value as AdFormat,
                      })
                    }
                    className="w-full text-xs p-2 rounded-xl bg-white border border-[#DDD6FE] text-[#1E1035] focus:outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] cursor-pointer"
                  >
                    <option value="responsive">Responsive (Fluid)</option>
                    <option value="leaderboard">Leaderboard (728×90)</option>
                    <option value="medium_rectangle">Medium Rectangle (300×250)</option>
                    <option value="skyscraper">Skyscraper (160×600)</option>
                    <option value="in_article">In-Article Native</option>
                  </select>
                  <div className="text-[10px] text-[#6D6582]">
                    Responsive adapts to mobile &amp; desktop viewports
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
