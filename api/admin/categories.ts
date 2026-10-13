import type { IncomingMessage, ServerResponse } from 'http';
import {
  getAuthenticatedAdminFromRequest,
  parseJsonBody,
  sendJson,
} from '../_lib/adminAuthServer.js';
import { getSupabaseServerClient } from '../_lib/supabaseServer.js';

function cleanSlug(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

function validSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 120;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST' && req.method !== 'DELETE') {
    res.setHeader('Allow', 'POST, DELETE');
    return sendJson(res, 405, { success: false, error: 'Method not allowed.' });
  }

  if (!getAuthenticatedAdminFromRequest(req)) {
    return sendJson(res, 401, { success: false, error: 'Authentication required.' });
  }

  const db = getSupabaseServerClient(true);
  if (!db) return sendJson(res, 503, { success: false, error: 'Secure database configuration is missing.' });

  try {
    if (req.method === 'DELETE') {
      const body = await parseJsonBody<{ slug?: string }>(req);
      const slug = cleanSlug(body?.slug);
      if (!validSlug(slug)) return sendJson(res, 400, { success: false, error: 'Invalid category slug.' });
      const { error } = await db.from('categories').delete().eq('slug', slug);
      if (error) {
        console.error('[AdminCategoriesAPI] Delete failed:', error.message);
        return sendJson(res, 500, { success: false, error: 'Unable to delete category.' });
      }
      return sendJson(res, 200, { success: true });
    }

    const body = await parseJsonBody<{
      id?: string; slug?: string; name?: string; description?: string; icon?: string; iconName?: string;
      seoTitle?: string; seoDescription?: string; toolCount?: number; faq?: unknown[];
    }>(req);
    const slug = cleanSlug(body?.slug);
    const name = String(body?.name || '').trim();
    if (!validSlug(slug) || name.length < 1 || name.length > 120) {
      return sendJson(res, 400, { success: false, error: 'Valid category name and slug are required.' });
    }

    const row = {
      slug,
      name,
      description: String(body?.description || '').slice(0, 2000),
      icon: String(body?.icon || body?.iconName || 'Wrench').slice(0, 80),
      seo_title: String(body?.seoTitle || '').slice(0, 180) || null,
      seo_description: String(body?.seoDescription || '').slice(0, 320) || null,
      tool_count: Math.max(0, Math.min(1000000, Number(body?.toolCount || 0))),
      faq: Array.isArray(body?.faq) ? body.faq : null,
      updated_at: new Date().toISOString(),
    };
    const { error } = await db.from('categories').upsert(row, { onConflict: 'slug' });
    if (error) {
      console.error('[AdminCategoriesAPI] Save failed:', error.message);
      return sendJson(res, 500, { success: false, error: 'Unable to save category.' });
    }
    return sendJson(res, 200, { success: true, category: row });
  } catch (error: any) {
    console.error('[AdminCategoriesAPI] Request failed:', error?.message || error);
    return sendJson(res, 400, { success: false, error: 'Invalid category request.' });
  }
}
