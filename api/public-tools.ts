import type { IncomingMessage, ServerResponse } from 'http';
import { getSupabaseServerClient } from './_lib/supabaseServer.js';

const BUCKET = 'custom-tools';

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60, stale-while-revalidate=300');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.end(JSON.stringify(payload));
}

function cleanSlug(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return sendJson(res, 405, { success: false, error: 'Method not allowed.' });
  }

  const url = new URL(req.url || '/', 'http://localhost');
  const slug = cleanSlug(url.searchParams.get('slug'));
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 120) {
    return sendJson(res, 400, { success: false, error: 'A valid tool slug is required.' });
  }

  // This endpoint intentionally uses the public/anonymous Supabase key only.
  // Never use the service-role client for unauthenticated public reads.
  const supabase = getSupabaseServerClient(false);
  if (!supabase) {
    return sendJson(res, 503, { success: false, error: 'Public tool data is temporarily unavailable.' });
  }

  try {
    const { data: row, error } = await supabase
      .from('tools')
      .select('id, slug, name, description, category, icon, is_active, is_featured, tags, created_at, updated_at, long_description, seo_title, seo_description, thumbnail_url, storage_path, entry_html_path, zip_file_name, zip_file_size, files_count, is_custom')
      .eq('slug', slug)
      .eq('is_custom', true)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('[PublicToolsAPI] Supabase query failed:', error.message);
      return sendJson(res, 503, { success: false, error: 'Public tool data is temporarily unavailable.' });
    }

    if (!row || !row.storage_path) {
      return sendJson(res, 404, { success: false, error: 'Tool not found.' });
    }

    const storageUrl = supabase.storage.from(BUCKET).getPublicUrl(row.storage_path).data.publicUrl;

    // Explicit allowlist: do not return arbitrary database columns or admin data.
    return sendJson(res, 200, {
      success: true,
      tool: {
        id: row.id || row.slug,
        slug: row.slug,
        name: row.name,
        description: row.description,
        category: row.category,
        iconName: row.icon || 'Wrench',
        featured: Boolean(row.is_featured),
        keywords: Array.isArray(row.tags) ? row.tags : [],
        status: 'active',
        isCustom: true,
        createdAt: row.created_at || '',
        updatedAt: row.updated_at || '',
        longDescription: row.long_description || undefined,
        seoTitle: row.seo_title || undefined,
        seoDescription: row.seo_description || undefined,
        thumbnailUrl: row.thumbnail_url || undefined,
        storagePath: row.storage_path,
        storageUrl,
        entryHtmlPath: row.entry_html_path || 'index.html',
        zipFileName: row.zip_file_name || undefined,
        zipFileSize: Number(row.zip_file_size || 0),
        filesCount: Number(row.files_count || 1),
      },
    });
  } catch (error: any) {
    console.error('[PublicToolsAPI] Unexpected error:', error?.message || error);
    return sendJson(res, 503, { success: false, error: 'Public tool data is temporarily unavailable.' });
  }
}
