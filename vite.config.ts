import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { generateSitemapXml, generateRobotsTxt } from './src/data/sitemapData';
import { getSiteUrl } from './src/data/siteConfig';
import {defineConfig, Plugin} from 'vite';


function sitemapPlugin(): Plugin {
  return {
    name: 'generate-sitemap',
    closeBundle() {
      const siteUrl = getSiteUrl();
      // Vite copies public/ into dist/ before closeBundle. Write the final
      // crawl files directly into dist so production always uses the
      // configured canonical site URL rather than a stale preview URL.
      const distDir = path.resolve(process.cwd(), 'dist');
      if (!fs.existsSync(distDir)) fs.mkdirSync(distDir, { recursive: true });
      fs.writeFileSync(path.join(distDir, 'sitemap.xml'), generateSitemapXml(siteUrl), 'utf-8');
      fs.writeFileSync(path.join(distDir, 'robots.txt'), generateRobotsTxt(siteUrl), 'utf-8');
    },
  };
}

function adminApiPlugin(): Plugin {
  return {
    name: 'admin-api-dev-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        const url = req.url?.split('?')[0];
        try {
          if (url === '/api/admin/login') {
            const handler = (await import('./api/admin/login')).default;
            return await handler(req as any, res as any);
          }
          if (url === '/api/admin/session') {
            const handler = (await import('./api/admin/session')).default;
            return await handler(req as any, res as any);
          }
          if (url === '/api/admin/logout') {
            const handler = (await import('./api/admin/logout')).default;
            return await handler(req as any, res as any);
          }
          if (url === '/api/admin/change-password') {
            const handler = (await import('./api/admin/change-password')).default;
            return await handler(req as any, res as any);
          }
          if (url === '/api/admin/data') {
            const handler = (await import('./api/admin/data')).default;
            return await handler(req as any, res as any);
          }
        } catch (err) {
          console.error('[admin-api-middleware] Error executing handler:', err);
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          return res.end(JSON.stringify({ error: 'Internal API Server Error' }));
        }
        next();
      });
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), adminApiPlugin(), sitemapPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(process.cwd(), '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
