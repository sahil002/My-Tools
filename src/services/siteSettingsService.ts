/**
 * Site Settings & Configuration Management Service
 * 
 * Manages:
 * 1. General site settings (site name, logo upload/URL, favicon, default meta description, social links)
 * 2. Theme settings (default mode, constrained design system accent color, secondary tone)
 * 3. SEO settings (robots.txt editor, sitemap regeneration engine, search engine IDs)
 */

import { TOOLS } from '../data/tools';
import { CATEGORIES } from '../data/categories';
import { getSiteUrl } from '../data/siteConfig';

export interface SocialLink {
  id: string;
  platform: 'twitter' | 'github' | 'linkedin' | 'youtube' | 'facebook' | 'discord' | 'custom';
  label: string;
  url: string;
  enabled: boolean;
}

export interface GeneralSettings {
  siteName: string;
  tagline: string;
  logoUrl: string;
  logoAlt: string;
  faviconUrl: string;
  defaultMetaDescription: string;
  contactEmail: string;
  copyrightText: string;
  socialLinks: SocialLink[];
}

export interface DesignSystemAccent {
  id: string;
  name: string;
  hex: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  ringClass: string;
  lightBgClass: string;
  description: string;
}

export const ACCENT_COLOR_PALETTE: DesignSystemAccent[] = [
  {
    id: 'purple-blue',
    name: 'Purple & Light Blue',
    hex: '#7C3AED',
    bgClass: 'bg-[#7C3AED]',
    textClass: 'text-[#7C3AED]',
    borderClass: 'border-[#7C3AED]',
    ringClass: 'ring-[#7C3AED]',
    lightBgClass: 'bg-purple-50 dark:bg-purple-950/40',
    description: 'Modern royal purple & electric light blue duo (Creative, sleek, high-contrast)'
  },
  {
    id: 'teal',
    name: 'Emerald Teal',
    hex: '#0D9488',
    bgClass: 'bg-[#0D9488]',
    textClass: 'text-[#0D9488]',
    borderClass: 'border-[#0D9488]',
    ringClass: 'ring-[#0D9488]',
    lightBgClass: 'bg-teal-50 dark:bg-teal-950/40',
    description: 'Premier precision accent (High-trust, modern, and eye-friendly)'
  },
  {
    id: 'orange',
    name: 'Vibrant Orange',
    hex: '#EA580C',
    bgClass: 'bg-[#EA580C]',
    textClass: 'text-[#EA580C]',
    borderClass: 'border-[#EA580C]',
    ringClass: 'ring-[#EA580C]',
    lightBgClass: 'bg-orange-50 dark:bg-orange-950/40',
    description: 'Warm energetic orange'
  },
  {
    id: 'blue',
    name: 'Electric Blue',
    hex: '#2563EB',
    bgClass: 'bg-[#2563EB]',
    textClass: 'text-[#2563EB]',
    borderClass: 'border-[#2563EB]',
    ringClass: 'ring-[#2563EB]',
    lightBgClass: 'bg-blue-50 dark:bg-blue-950/40',
    description: 'Classic corporate blue accent'
  },
  {
    id: 'indigo',
    name: 'Deep Indigo',
    hex: '#4F46E5',
    bgClass: 'bg-[#4F46E5]',
    textClass: 'text-[#4F46E5]',
    borderClass: 'border-[#4F46E5]',
    ringClass: 'ring-[#4F46E5]',
    lightBgClass: 'bg-indigo-50 dark:bg-indigo-950/40',
    description: 'Refined modern engineering contrast'
  },
  {
    id: 'slate',
    name: 'Slate Monochrome',
    hex: '#334155',
    bgClass: 'bg-[#334155]',
    textClass: 'text-[#334155]',
    borderClass: 'border-[#334155]',
    ringClass: 'ring-[#334155]',
    lightBgClass: 'bg-slate-100 dark:bg-slate-800/50',
    description: 'Minimalist high-contrast neutral slate'
  },
  {
    id: 'emerald',
    name: 'Emerald Green',
    hex: '#059669',
    bgClass: 'bg-[#059669]',
    textClass: 'text-[#059669]',
    borderClass: 'border-[#059669]',
    ringClass: 'ring-[#059669]',
    lightBgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
    description: 'Balanced organic precision tone'
  },
  {
    id: 'amber',
    name: 'Warm Amber',
    hex: '#D97706',
    bgClass: 'bg-[#D97706]',
    textClass: 'text-[#D97706]',
    borderClass: 'border-[#D97706]',
    ringClass: 'ring-[#D97706]',
    lightBgClass: 'bg-amber-50 dark:bg-amber-950/40',
    description: 'Focused editorial warmth'
  },
  {
    id: 'violet',
    name: 'Royal Violet',
    hex: '#7C3AED',
    bgClass: 'bg-[#7C3AED]',
    textClass: 'text-[#7C3AED]',
    borderClass: 'border-[#7C3AED]',
    ringClass: 'ring-[#7C3AED]',
    lightBgClass: 'bg-purple-50 dark:bg-purple-950/40',
    description: 'Creative studio contrast'
  },
  {
    id: 'rose',
    name: 'Crimson Rose',
    hex: '#E11D48',
    bgClass: 'bg-[#E11D48]',
    textClass: 'text-[#E11D48]',
    borderClass: 'border-[#E11D48]',
    ringClass: 'ring-[#E11D48]',
    lightBgClass: 'bg-rose-50 dark:bg-rose-950/40',
    description: 'Vibrant punchy contrast'
  }
];

