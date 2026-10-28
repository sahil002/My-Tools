import fs from 'node:fs';
import path from 'node:path';

const publicDir = path.resolve(process.cwd(), 'public');
const sitemapPath = path.join(publicDir, 'sitemap.xml');
const robotsPath = path.join(publicDir, 'robots.txt');

function fail(message: string): never {
  console.error(`[seo-check] FAIL: ${message}`);
  process.exitCode = 1;
  throw new Error(message);
}

if (!fs.existsSync(sitemapPath)) fail('public/sitemap.xml was not generated.');
if (!fs.existsSync(robotsPath)) fail('public/robots.txt was not generated.');

const xml = fs.readFileSync(sitemapPath, 'utf8');
const robots = fs.readFileSync(robotsPath, 'utf8');
if (!xml.includes('<?xml') || !xml.includes('<urlset') || !xml.includes('</urlset>')) {
  fail('Sitemap XML wrapper is missing or incomplete.');
}

const urls = [...xml.matchAll(/<loc>([\s\S]*?)<\/loc>/g)].map((match) => match[1].trim());
if (urls.length === 0) fail('Sitemap contains no URLs.');

const seen = new Set<string>();
for (const value of urls) {
  let parsed: URL;
  try {
    parsed = new URL(value);
  } catch {
    fail(`Invalid sitemap URL: ${value}`);
  }

  if (parsed!.origin !== 'https://www.prbsolver.com') {
    fail(`Non-canonical hostname or protocol in sitemap: ${value}`);
  }
  if (parsed!.search || parsed!.hash) fail(`Sitemap URL contains query/hash: ${value}`);
  if (parsed!.pathname !== '/' && parsed!.pathname.endsWith('/')) {
    fail(`Non-normalized trailing slash in sitemap path: ${value}`);
  }
  if (/^\/(admin|api)(\/|$)/i.test(parsed!.pathname)) {
    fail(`Private route must not be listed in sitemap: ${value}`);
  }
  if (parsed!.pathname === '/guides/compound-interest-calculator-best-7-steps-to-grow-your-money-in-2026') {
    fail('Legacy redirected guide URL must not be listed in sitemap.');
  }
  if (seen.has(value)) fail(`Duplicate sitemap URL: ${value}`);
  seen.add(value);
}

if (!robots.includes('Sitemap: https://www.prbsolver.com/sitemap.xml')) {
  fail('robots.txt does not point to the canonical sitemap URL.');
}
if (!robots.includes('Disallow: /admin') || !robots.includes('Disallow: /api/')) {
  fail('robots.txt is missing private-route exclusions.');
}

console.log(`[seo-check] PASS: ${urls.length} unique canonical URLs; robots.txt is present and points to the sitemap.`);
