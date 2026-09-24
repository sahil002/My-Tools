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
    publisherId: 'ca-pub-9842103948572019',
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
            adUnitCode: '1029384756',
            format: 'responsive',
            minHeightPx: 90,
          },
          {
            id: 'home_between_sections',
            position: 'between_sections',
            name: 'Between Sections',
            description: 'Wide separator between featured utilities and category explorer',
            enabled: true,
            adUnitCode: '2938475610',
            format: 'leaderboard',
            minHeightPx: 90,
          },
          {
            id: 'home_before_footer',
            position: 'before_footer',
            name: 'Before Footer',
            description: 'Clean pre-footer banner above privacy, terms, and sitemap links',
            enabled: false,
            adUnitCode: '3847561029',
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
            adUnitCode: '4756102938',
            format: 'responsive',
            minHeightPx: 100,
          },
          {
            id: 'tool_sidebar',
            position: 'sidebar',
            name: 'Sidebar',
            description: 'Desktop side-rail placement alongside key utility instructions and shortcuts',
            enabled: false,
            adUnitCode: '5610293847',
            format: 'medium_rectangle',
            minHeightPx: 250,
          },
          {
            id: 'tool_between_sections',
            position: 'between_sections',
            name: 'Between Sections',
            description: 'Divider slot between mathematical formula breakdown and user FAQs',
            enabled: true,
            adUnitCode: '6102938475',
            format: 'responsive',
            minHeightPx: 90,
          },
          {
            id: 'tool_before_footer',
            position: 'before_footer',
            name: 'Before Footer',
            description: 'Wide horizontal display placed before bottom directory navigation',
            enabled: false,
            adUnitCode: '7102938476',
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
            adUnitCode: '8293847561',
            format: 'responsive',
            minHeightPx: 90,
          },
          {
            id: 'cat_in_feed',
            position: 'in_feed',
            name: 'In-Feed Grid Card',
            description: 'Sponsored tile placed inline among directory utility cards',
            enabled: false,
            adUnitCode: '9283746510',
            format: 'responsive',
            minHeightPx: 180,
          },
          {
            id: 'cat_before_footer',
            position: 'before_footer',
            name: 'Before Footer',
            description: 'Wide banner positioned after all tool cards preceding page footer',
            enabled: true,
            adUnitCode: '1092837465',
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
            adUnitCode: '2093847561',
            format: 'responsive',
            minHeightPx: 90,
          },
          {
            id: 'post_in_content',
            position: 'in_content',
            name: 'In-Content',
            description: 'Mid-article editorial slot embedded between article subsections',
            enabled: true,
            adUnitCode: '3194857602',
            format: 'in_article',
            minHeightPx: 100,
          },
          {
            id: 'post_sidebar',
            position: 'sidebar',
            name: 'Sidebar',
            description: 'Sticky desktop sidebar rail slot alongside long-form reading text',
            enabled: false,
            adUnitCode: '4205968713',
            format: 'skyscraper',
            minHeightPx: 600,
          },
          {
            id: 'post_before_footer',
            position: 'before_footer',
            name: 'Before Footer',
            description: 'Wide pre-footer placement following article conclusion and related reads',
            enabled: true,
            adUnitCode: '5316079824',
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
            adUnitCode: '6427180935',
            format: 'responsive',
            minHeightPx: 90,
          },
          {
            id: 'listing_in_feed',
            position: 'in_feed',
            name: 'In-Feed',
            description: 'Editorial sponsored card woven into the guides article card grid',
            enabled: false,
            adUnitCode: '7538291046',
            format: 'responsive',
            minHeightPx: 180,
          },
          {
            id: 'listing_before_footer',
            position: 'before_footer',
            name: 'Before Footer',
            description: 'Bottom banner prior to directory footer navigation',
            enabled: true,
            adUnitCode: '8649302157',
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
      saveAdConfig(defaults);
      return defaults;
    }
    const parsed = JSON.parse(raw) as GlobalAdSettings;
    // Merge with any newly introduced page types or placements if needed
    const defaults = getDefaultAdSettings();
    if (!parsed.pages) parsed.pages = defaults.pages;
    return parsed;
  } catch {
    return getDefaultAdSettings();
  }
}

/**
 * Persist updated ad configuration to localStorage and broadcast real-time update event
 */
export function saveAdConfig(config: GlobalAdSettings): void {
  if (typeof window === 'undefined') return;
  config.lastUpdated = new Date().toISOString();
  try {
    localStorage.setItem(LOCAL_STORAGE_ADS_KEY, JSON.stringify(config));
    window.dispatchEvent(
      new CustomEvent(ADS_CONFIG_EVENT, {
        detail: config,
      })
    );
  } catch (err) {
    console.error('Failed to save ads configuration:', err);
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
