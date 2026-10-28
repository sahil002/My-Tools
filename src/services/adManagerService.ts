/**
 * Google Ads Manager Service
 * Manages site-wide and per-page Google AdSense / Ad Manager placements,
 * ad unit codes, visual formats, and live real-time synchronization.
 */

export type PageTypeId = 'homepage' | 'tool_page' | 'category_page' | 'blog_post' | 'blog_listing';

export type PlacementPosition =
  | 'below_hero'
  | 'sidebar'
  | 'between_sections'
  | 'before_footer'
  | 'in_content'
  | 'in_feed'
  | 'below_tool';

export type AdFormat =
  | 'responsive'
  | 'leaderboard'
  | 'medium_rectangle'
  | 'skyscraper'
  | 'in_article';

export interface AdPlacementConfig {
  id: string; // unique placement ID e.g. "home_below_hero"
  position: PlacementPosition;
  name: string; // e.g. "Below Hero"
  description: string;
  enabled: boolean;
  adUnitCode: string; // Google AdSense slot id or snippet (e.g. "1029384756")
  format: AdFormat;
  minHeightPx?: number;
}

export interface PageTypeAdConfig {
  id: PageTypeId;
  name: string;
  description: string;
  enabled: boolean;
  routeExample: string;
  placements: AdPlacementConfig[];
}

export interface GlobalAdSettings {
  globalEnabled: boolean;
  publisherId: string; // e.g. "ca-pub-1234567890123456"
  autoAdsEnabled: boolean;
  testMode: boolean; // renders subtle placement outlines on public pages
  lastUpdated: string;
  pages: Record<PageTypeId, PageTypeAdConfig>;
}

const LOCAL_STORAGE_ADS_KEY = 'ot_ads_manager_config';
export const ADS_CONFIG_EVENT = 'ot_ads_config_updated';

/**
 * Baseline default ad placements configuration
 */
