import React, { useState, useEffect } from 'react';
import {
  getAdConfig,
  ADS_CONFIG_EVENT,
  PageTypeId,
  PlacementPosition,
  GlobalAdSettings,
} from '../services/adManagerService';

export type AdSlotType =
  | 'top-leaderboard'
  | 'post-calculation'
  | 'sidebar'
  | 'in-feed'
  | 'in-article'
  | 'bottom-leaderboard';

export interface AdSlotProps {
  id?: string;
  type?: AdSlotType;
  className?: string;
  showPlaceholder?: boolean;
  showExplanation?: boolean;
  pageType?: PageTypeId;
  placementPosition?: PlacementPosition;
}

/**
 * Infer page type and placement position from slot id or legacy type
 */
function inferAdPlacement(
  id: string,
  type: AdSlotType,
  explicitPage?: PageTypeId,
  explicitPos?: PlacementPosition
): { pageType: PageTypeId; position: PlacementPosition } {
  if (explicitPage && explicitPos) {
    return { pageType: explicitPage, position: explicitPos };
  }

  const idLower = (id || '').toLowerCase();

  // Inferred page types
  let pageType: PageTypeId = explicitPage || 'tool_page';
  if (idLower.includes('home')) {
    pageType = 'homepage';
  } else if (idLower.includes('category') || idLower.includes('tools-directory')) {
    pageType = 'category_page';
  } else if (idLower.includes('guide') || idLower.includes('article') || idLower.includes('post')) {
    pageType = 'blog_post';
  } else if (idLower.includes('tool')) {
    pageType = 'tool_page';
  }

  // Inferred placement position
  let position: PlacementPosition = explicitPos || 'below_tool';
  if (type === 'top-leaderboard' || idLower.includes('top') || idLower.includes('hero')) {
    position = 'below_hero';
  } else if (type === 'bottom-leaderboard' || idLower.includes('bottom') || idLower.includes('footer')) {
    position = 'before_footer';
  } else if (type === 'sidebar' || idLower.includes('sidebar')) {
    position = 'sidebar';
  } else if (type === 'in-feed' || idLower.includes('feed') || idLower.includes('grid')) {
    position = 'in_feed';
  } else if (type === 'in-article' || idLower.includes('article') || idLower.includes('content')) {
    position = 'in_content';
  } else if (type === 'post-calculation' || idLower.includes('calc') || idLower.includes('tool')) {
    position = 'below_tool';
  }

  return { pageType, position };
}

/**
 * Architecture-ready Google AdSense / Ad Manager Slot component.
 * Live-syncs with Admin Ads Manager without requiring redeployment.
 */
export function AdSlot({
  id = 'ad-slot',
  type = 'post-calculation',
  className = '',
  showPlaceholder = false,
  pageType: explicitPage,
  placementPosition: explicitPos,
}: AdSlotProps) {
  const [config, setConfig] = useState<GlobalAdSettings>(() => getAdConfig());

  // Listen to live ad settings updates broadcasted by Ads Manager
  useEffect(() => {
    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<GlobalAdSettings>;
      if (customEvent.detail) {
        setConfig(customEvent.detail);
      } else {
        setConfig(getAdConfig());
      }
    };

    window.addEventListener(ADS_CONFIG_EVENT, handleUpdate);
    return () => {
      window.removeEventListener(ADS_CONFIG_EVENT, handleUpdate);
    };
  }, []);

  const { pageType, position } = inferAdPlacement(id, type, explicitPage, explicitPos);

  // Check visibility according to live admin settings
  const isGlobalEnabled = config.globalEnabled;
  const pageConfig = config.pages[pageType];
  const isPageEnabled = pageConfig ? pageConfig.enabled : false;
  const placementConfig = pageConfig?.placements.find(
    (p) => p.position === position || p.id === id
  );
  const isPlacementEnabled = placementConfig ? placementConfig.enabled : false;

  const isVisible = isGlobalEnabled && isPageEnabled && isPlacementEnabled;

  // If ads are not enabled, render nothing cleanly (no layout shifts)
  if (!isVisible && !showPlaceholder) {
    return null;
  }

  // Dimension classes for responsive presentation
  const containerClasses = {
    'top-leaderboard': 'min-h-[90px] max-w-[728px] mx-auto',
    'post-calculation': 'min-h-[100px] max-w-[728px] mx-auto',
    'sidebar': 'min-h-[250px] w-full max-w-[300px] mx-auto',
    'in-feed': 'h-full min-h-[180px] w-full',
    'in-article': 'min-h-[100px] max-w-[728px] mx-auto',
    'bottom-leaderboard': 'min-h-[90px] max-w-[728px] mx-auto',
  }[type];

  return (
    <div
      id={id}
      aria-label="Advertisement"
      className={`my-6 w-full ${className}`}
    >
      <div
        className={`w-full ${containerClasses} border border-dashed border-[#E4E8EF] dark:border-[#1B233A] rounded-2xl bg-[#F4F6F9] dark:bg-[#1B233A] flex flex-col items-center justify-center p-4 text-center select-none transition-colors font-sans`}
      >
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-heading font-semibold uppercase tracking-wider text-[#9AA5B8]">
            Advertisement
          </span>
          {placementConfig?.name && (
            <span className="text-[10px] font-mono text-[#5B6577] dark:text-[#9AA5B8]">
              • {placementConfig.name}
            </span>
          )}
        </div>

        {config.testMode && placementConfig?.adUnitCode && (
          <div className="mt-1 text-[10px] font-mono text-[#9AA5B8]">
            Slot ID: {placementConfig.adUnitCode}
          </div>
        )}
      </div>
    </div>
  );
}

// Export alias for backwards compatibility
export const AdSlotPlaceholder = AdSlot;

