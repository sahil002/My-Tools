import type { IncomingMessage, ServerResponse } from 'http';
import { getSupabaseServerClient } from './_lib/supabaseServer.js';

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=300');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(payload));
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendJson(res, 405, { success: false, error: 'Method not allowed.' });
  }

  // Use only the anonymous/public Supabase key. Never expose service-role data here.
  const supabase = getSupabaseServerClient(false);
  if (!supabase) {
    return sendJson(res, 503, { success: false, error: 'Public category data is temporarily unavailable.' });
  }

  try {
    const { data, error } = await supabase
      .from('categories')
      .select('id, slug, name, description, icon, created_at')
      .order('name', { ascending: true });

    if (error) {
      console.error('[PublicCategoriesAPI] Supabase query failed:', error.message);
      return sendJson(res, 503, { success: false, error: 'Public category data is temporarily unavailable.' });
    }

    const categories = (data || [])
      .filter((row) => typeof row.slug === 'string' && typeof row.name === 'string')
      .map((row) => ({
        id: row.id || row.slug,
        slug: row.slug,
        name: row.name,
        description: row.description || '',
        icon: row.icon || 'Wrench',
        createdAt: row.created_at || '',
      }));

    return sendJson(res, 200, { success: true, categories });
  } catch (error: any) {
    console.error('[PublicCategoriesAPI] Unexpected error:', error?.message || error);
    return sendJson(res, 503, { success: false, error: 'Public category data is temporarily unavailable.' });
  }
}
