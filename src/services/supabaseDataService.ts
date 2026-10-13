import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { TOOLS } from '../data/tools';
import { ToolItem } from '../types';

export interface SupabaseToolRecord {
  id?: string;
  slug: string;
  name: string;
  description: string;
  category: string;
  icon?: string;
  is_active: boolean;
  is_featured: boolean;
  tags?: string[];
  usage_count: number;
  favorite_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface SupabaseToolRequest {
  id: string;
  tool_name: string;
  category?: string;
  email?: string;
  use_case: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-review' | 'planned' | 'completed' | 'declined';
  admin_notes?: string;
  created_at: string;
}

export interface SupabaseToolComment {
  id: string;
  tool_slug: string;
  author_name: string;
  author_email?: string;
  comment: string;
  rating?: number;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

/**
 * Checks connection health with the Supabase database
 */
export async function testSupabaseConnection(): Promise<{ success: boolean; message: string; details?: any }> {
  if (!isSupabaseConfigured() || !supabase) {
    return {
      success: false,
      message: 'Supabase environment variables (VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY) are not configured.',
    };
  }

  try {
    const { data, error } = await supabase.from('tools').select('id, slug').limit(1);
    if (error) {
      if (error.code === '42P01') {
        return {
          success: false,
          message: 'Connected to Supabase, but tables are not created yet. Please run schema.sql in Supabase SQL Editor.',
          details: error,
        };
      }
      return {
        success: false,
        message: `Supabase query error: ${error.message}`,
        details: error,
      };
    }
    return {
      success: true,
      message: 'Successfully connected to Supabase database!',
      details: { foundToolsCount: data?.length || 0 },
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Failed to contact Supabase: ${err?.message || 'Network error'}`,
    };
  }
}

/**
 * Synchronizes tools to Supabase database (Seeds existing catalogue)
 */
export async function seedToolsToSupabase(): Promise<{ success: boolean; count: number; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) return { success: false, count: 0, error: 'Supabase is not configured' };
  try {
    const rows = TOOLS.map((t) => ({
      slug: t.slug, name: t.name, description: t.description, category: t.category,
      icon: t.iconName, is_active: t.status !== 'inactive', is_featured: t.popular || false,
      usage_count: 0, favorite_count: 0, tags: t.keywords || [],
    }));
    const response = await fetch('/api/admin/tools-db', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ action: 'seed', rows }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload?.success) return { success: false, count: 0, error: payload?.error || 'Unable to sync tool catalogue.' };
    return { success: true, count: Number(payload.count || rows.length) };
  } catch (error: any) {
    return { success: false, count: 0, error: error?.message || 'Unable to sync tool catalogue.' };
  }
}

/**
 * Fetches all tools from Supabase, or falls back to local tools list
 */
export async function getToolsWithSupabaseFallback(): Promise<ToolItem[]> {
  if (!isSupabaseConfigured() || !supabase) {
    return TOOLS;
  }

  try {
    const { data, error } = await supabase
      .from('tools')
      .select('id, slug, name, description, category, icon, is_active, is_featured, tags, usage_count, favorite_count, created_at, updated_at, long_description, seo_title, seo_description, thumbnail_url, is_custom')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error || !data || data.length === 0) {
      return TOOLS;
    }

    const toolMap = new Map(TOOLS.map((t) => [t.slug, t]));
    return data.map((row) => {
      const existing = toolMap.get(row.slug);
      if (existing) {
        return {
          ...existing,
          name: row.name || existing.name,
          popular: Boolean(row.is_featured),
          featured: Boolean(row.is_featured),
          description: row.description || existing.description,
          status: (row.is_active ? 'active' : 'inactive') as 'active' | 'coming-soon' | 'inactive',
          category: (row.category || existing.category) as any,
          keywords: row.tags?.length ? row.tags : existing.keywords,
        };
      }
      return {
        id: row.slug,
        slug: row.slug,
        name: row.name,
        category: (row.category || 'calculators') as any,
        description: row.description,
        iconName: row.icon || 'Wrench',
        featured: Boolean(row.is_featured),
        popular: Boolean(row.is_featured),
        keywords: row.tags || [],
        status: (row.is_active ? 'active' : 'inactive') as 'active' | 'coming-soon' | 'inactive',
        relatedTools: [],
        relatedGuides: [],
        howToUse: ['Enter inputs to calculate results.'],
        conceptExplanation: row.description,
      };
    });
  } catch {
    return TOOLS;
  }
}

/**
 * Updates a tool in Supabase
 */
export async function updateToolInSupabase(
  slug: string,
  updates: Partial<SupabaseToolRecord>
): Promise<{ success: boolean; error?: string }> {
  if (!isSupabaseConfigured() || !supabase) return { success: false, error: 'Supabase is not configured.' };
  try {
    const response = await fetch('/api/admin/tools-db', {
      method: 'POST', credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ action: 'update', slug, updates }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload?.success) return { success: false, error: payload?.error || 'Unable to update tool.' };
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error?.message || 'Unable to update tool.' };
  }
}
// ----------------------------------------------------------------------------
// TOOL REQUESTS
// ----------------------------------------------------------------------------

export async function fetchToolRequests(): Promise<SupabaseToolRequest[]> {
  try {
    const response = await fetch('/api/admin/moderation?type=requests', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
    if (response.ok) {
      const payload = await response.json();
      if (payload?.success && Array.isArray(payload.items)) return payload.items as SupabaseToolRequest[];
    }
  } catch { /* local fallback below */ }
  try { const stored = localStorage.getItem('ot_local_tool_requests'); return stored ? JSON.parse(stored) : []; } catch { return []; }
}

export async function submitToolRequest(request: {
  tool_name: string;
  category?: string;
  email?: string;
  use_case: string;
  priority?: 'low' | 'medium' | 'high';
}): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase.from('tool_requests').insert({
        tool_name: request.tool_name,
        category: request.category || 'General',
        email: request.email || null,
        use_case: request.use_case,
        priority: request.priority || 'medium',
        status: 'pending',
      });

      if (!error) return { success: true };
    } catch (err: any) {
      console.warn('[ToolRequest] Supabase insert failed:', err);
    }
  }

  // Local fallback
  try {
    const existing = await fetchToolRequests();
    const newReq: SupabaseToolRequest = {
      id: `req-${Date.now()}`,
      tool_name: request.tool_name,
      category: request.category,
      email: request.email,
      use_case: request.use_case,
      priority: request.priority || 'medium',
      status: 'pending',
      created_at: new Date().toISOString(),
    };
    localStorage.setItem('ot_local_tool_requests', JSON.stringify([newReq, ...existing]));
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateToolRequestStatus(id: string, status: SupabaseToolRequest['status'], notes?: string): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/admin/moderation', {
      method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ action: 'update-request', id, status, notes }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload?.success) return { success: false, error: payload?.error || 'Unable to update request.' };
    return { success: true };
  } catch (error: any) { return { success: false, error: error?.message || 'Unable to update request.' }; }
}

export async function deleteToolRequest(id: string): Promise<{ success: boolean }> {
  try {
    const response = await fetch('/api/admin/moderation', {
      method: 'DELETE', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ kind: 'requests', id }),
    });
    const payload = await response.json().catch(() => ({}));
    return { success: Boolean(response.ok && payload?.success) };
  } catch { return { success: false }; }
}

export async function fetchToolComments(toolSlug?: string): Promise<SupabaseToolComment[]> {
  try {
    const adminResponse = await fetch('/api/admin/moderation?type=comments', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
    if (adminResponse.ok) {
      const payload = await adminResponse.json();
      if (payload?.success && Array.isArray(payload.items)) {
        const all = payload.items as SupabaseToolComment[];
        return toolSlug ? all.filter((comment) => comment.tool_slug === toolSlug) : all;
      }
    }
  } catch { /* anonymous public fallback below */ }
  try {
    const url = new URL('/api/public-comments', window.location.origin);
    if (toolSlug) url.searchParams.set('tool_slug', toolSlug);
    const response = await fetch(url.toString(), { headers: { Accept: 'application/json' } });
    if (!response.ok) return [];
    const payload = await response.json();
    return payload?.success && Array.isArray(payload.items) ? payload.items as SupabaseToolComment[] : [];
  } catch { return []; }
}

export async function submitToolComment(comment: { tool_slug: string; author_name: string; author_email?: string; comment: string; rating?: number }): Promise<{ success: boolean; error?: string }> {
  try {
    const response = await fetch('/api/public-comments', {
      method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(comment),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload?.success) return { success: false, error: payload?.error || 'Unable to submit comment.' };
    return { success: true };
  } catch (error: any) { return { success: false, error: error?.message || 'Unable to submit comment.' }; }
}

export async function updateToolCommentStatus(id: string, status: SupabaseToolComment['status']): Promise<{ success: boolean }> {
  try {
    const response = await fetch('/api/admin/moderation', {
      method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ action: 'update-comment', id, status }),
    });
    const payload = await response.json().catch(() => ({}));
    return { success: Boolean(response.ok && payload?.success) };
  } catch { return { success: false }; }
}

export async function deleteToolComment(id: string): Promise<{ success: boolean }> {
  try {
    const response = await fetch('/api/admin/moderation', {
      method: 'DELETE', credentials: 'same-origin', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ kind: 'comments', id }),
    });
    const payload = await response.json().catch(() => ({}));
    return { success: Boolean(response.ok && payload?.success) };
  } catch { return { success: false }; }
}

export async function fetchSiteSettingsFromSupabase(): Promise<any | null> {
  if (!isSupabaseConfigured() || !supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', 'global_site_settings')
      .maybeSingle();

    if (!error && data?.value) {
      return data.value;
    }
  } catch {
    // ignore
  }
  return null;
}

export async function saveSiteSettingsToSupabase(settings: any): Promise<boolean> {
  if (!isSupabaseConfigured() || !supabase) return false;
  try {
    const response = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ settings }),
    });
    if (!response.ok) return false;
    const payload = await response.json().catch(() => ({}));
    return Boolean(payload?.success);
  } catch {
    return false;
  }
}