export function getDefaultAdSettings(): GlobalAdSettings {
  return {
    globalEnabled: true,
    publisherId: '',
    autoAdsEnabled: false,
    testMode: true,
    lastUpdated: new Date().toISOString(),
    pages: {
      homepage: {
        id: 'homepage',
        name: 'Homepage',
        description: 'Root directory entry with hero search, popular calculators, and category clusters',
        enabled: true,
        routeExample: '/',
        placements: [
          {
            id: 'home_below_hero',
            position: 'below_hero',
            name: 'Below Hero',
            description: 'Prominent horizontal banner immediately beneath the hero search bar',
            enabled: true,
            adUnitCode: '',
            format: 'responsive',
            minHeightPx: 90,
          },
          {
            id: 'home_between_sections',
            position: 'between_sections',
            name: 'Between Sections',
            description: 'Wide separator between featured utilities and category explorer',
            enabled: true,
            adUnitCode: '',
            format: 'leaderboard',
            minHeightPx: 90,
          },
          {
            id: 'home_before_footer',
            position: 'before_footer',
            name: 'Before Footer',
            description: 'Clean pre-footer banner above privacy, terms, and sitemap links',
            enabled: false,
            adUnitCode: '',
            format: 'responsive',
            minHeightPx: 90,
          },
        ],
      },
      tool_page: {
        id: 'tool_page',
        name: 'Tool Page',
        description: 'Individual interactive tool view with calculator UI, formula steps, and FAQs',
        enabled: true,
        routeExample: '/tools/word-counter',
        placements: [
          {
            id: 'tool_below_tool',
            position: 'below_tool',
            name: 'Below Tool Interface',
            description: 'Prime conversion slot directly underneath the calculation results card',
            enabled: true,
            adUnitCode: '',
            format: 'responsive',
            minHeightPx: 100,
          },
          {
            id: 'tool_sidebar',
            position: 'sidebar',
            name: 'Sidebar',
            description: 'Desktop side-rail placement alongside key utility instructions and shortcuts',
            enabled: false,
            adUnitCode: '',
            format: 'medium_rectangle',
            minHeightPx: 250,
          },
          {
            id: 'tool_between_sections',
            position: 'between_sections',
            name: 'Between Sections',
            description: 'Divider slot between mathematical formula breakdown and user FAQs',
            enabled: true,
            adUnitCode: '',
            format: 'responsive',
            minHeightPx: 90,
          },
          {
            id: 'tool_before_footer',
            position: 'before_footer',
            name: 'Before Footer',
            description: 'Wide horizontal display placed before bottom directory navigation',
            enabled: false,
            adUnitCode: '',
            format: 'responsive',
            minHeightPx: 90,
          },
        ],
      },
      category_page: {
        id: 'category_page',
        name: 'Category Page',
        description: 'Categorized utilities archive with filter tags, search, and tool listings',
        enabled: true,
        routeExample: '/category/math-calculators',
        placements: [
          {
            id: 'cat_below_hero',
            position: 'below_hero',
            name: 'Below Hero',
            description: 'Banner positioned immediately under category header & tool count pills',
            enabled: true,
            adUnitCode: '',
            format: 'responsive',
            minHeightPx: 90,
          },
          {
            id: 'cat_in_feed',
            position: 'in_feed',
            name: 'In-Feed Grid Card',
            description: 'Sponsored tile placed inline among directory utility cards',
            enabled: false,
            adUnitCode: '',
            format: 'responsive',
            minHeightPx: 180,
          },
          {
            id: 'cat_before_footer',
            position: 'before_footer',
            name: 'Before Footer',
            description: 'Wide banner positioned after all tool cards preceding page footer',
            enabled: true,
            adUnitCode: '',
            format: 'responsive',
            minHeightPx: 90,
          },
        ],
      },
      blog_post: {
        id: 'blog_post',
        name: 'Blog Post',
        description: 'In-depth educational guide with markdown body, formulas, and diagrams',
        enabled: true,
        routeExample: '/guides/percentage-calculation-guide',
        placements: [
          {
            id: 'post_below_hero',
            position: 'below_hero',
            name: 'Below Article Header',
            description: 'Positioned right under article title, reading time, and author meta',
            enabled: true,
            adUnitCode: '',
            format: 'responsive',
            minHeightPx: 90,
          },
          {
            id: 'post_in_content',
            position: 'in_content',
            name: 'In-Content',
            description: 'Mid-article editorial slot embedded between article subsections',
            enabled: true,
            adUnitCode: '',
            format: 'in_article',
            minHeightPx: 100,
          },
          {
            id: 'post_sidebar',
            position: 'sidebar',
            name: 'Sidebar',
            description: 'Sticky desktop sidebar rail slot alongside long-form reading text',
            enabled: false,
            adUnitCode: '',
            format: 'skyscraper',
            minHeightPx: 600,
          },
          {
            id: 'post_before_footer',
            position: 'before_footer',
            name: 'Before Footer',
            description: 'Wide pre-footer placement following article conclusion and related reads',
            enabled: true,
            adUnitCode: '',
            format: 'responsive',
            minHeightPx: 90,
          },
        ],
      },
      blog_listing: {
        id: 'blog_listing',
        name: 'Blog Listing',
        description: 'Guides library index showcasing educational writeups and search filter',
        enabled: true,
        routeExample: '/guides',
        placements: [
          {
            id: 'listing_below_hero',
            position: 'below_hero',
            name: 'Below Hero',
            description: 'Header banner beneath guide directory introduction',
            enabled: true,
            adUnitCode: '',
            format: 'responsive',
            minHeightPx: 90,
          },
          {
            id: 'listing_in_feed',
            position: 'in_feed',
            name: 'In-Feed',
            description: 'Editorial sponsored card woven into the guides article card grid',
            enabled: false,
            adUnitCode: '',
            format: 'responsive',
            minHeightPx: 180,
          },
          {
            id: 'listing_before_footer',
            position: 'before_footer',
            name: 'Before Footer',
            description: 'Bottom banner prior to directory footer navigation',
            enabled: true,
            adUnitCode: '',
            format: 'responsive',
            minHeightPx: 90,
          },
        ],
      },
    },
  };
}

/**
 * Retrieve current ad configuration from localStorage or initialize with defaults
 */
export function getAdConfig(): GlobalAdSettings {
  if (typeof window === 'undefined') {
    return getDefaultAdSettings();
  }
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_ADS_KEY);
    if (!raw) {
      const defaults = getDefaultAdSettings();
      saveAdConfig(defaults, false);
      return defaults;
    }
    const parsed = JSON.parse(raw) as Partial<GlobalAdSettings>;
    return mergeAdSettings(parsed);
  } catch {
    return getDefaultAdSettings();
  }
}

/**
 * Persist updated ad configuration to localStorage and broadcast real-time update event
 */