export interface ThemeSettings {
  defaultMode: 'light' | 'dark' | 'system';
  accentColorId: string;
  secondaryTone: 'slate' | 'zinc' | 'neutral';
  uiDensity: 'comfortable' | 'compact';
}

export interface SeoAnalyticsSettings {
  robotsTxt: string;
  sitemapLastGenerated: string;
  sitemapTotalUrls: number;
  googleSearchConsoleVerificationId: string;
  googleAnalyticsMeasurementId: string;
  googleTagManagerId: string;
  bingWebmasterVerificationId: string;
  enableAutomaticSitemapPing: boolean;
}

export interface SiteSettingsData {
  general: GeneralSettings;
  theme: ThemeSettings;
  seo: SeoAnalyticsSettings;
  lastUpdated: string;
  updatedBy: string;
}

const STORAGE_SETTINGS_KEY = 'ot_site_settings_v1';

export const DEFAULT_ROBOTS_TXT = `# robots.txt for Online Tools
User-agent: *
Allow: /
Disallow: /admin
Disallow: /admin/
Disallow: /admin/*
Disallow: /panel-access
Disallow: /api/

# Sitemap Location
Sitemap: https://onlinetools.app/sitemap.xml
`;

export const DEFAULT_SITE_SETTINGS: SiteSettingsData = {
  general: {
    siteName: 'Online Tools',
    tagline: 'Fast, accurate, and easy-to-use online calculators, converters, and web utilities.',
    logoUrl: '',
    logoAlt: 'Online Tools Brand Logo',
    faviconUrl: '/favicon.ico',
    defaultMetaDescription: 'Free online calculators, converters, text utilities, and developer tools. Fast client-side computation with no sign-up or tracking.',
    contactEmail: 'contact@onlinetools.app',
    copyrightText: '© 2026 Online Tools. All rights reserved.',
    socialLinks: [
      {
        id: 'soc-x',
        platform: 'twitter',
        label: 'Twitter / X',
        url: 'https://twitter.com/onlinetools',
        enabled: true,
      },
      {
        id: 'soc-github',
        platform: 'github',
        label: 'GitHub',
        url: 'https://github.com/onlinetools',
        enabled: true,
      },
      {
        id: 'soc-linkedin',
        platform: 'linkedin',
        label: 'LinkedIn',
        url: 'https://linkedin.com/company/onlinetools',
        enabled: false,
      },
      {
        id: 'soc-youtube',
        platform: 'youtube',
        label: 'YouTube',
        url: 'https://youtube.com/@onlinetools',
        enabled: false,
      },
    ],
  },
  theme: {
    defaultMode: 'light',
    accentColorId: 'purple-blue',
    secondaryTone: 'slate',
    uiDensity: 'comfortable',
  },
  seo: {
    robotsTxt: DEFAULT_ROBOTS_TXT,
    sitemapLastGenerated: '2026-09-20T08:00:00.000Z',
    sitemapTotalUrls: 50,
    googleSearchConsoleVerificationId: 'google-site-verification=K8s_OT_9921_LiveVerification',
    googleAnalyticsMeasurementId: 'G-OT99210088',
    googleTagManagerId: '',
    bingWebmasterVerificationId: '',
    enableAutomaticSitemapPing: true,
  },
  lastUpdated: '2026-09-20T08:00:00.000Z',
  updatedBy: 'admin@onlinetools.internal',
};

/**
 * Retrieves the current site settings from localStorage or defaults
 */
export function getSiteSettings(): SiteSettingsData {
  try {
    const raw = localStorage.getItem(STORAGE_SETTINGS_KEY);
    if (!raw) {
      return DEFAULT_SITE_SETTINGS;
    }
    const parsed = JSON.parse(raw);
    return {
      general: { ...DEFAULT_SITE_SETTINGS.general, ...(parsed.general || {}) },
      theme: { ...DEFAULT_SITE_SETTINGS.theme, ...(parsed.theme || {}) },
      seo: { ...DEFAULT_SITE_SETTINGS.seo, ...(parsed.seo || {}) },
      lastUpdated: parsed.lastUpdated || new Date().toISOString(),
      updatedBy: parsed.updatedBy || 'admin@onlinetools.internal',
    };
  } catch {
    return DEFAULT_SITE_SETTINGS;
  }
}

