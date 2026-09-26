import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, Plugin} from 'vite';

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
    plugins: [react(), tailwindcss(), adminApiPlugin()],
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
