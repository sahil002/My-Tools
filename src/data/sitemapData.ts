import { CATEGORIES } from './categories';
import { TOOLS } from './tools';
import { GUIDES } from './guides';
import { getSiteUrl } from './siteConfig';

export interface SitemapRoute {
  path: string;
  loc: string;
  lastmod?: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: string;
}

/**
 * Returns all crawlable canonical routes derived dynamically from the central registries:
 * - Static pages
 * - Categories (data/categories.ts)
 * - Tools (data/tools.ts)
 * - Guides (data/guides.ts)
 */
export function getAllSitemapRoutes(customBaseUrl?: string): SitemapRoute[] {
  const baseUrl = (customBaseUrl || getSiteUrl()).replace(/\/+$/, '');

  const staticPages: { path: string; priority: string; changefreq: SitemapRoute['changefreq'] }[] = [
    { path: '/', priority: '1.0', changefreq: 'weekly' },
    { path: '/tools', priority: '0.9', changefreq: 'daily' },
    { path: '/guides', priority: '0.9', changefreq: 'weekly' },
    { path: '/request-a-tool', priority: '0.7', changefreq: 'monthly' },
    { path: '/about', priority: '0.6', changefreq: 'monthly' },
    { path: '/contact', priority: '0.6', changefreq: 'monthly' },
    { path: '/privacy-policy', priority: '0.3', changefreq: 'yearly' },
    { path: '/terms', priority: '0.3', changefreq: 'yearly' },
    { path: '/cookie-policy', priority: '0.3', changefreq: 'yearly' },
    { path: '/sitemap', priority: '0.4', changefreq: 'monthly' },
  ];

  const categoryRoutes: SitemapRoute[] = CATEGORIES.map((c) => ({
    path: `/${c.slug}`,
    loc: `${baseUrl}/${c.slug}`,
    priority: '0.8',
    changefreq: 'weekly',
  }));

  const toolRoutes: SitemapRoute[] = TOOLS.map((t) => ({
    path: `/${t.category}/${t.slug}`,
    loc: `${baseUrl}/${t.category}/${t.slug}`,
    priority: '0.8',
    changefreq: 'monthly',
  }));

  const guideRoutes: SitemapRoute[] = GUIDES.map((g) => ({
    path: `/guides/${g.slug}`,
    loc: `${baseUrl}/guides/${g.slug}`,
    priority: '0.7',
    changefreq: 'monthly',
    lastmod: g.updatedDate || g.publishedDate,
  }));

  return [
    ...staticPages.map((r) => ({
      ...r,
      loc: r.path === '/' ? baseUrl : `${baseUrl}${r.path}`,
    })),
    ...categoryRoutes,
    ...toolRoutes,
    ...guideRoutes,
  ];
}

/**
 * Generates valid standard sitemap.xml representation from central data
 */
export function generateSitemapXml(customBaseUrl?: string): string {
  const routes = getAllSitemapRoutes(customBaseUrl);

  const xmlEntries = routes
    .map((r) => {
      const lastmodTag = r.lastmod ? `\n    <lastmod>${r.lastmod}</lastmod>` : '';
      return `  <url>
    <loc>${r.loc}</loc>${lastmodTag}
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`;
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${xmlEntries}
</urlset>`;
}

/**
 * Generates minimal standard robots.txt representation
 */
export function generateRobotsTxt(customBaseUrl?: string): string {
  const baseUrl = (customBaseUrl || getSiteUrl()).replace(/\/+$/, '');
  return `User-agent: *
Disallow: /panel-access
Disallow: /admin
Disallow: /admin/
Disallow: /admin/*
Allow: /

Sitemap: ${baseUrl}/sitemap.xml
`;
}
