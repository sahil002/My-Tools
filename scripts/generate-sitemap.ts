import 'dotenv/config';
import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { getAllSitemapRoutes, generateRobotsTxt } from '../src/data/sitemapData';

type DynamicRoute = {
  path: string;
  lastmod?: string;
  priority: string;
  changefreq: 'weekly' | 'monthly';
};

function cleanDate(value: unknown): string | undefined {
  if (typeof value !== 'string' || !value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString().slice(0, 10);
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

async function getPublishedDatabaseRoutes(): Promise<DynamicRoute[]> {
  const url = process.env.VITE_SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.VITE_SUPABASE_ANON_KEY?.trim();

  if (!url || !key) {
    console.warn('[sitemap] Supabase build env is missing; generating sitemap from static routes only.');
    return [];
  }

  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const routes: DynamicRoute[] = [];
  const [categoriesResult, toolsResult, guidesResult] = await Promise.all([
    supabase.from('categories').select('slug, updated_at').eq('is_visible', true),
    supabase.from('tools').select('slug, updated_at').eq('is_active', true),
    supabase.from('guides').select('slug, updated_date, updated_at').eq('is_draft', false),
  ]);

  if (categoriesResult.error) {
    console.warn('[sitemap] Could not load published categories:', categoriesResult.error.message);
  } else {
    for (const category of categoriesResult.data ?? []) {
      if (category.slug) {
        routes.push({ path: `/${category.slug}`, lastmod: cleanDate(category.updated_at), priority: '0.8', changefreq: 'weekly' });
      }
    }
  }

  if (toolsResult.error) {
    console.warn('[sitemap] Could not load active tools:', toolsResult.error.message);
  } else {
    for (const tool of toolsResult.data ?? []) {
      if (tool.slug) {
        routes.push({ path: `/tools/${tool.slug}`, lastmod: cleanDate(tool.updated_at), priority: '0.8', changefreq: 'monthly' });
      }
    }
  }

  if (guidesResult.error) {
    console.warn('[sitemap] Could not load published guides:', guidesResult.error.message);
  } else {
    for (const guide of guidesResult.data ?? []) {
      if (guide.slug) {
        routes.push({ path: `/guides/${guide.slug}`, lastmod: cleanDate(guide.updated_date || guide.updated_at), priority: '0.7', changefreq: 'monthly' });
      }
    }
  }

  return routes;
}

async function main() {
  const publicDir = path.resolve(process.cwd(), 'public');
  fs.mkdirSync(publicDir, { recursive: true });

  const siteUrl = 'https://www.prbsolver.com';
  const staticRoutes = getAllSitemapRoutes(siteUrl);
  const databaseRoutes = await getPublishedDatabaseRoutes();
  const routeMap = new Map<string, { loc: string; lastmod?: string; changefreq: string; priority: string }>();

  for (const route of staticRoutes) {
    routeMap.set(route.path, {
      loc: route.loc,
      lastmod: route.lastmod,
      changefreq: route.changefreq,
      priority: route.priority,
    });
  }

  for (const route of databaseRoutes) {
    const normalizedPath = route.path.startsWith('/') ? route.path : `/${route.path}`;
    const existing = routeMap.get(normalizedPath);
    routeMap.set(normalizedPath, {
      loc: `${siteUrl}${normalizedPath}`,
      lastmod: route.lastmod || existing?.lastmod,
      changefreq: route.changefreq,
      priority: route.priority,
    });
  }

  const xmlEntries = [...routeMap.values()].map((route) => {
    const lastmod = route.lastmod ? `\n    <lastmod>${escapeXml(route.lastmod)}</lastmod>` : '';
    return `  <url>\n    <loc>${escapeXml(route.loc)}</loc>${lastmod}\n    <changefreq>${route.changefreq}</changefreq>\n    <priority>${route.priority}</priority>\n  </url>`;
  }).join('\n');

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${xmlEntries}\n</urlset>\n`;
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), sitemapXml, 'utf-8');
  fs.writeFileSync(path.join(publicDir, 'robots.txt'), generateRobotsTxt(siteUrl), 'utf-8');

  console.log(`[sitemap] Generated ${routeMap.size} unique canonical URLs (${databaseRoutes.length} database routes included).`);
  console.log(`[robots] Generated robots.txt pointing to ${siteUrl}/sitemap.xml.`);
}

main().catch((error) => {
  console.error('[sitemap] Generation failed:', error instanceof Error ? error.message : 'Unknown error');
  process.exitCode = 1;
});