/**
 * Persists site settings to localStorage and applies dynamic styles
 */
export function saveSiteSettings(data: SiteSettingsData): void {
  try {
    localStorage.setItem(STORAGE_SETTINGS_KEY, JSON.stringify(data));
    applyThemeSettings(data.theme);
  } catch (err) {
    console.error('Failed to persist site settings:', err);
  }
}

/**
 * Resets site settings to factory defaults
 */
export function resetSiteSettings(): SiteSettingsData {
  try {
    localStorage.removeItem(STORAGE_SETTINGS_KEY);
    applyThemeSettings(DEFAULT_SITE_SETTINGS.theme);
  } catch {
    // ignore
  }
  return DEFAULT_SITE_SETTINGS;
}

/**
 * Applies theme settings dynamically to document root
 */
export function applyThemeSettings(theme: ThemeSettings): void {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;
  const accent = ACCENT_COLOR_PALETTE.find((a) => a.id === theme.accentColorId) || ACCENT_COLOR_PALETTE[0];

  // Apply primary accent CSS variable
  root.style.setProperty('--primary-accent', accent.hex);

  // Apply density attribute
  root.setAttribute('data-density', theme.uiDensity);
}

/**
 * Generates XML Sitemap content from live routes, tools, and categories
 */
export function generateLiveSitemapXml(): { xml: string; urlCount: number; urls: string[] } {
  const baseUrl = getSiteUrl();
  const currentDate = new Date().toISOString().split('T')[0];

  const urls: { loc: string; lastmod: string; changefreq: string; priority: string }[] = [];

  // 1. Core pages
  urls.push(
    { loc: `${baseUrl}/`, lastmod: currentDate, changefreq: 'daily', priority: '1.0' },
    { loc: `${baseUrl}/tools`, lastmod: currentDate, changefreq: 'daily', priority: '0.9' },
    { loc: `${baseUrl}/favorites`, lastmod: currentDate, changefreq: 'weekly', priority: '0.6' },
    { loc: `${baseUrl}/request-tool`, lastmod: currentDate, changefreq: 'monthly', priority: '0.5' },
    { loc: `${baseUrl}/privacy-policy`, lastmod: currentDate, changefreq: 'yearly', priority: '0.3' },
    { loc: `${baseUrl}/terms`, lastmod: currentDate, changefreq: 'yearly', priority: '0.3' },
    { loc: `${baseUrl}/contact`, lastmod: currentDate, changefreq: 'monthly', priority: '0.4' },
  );

  // 2. Categories
  CATEGORIES.forEach((cat) => {
    urls.push({
      loc: `${baseUrl}/${cat.slug}`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.8',
    });
  });

  // 3. Tools
  TOOLS.forEach((tool) => {
    urls.push({
      loc: `${baseUrl}/${tool.category}/${tool.slug}`,
      lastmod: currentDate,
      changefreq: 'weekly',
      priority: '0.85',
    });
  });

  // 4. Default Guides
  const guides = [
    'how-to-calculate-percentage',
    'understanding-word-count-metrics',
    'developer-guide-json-formatting',
  ];
  guides.forEach((g) => {
    urls.push({
      loc: `${baseUrl}/guides/${g}`,
      lastmod: currentDate,
      changefreq: 'monthly',
      priority: '0.7',
    });
  });

  // Construct XML
  let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
  xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

  urls.forEach((u) => {
    xml += `  <url>\n`;
    xml += `    <loc>${u.loc}</loc>\n`;
    xml += `    <lastmod>${u.lastmod}</lastmod>\n`;
    xml += `    <changefreq>${u.changefreq}</changefreq>\n`;
    xml += `    <priority>${u.priority}</priority>\n`;
    xml += `  </url>\n`;
  });

  xml += `</urlset>`;

  return {
    xml,
    urlCount: urls.length,
    urls: urls.map((u) => u.loc),
  };
}

/**
 * Triggers sitemap regeneration and updates settings
 */
export async function triggerSitemapRegeneration(): Promise<{
  success: boolean;
  urlCount: number;
  timestamp: string;
  xml: string;
}> {
  // Simulate sitemap compilation and validation pass
  await new Promise((resolve) => setTimeout(resolve, 600));

  const { xml, urlCount } = generateLiveSitemapXml();
  const now = new Date().toISOString();

  const current = getSiteSettings();
  const updated: SiteSettingsData = {
    ...current,
    seo: {
      ...current.seo,
      sitemapLastGenerated: now,
      sitemapTotalUrls: urlCount,
    },
    lastUpdated: now,
  };

  saveSiteSettings(updated);

  return {
    success: true,
    urlCount,
    timestamp: now,
    xml,
  };
}
