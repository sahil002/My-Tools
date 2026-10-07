import type { IncomingMessage, ServerResponse } from 'http';
import crypto from 'crypto';
import {
  getAuthenticatedAdminFromRequest,
  parseJsonBody,
  sendJson,
} from '../_lib/adminAuthServer';
import { getSupabaseAdminClient } from '../_lib/supabaseServer';

const BUCKET = 'custom-tools';
const MAX_HTML_SIZE = 24 * 1024 * 1024;

function cleanSlug(value: unknown): string {
  return String(value || '').trim().toLowerCase();
}

function validSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 120;
}

function normalizeArray(value: unknown): string[] {
  return Array.isArray(value) ? value.map((v) => String(v).trim()).filter(Boolean) : [];
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const admin = getAuthenticatedAdminFromRequest(req);
  if (!admin) {
    return sendJson(res, 401, { success: false, error: 'Authentication required.' });
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return sendJson(res, 500, {
      success: false,
      error: 'Server Supabase configuration is incomplete. SUPABASE_SERVICE_ROLE_KEY is required.',
    });
  }

  try {
    if (req.method === 'POST') {
      const body = await parseJsonBody<any>(req);
      const action = body?.action;

      if (action === 'create-upload') {
        const slug = cleanSlug(body?.slug);
        const isEditing = Boolean(body?.isEditing);

        if (!validSlug(slug)) {
          return sendJson(res, 400, { success: false, error: 'Invalid tool slug.' });
        }

        const { data: existing, error: existingError } = await supabase
          .from('tools')
          .select('id, slug, is_custom, storage_path')
          .eq('slug', slug)
          .maybeSingle();

        if (existingError) throw existingError;

        if (existing && !isEditing) {
          return sendJson(res, 409, { success: false, error: 'A tool with this slug already exists.' });
        }

        if (existing && !existing.is_custom && isEditing) {
          return sendJson(res, 409, { success: false, error: 'Built-in tools cannot be replaced by custom uploads.' });
        }

        const version = `${Date.now()}-${crypto.randomUUID()}`;
        const path = `${slug}/${version}/index.html`;
        const { data, error } = await supabase.storage.from(BUCKET).createSignedUploadUrl(path);

        if (error || !data?.token) {
          throw error || new Error('Failed to create signed upload URL.');
        }

        return sendJson(res, 200, {
          success: true,
          path,
          token: data.token,
          previousStoragePath: existing?.storage_path || null,
        });
      }

      if (action === 'finalize') {
        const slug = cleanSlug(body?.slug);
        const storagePath = String(body?.storagePath || '').trim();
        const isEditing = Boolean(body?.isEditing);

        if (!validSlug(slug) || !storagePath.startsWith(`${slug}/`) || !storagePath.endsWith('/index.html')) {
          return sendJson(res, 400, { success: false, error: 'Invalid tool storage path.' });
        }

        const { data: existing, error: existingError } = await supabase
          .from('tools')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();

        if (existingError) throw existingError;
        if (existing && !existing.is_custom) {
          return sendJson(res, 409, { success: false, error: 'Cannot finalize a custom bundle over a built-in tool.' });
        }
        if (existing && !isEditing && existing.is_custom) {
          return sendJson(res, 409, { success: false, error: 'A custom tool with this slug already exists.' });
        }

        const folder = storagePath.substring(0, storagePath.lastIndexOf('/'));
        const { data: files, error: listError } = await supabase.storage.from(BUCKET).list(folder, {
          search: 'index.html',
          limit: 10,
        });

        if (listError) throw listError;

        const uploaded = (files || []).find((file: any) => file.name === 'index.html');
        const uploadedSize = Number(uploaded?.metadata?.size || 0);

        if (!uploaded || !uploadedSize || uploadedSize > MAX_HTML_SIZE) {
          await supabase.storage.from(BUCKET).remove([storagePath]).catch(() => {});
          return sendJson(res, 400, {
            success: false,
            error: 'Uploaded tool bundle could not be verified or exceeds the 24 MB deployment limit.',
          });
        }

        const now = new Date().toISOString();
        const row = {
          id: existing?.id,
          slug,
          name: String(body?.name || '').trim(),
          description: String(body?.description || '').trim(),
          category: String(body?.category || 'calculators').trim(),
          icon: String(body?.iconName || 'Wrench').trim(),
          is_active: Boolean(body?.status === 'active'),
          is_featured: Boolean(body?.featured),
          tags: normalizeArray(body?.keywords),
          usage_count: Number(existing?.usage_count || 0),
          favorite_count: Number(existing?.favorite_count || 0),
          long_description: body?.longDescription ? String(body.longDescription) : null,
          seo_title: body?.seoTitle ? String(body.seoTitle) : null,
          seo_description: body?.seoDescription ? String(body.seoDescription) : null,
          thumbnail_url: body?.thumbnailUrl ? String(body.thumbnailUrl) : null,
          storage_path: storagePath,
          entry_html_path: 'index.html',
          zip_file_name: body?.zipFileName ? String(body.zipFileName) : null,
          zip_file_size: Number(body?.zipFileSize || 0),
          files_count: Number(body?.filesCount || 1),
          is_custom: true,
          updated_at: now,
          ...(existing?.created_at ? {} : { created_at: now }),
        };

        const { error: upsertError } = await supabase
          .from('tools')
          .upsert(row, { onConflict: 'slug' });

        if (upsertError) {
          await supabase.storage.from(BUCKET).remove([storagePath]).catch(() => {});
          throw upsertError;
        }

        if (existing?.storage_path && existing.storage_path !== storagePath) {
          await supabase.storage.from(BUCKET).remove([existing.storage_path]).catch((cleanupError) => {
            console.warn('[ToolUpload] Old bundle cleanup failed:', cleanupError);
          });
        }

        return sendJson(res, 200, {
          success: true,
          slug,
          storagePath,
          size: uploadedSize,
        });
      }

      return sendJson(res, 400, { success: false, error: 'Unsupported upload action.' });
    }

    if (req.method === 'GET') {
      const url = new URL(req.url || '/', 'http://localhost');
      const slug = cleanSlug(url.searchParams.get('slug'));

      let query = supabase.from('tools').select('*').eq('is_custom', true).order('name', { ascending: true });
      if (slug) query = query.eq('slug', slug);

      const { data, error } = await query;
      if (error) throw error;

      const tools = (data || []).map((row: any) => {
        const publicUrl = row.storage_path
          ? supabase.storage.from(BUCKET).getPublicUrl(row.storage_path).data.publicUrl
          : undefined;

        return {
          ...row,
          storage_url: publicUrl,
        };
      });

      return sendJson(res, 200, { success: true, tools });
    }

    if (req.method === 'PATCH' || req.method === 'DELETE') {
      const body = await parseJsonBody<any>(req);
      const slug = cleanSlug(body?.slug || body?.id);

      if (!validSlug(slug)) {
        return sendJson(res, 400, { success: false, error: 'Valid tool slug is required.' });
      }

      const { data: existing, error: existingError } = await supabase
        .from('tools')
        .select('id, slug, is_custom, storage_path')
        .eq('slug', slug)
        .maybeSingle();

      if (existingError) throw existingError;
      if (!existing) return sendJson(res, 404, { success: false, error: 'Tool not found.' });

      if (req.method === 'PATCH') {
        if (typeof body?.is_active !== 'boolean') {
          return sendJson(res, 400, { success: false, error: 'is_active must be a boolean.' });
        }

        const { error } = await supabase
          .from('tools')
          .update({ is_active: body.is_active, updated_at: new Date().toISOString() })
          .eq('slug', slug);

        if (error) throw error;
        return sendJson(res, 200, { success: true, slug, is_active: body.is_active });
      }

      if (!existing.is_custom) {
        return sendJson(res, 409, { success: false, error: 'Built-in tools cannot be deleted from this endpoint.' });
      }

      if (existing.storage_path) {
        await supabase.storage.from(BUCKET).remove([existing.storage_path]).catch((cleanupError) => {
          console.warn('[ToolDelete] Storage cleanup failed:', cleanupError);
        });
      }

      const { error: deleteError } = await supabase.from('tools').delete().eq('slug', slug);
      if (deleteError) throw deleteError;

      return sendJson(res, 200, { success: true, slug });
    }

    return sendJson(res, 405, { success: false, error: 'Method not allowed.' });
  } catch (error: any) {
    console.error('[AdminToolsAPI]', error);
    return sendJson(res, 500, {
      success: false,
      error: error?.message || 'Unexpected server error.',
    });
  }
}
