import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';

const root = process.cwd();
const distDir = path.join(root, 'dist');
const templatePath = path.join(distDir, 'index.html');
if (!fs.existsSync(templatePath)) throw new Error('dist/index.html is missing. Run vite build first.');

const routes = [
  '/', '/tools', '/categories', '/guides',
  '/guides/compound-interest-calculator-formula-and-examples',
  '/finance-business', '/image-tools', '/education',
  '/request-a-tool', '/about', '/contact', '/privacy-policy',
  '/terms', '/cookie-policy', '/sitemap',
];

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

  for (const route of routes) {
    const markup = renderPublicRoute(route);
    if (!markup || !markup.trim()) throw new Error(`SSR returned empty markup for ${route}`);

    const headTags = [...markup.matchAll(/<(title|meta|link|script)\\b[^>]*data-prb-head="true"[\\s\\S]*?(?:<\\/script>|>)/g)]
      .map((match) => match[0].replace(/\\sdata-prb-head="true"/, ''));
    const bodyMarkup = markup.replace(/<(title|meta|link|script)\\b[^>]*data-prb-head="true"[\\s\\S]*?(?:<\\/script>|>)/g, '');

    if (!bodyMarkup.includes('id="main-content"') && route !== '/guides/compound-interest-calculator-formula-and-examples') {
      // Some pages intentionally render without the shared main wrapper (e.g. legal or auth shells).
      if (!bodyMarkup.includes('<h1')) throw new Error(`SSR produced no meaningful page content for ${route}`);
    }
    if (route.startsWith('/guides/') && !bodyMarkup.includes('Compound Interest Calculator')) {
      throw new Error(`Guide content was not server-rendered for ${route}`);
    }

    let html = template
      .replace(/<title>PRBSolver[^<]*<\\/title>/, '')
      .replace(/<meta name="description"[^>]*>/, '')
      .replace(/<meta name="robots"[^>]*>/, '')
      .replace(/<!--[\\s\\S]*?Set the canonical from the requested route[\\s\\S]*?<\\/script>\\s*-->/, '')
      .replace('<div id="root"></div>', `<div id="root">${bodyMarkup}</div>`);

    html = html.replace('</head>', `${headTags.join('\\n')}\\n</head>`);
    const outputDir = route === '/' ? distDir : path.join(distDir, route.replace(/^\\//, ''));
    fs.mkdirSync(outputDir, { recursive: true });
    fs.writeFileSync(path.join(outputDir, 'index.html'), html, 'utf8');
    renderedCount += 1;
    console.log(`[prerender] ${route}`);
  }
  console.log(`[prerender] Successfully generated ${renderedCount} public HTML routes.`);
} finally {
  await server.close();
}
