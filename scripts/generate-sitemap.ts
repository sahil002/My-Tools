import fs from 'fs';
import path from 'path';
import { generateSitemapXml, generateRobotsTxt, getAllSitemapRoutes } from '../src/data/sitemapData';
import { getSiteUrl } from '../src/data/siteConfig';

function main() {
  const publicDir = path.resolve(process.cwd(), 'public');
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const siteUrl = getSiteUrl();
  const routes = getAllSitemapRoutes(siteUrl);

  const sitemapXml = generateSitemapXml(siteUrl);
  const robotsTxt = generateRobotsTxt(siteUrl);

  const sitemapPath = path.join(publicDir, 'sitemap.xml');
  const robotsPath = path.join(publicDir, 'robots.txt');

  fs.writeFileSync(sitemapPath, sitemapXml, 'utf-8');
  fs.writeFileSync(robotsPath, robotsTxt, 'utf-8');

  console.log(`[sitemap] Generated sitemap.xml with ${routes.length} canonical URLs at ${sitemapPath}`);
  console.log(`[robots] Generated robots.txt pointing to ${siteUrl}/sitemap.xml at ${robotsPath}`);
}

main();