function mergeAdSettings(incoming: Partial<GlobalAdSettings> | null | undefined): GlobalAdSettings {
  const defaults = getDefaultAdSettings();
  if (!incoming || typeof incoming !== 'object') return defaults;
  const incomingPages = (incoming.pages && typeof incoming.pages === 'object' ? incoming.pages : {}) as GlobalAdSettings['pages'];
  const pages = { ...defaults.pages } as GlobalAdSettings['pages'];

  (Object.keys(defaults.pages) as PageTypeId[]).forEach((pageId) => {
    const defaultPage = defaults.pages[pageId];
    const savedPage = incomingPages[pageId];
    if (!savedPage || typeof savedPage !== 'object') return;
    const savedPlacements = Array.isArray(savedPage.placements) ? savedPage.placements : [];
    const placementMap = new Map(defaultPage.placements.map((placement) => [placement.id, placement]));
    savedPlacements.forEach((placement: AdPlacementConfig) => {
      if (placement?.id) placementMap.set(placement.id, { ...placementMap.get(placement.id), ...placement });
    });
    pages[pageId] = {
      ...defaultPage,
      ...savedPage,
      id: pageId,
      placements: Array.from(placementMap.values()),
    };
  });

  return {
    ...defaults,
    ...incoming,
    pages,
    lastUpdated: typeof incoming.lastUpdated === 'string' ? incoming.lastUpdated : defaults.lastUpdated,
  };
}

function applyAdConfig(config: GlobalAdSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_ADS_KEY, JSON.stringify(config));
    window.dispatchEvent(new CustomEvent(ADS_CONFIG_EVENT, { detail: config }));
  } catch (err) {
    console.error('Failed to cache ads configuration:', err);
  }
}

/** Load the shared, server-persisted ad settings so every visitor sees the same configuration. */
export async function loadSharedAdConfig(): Promise<GlobalAdSettings> {
  if (typeof window === 'undefined') return getDefaultAdSettings();
  try {
    const response = await fetch('/api/admin/ad-settings', {
      method: 'GET',
      credentials: 'same-origin',
      headers: { Accept: 'application/json' },
    });
    const payload = await response.json().catch(() => ({}));
    if (response.ok && payload?.success && payload.config) {
      const merged = mergeAdSettings(payload.config as Partial<GlobalAdSettings>);
      applyAdConfig(merged);
      return merged;
    }
  } catch (err) {
    console.warn('[Ads] Shared settings unavailable; using browser cache.', err);
  }
  return getAdConfig();
}

/** Persist locally immediately, then save to shared Supabase storage when an admin session is present. */
export function saveAdConfig(config: GlobalAdSettings, syncRemote = true): void {
  if (typeof window === 'undefined') return;
  const normalized = mergeAdSettings({ ...config, lastUpdated: new Date().toISOString() });
  applyAdConfig(normalized);
  if (syncRemote) {
    void fetch('/api/admin/ad-settings', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ config: normalized }),
    }).then(async (response) => {
      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        console.warn('[Ads] Shared settings were not saved:', payload?.error || response.statusText);
        window.dispatchEvent(new CustomEvent('prbsolver_ads_save_error', { detail: payload?.error || 'Unable to save shared ad settings.' }));
      } else {
        window.dispatchEvent(new CustomEvent('prbsolver_ads_saved'));
      }
    }).catch((err) => {
      console.warn('[Ads] Shared settings save failed:', err);
      window.dispatchEvent(new CustomEvent('prbsolver_ads_save_error', { detail: 'Network error saving shared ad settings.' }));
    });
  }
}

/**
 * Reset ad configuration back to original defaults
 */
export function resetAdConfig(): GlobalAdSettings {
  const defaults = getDefaultAdSettings();
  saveAdConfig(defaults);
  return defaults;
}

/**
 * Helper to determine whether an ad slot should be rendered live on a given page
 */
export function isAdVisible(
  pageType: PageTypeId,
  positionOrId: PlacementPosition | string
): boolean {
  const config = getAdConfig();
  if (!config.globalEnabled) return false;

  const page = config.pages[pageType];
  if (!page || !page.enabled) return false;

  const placement = page.placements.find(
    (p) => p.id === positionOrId || p.position === positionOrId
  );
  if (!placement || !placement.enabled) return false;

  return true;
}

/**
 * Find placement configuration by page type and position or ID
 */
export function getPlacementConfig(
  pageType: PageTypeId,
  positionOrId: PlacementPosition | string
): AdPlacementConfig | null {
  const config = getAdConfig();
  const page = config.pages[pageType];
  if (!page) return null;

  return (
    page.placements.find((p) => p.id === positionOrId || p.position === positionOrId) ||
    null
  );
}
