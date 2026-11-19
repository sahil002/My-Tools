import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const templatePath = path.join(distDir, 'index.html');
if (!fs.existsSync(templatePath)) throw new Error('dist/index.html is missing. Run vite build first.');

const publicContentPath = path.join(root, 'src/generated/publicContent.json');
if (!fs.existsSync(publicContentPath)) throw new Error('Published Supabase content manifest is missing.');
const publicContent = JSON.parse(fs.readFileSync(publicContentPath, 'utf8')) as { categories: any[]; tools: any[]; guides: any[] };

const dynamicRoutes = [
  ...(publicContent.categories || []).filter((row) => row?.slug && row.is_visible !== false).map((row) => `/${row.slug}`),
  ...(publicContent.tools || []).filter((row) => row?.slug && row.is_active !== false).map((row) => {
    const category = (publicContent.categories || []).find((item) => item.id === row.category || item.slug === row.category || item.name === row.category);
    return category?.slug ? `/${category.slug}/${row.slug}` : `/${row.slug}`;
  }),
  ...(publicContent.guides || []).filter((row) => row?.slug && row.is_draft !== true && row.slug !== 'compound-interest-calculator-best-7-steps-to-grow-your-money-in-2026').map((row) => `/guides/${row.slug}`),
];

const routes = [
  '/', '/tools', '/categories', '/guides',
  '/guides/compound-interest-calculator-formula-and-examples',
  '/request-a-tool', '/about', '/contact', '/privacy-policy',
  '/terms', '/cookie-policy', '/sitemap',
  ...dynamicRoutes,
];
const uniqueRoutes = [...new Set(routes)];

const server = await createServer({
  configFile: path.join(root, 'vite.config.ts'),
  mode: 'production',
  appType: 'custom',
  server: { middlewareMode: true, hmr: false },
  logLevel: 'error',
});

try {
  const { renderPublicRoute } = await server.ssrLoadModule('/src/entry-server.tsx');
  const template = fs.readFileSync(templatePath, 'utf8');
  let renderedCount = 0;

  for (const route of uniqueRoutes) {
    const markup = renderPublicRoute(route);
    if (!markup || !markup.trim()) throw new Error(`SSR returned empty markup for ${route}`);

    const headPattern = /<title\b[^>]*>[\s\S]*?<\/title>|<(?:meta|link)\b[^>]*data-prb-head="true"[^>]*>|<script\b[^>]*data-prb-head="true"[^>]*>[\s\S]*?<\/script>/g;
    const headTags = [...markup.matchAll(headPattern)].map((match) => match[0].replace(/\sdata-prb-head="true"/, ''));
    const bodyMarkup = markup.replace(headPattern, '');

    if (!bodyMarkup.includes('id="main-content"') && route !== '/guides/compound-interest-calculator-formula-and-examples') {
      // Some pages intentionally render without the shared main wrapper (e.g. legal or auth shells).
      if (!bodyMarkup.includes('<h1')) throw new Error(`SSR produced no meaningful page content for ${route}`);
    }
    if (route.startsWith('/guides/')) {
      const slug = route.split('/')[2];
      const guide = (publicContent.guides || []).find((row) => String(row.slug || '').toLowerCase() === slug);
      const expectedTitle = guide?.title || (slug === 'compound-interest-calculator-formula-and-examples' ? 'Compound Interest Calculator' : '');
      if (!expectedTitle || !bodyMarkup.includes(String(expectedTitle).split(':')[0])) {
        throw new Error(`Guide content was not server-rendered for ${route}`);
      }
    }

    let html = template
      .replace(/<title>[\s\S]*?<\/title>/, '')
      .replace(/<meta name="description"[^>]*>/, '')
      .replace(/<meta name="robots"[^>]*>/, '')
      .replace(/<script>\s*\(function \(\) \{[\s\S]*?\}\)\(\);\s*<\/script>/, '')
      .replace(/<meta property="og:(?:type|title|description|url)"[^>]*>/g, '')
      .replace(/<meta name="twitter:(?:card|title|description)"[^>]*>/g, '')
      .replace('<div id="root"></div>', `<div id="root">${bodyMarkup}</div>`);

    html = html.replace('</head>', `${headTags.join('\n')}\n</head>`);
    const outputDir = route === '/' ? distDir : path.join(distDir, route.replace(/^\//, ''));
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, 'index.html'), html, 'utf8');
    renderedCount += 1;
    console.log(`[prerender] ${route}`);
  }
  console.log(`[prerender] Successfully generated ${renderedCount} public HTML routes, including ${dynamicRoutes.length} Supabase routes.`);
} finally {
  await server.close();
}
