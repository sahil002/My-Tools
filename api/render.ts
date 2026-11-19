import type { IncomingMessage, ServerResponse } from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { render } from '../dist/server/entry-server.js';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const requestUrl = new URL(req.url || '/', 'https://www.prbsolver.com');
    const requestedPath = requestUrl.searchParams.get('path') || requestUrl.pathname || '/';
    const routePath = requestedPath.startsWith('/') ? requestedPath : `/${requestedPath}`;
    const { html } = render(routePath);
    const templatePath = path.join(process.cwd(), 'dist', 'index.html');
    const template = await readFile(templatePath, 'utf8');
    const output = template.replace('<div id="root"></div>', `<div id="root">${html}</div>`);
    const isPrivate = routePath.startsWith('/admin') || routePath.startsWith('/panel-access');
    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', isPrivate ? 'no-store' : 'public, s-maxage=60, stale-while-revalidate=300');
    if (isPrivate) res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
    res.end(output);
  } catch (error) {
    console.error('[ssr] render failed:', error);
    res.statusCode = 500;
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.end('Page rendering failed.');
  }
}
