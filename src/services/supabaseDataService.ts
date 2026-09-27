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
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, count: 0, error: 'Supabase is not configured' };
  }

  try {
    const rows = TOOLS.map((t) => ({
      slug: t.slug,
      name: t.name,
      description: t.description,
      category: t.category,
      icon: t.iconName,
      is_active: t.status !== 'inactive',
      is_featured: t.popular || false,
      usage_count: 0,
      favorite_count: 0,
      tags: t.keywords || [],
      updated_at: new Date().toISOString(),
    }));

    const { data, error } = await supabase
      .from('tools')
      .upsert(rows, { onConflict: 'slug' })
      .select('slug');

    if (error) {
      return { success: false, count: 0, error: error.message };
    }

    return { success: true, count: data?.length || rows.length };
  } catch (err: any) {
    return { success: false, count: 0, error: err.message };
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
      .select('*')
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
  if (!isSupabaseConfigured() || !supabase) {
    return { success: false, error: 'Supabase is not configured.' };
  }

  try {
    const { error } = await supabase
      .from('tools')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('slug', slug);

    if (error) {
      return { success: false, error: error.message };
    }
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

// ----------------------------------------------------------------------------
// TOOL REQUESTS
// ----------------------------------------------------------------------------

export async function fetchToolRequests(): Promise<SupabaseToolRequest[]> {
  if (!isSupabaseConfigured() || !supabase) {
    // Return sample local requests if Supabase not configured
    try {
      const stored = localStorage.getItem('ot_local_tool_requests');
      if (stored) return JSON.parse(stored);
    } catch {
      // ignore
    }
    return [];
  }

  try {
    const { data, error } = await supabase
      .from('tool_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error || !data) return [];
    return data as SupabaseToolRequest[];
  } catch {
    return [];
  }
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

export async function updateToolRequestStatus(
  id: string,
  status: SupabaseToolRequest['status'],
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase
        .from('tool_requests')
        .update({ status, admin_notes: notes })
        .eq('id', id);

      if (!error) return { success: true };
    } catch {
      // fallback
    }
  }

  // Local fallback
  try {
    const requests = await fetchToolRequests();
    const updated = requests.map((r) => (r.id === id ? { ...r, status, admin_notes: notes } : r));
    localStorage.setItem('ot_local_tool_requests', JSON.stringify(updated));
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function deleteToolRequest(id: string): Promise<{ success: boolean }> {
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('tool_requests').delete().eq('id', id);
    } catch {
      // ignore
    }
  }

  try {
    const requests = await fetchToolRequests();
    const filtered = requests.filter((r) => r.id !== id);
    localStorage.setItem('ot_local_tool_requests', JSON.stringify(filtered));
  } catch {
    // ignore
  }

  return { success: true };
}

// ----------------------------------------------------------------------------
// TOOL COMMENTS & REVIEWS
// ----------------------------------------------------------------------------

export async function fetchToolComments(toolSlug?: string): Promise<SupabaseToolComment[]> {
  if (!isSupabaseConfigured() || !supabase) {
    try {
      const stored = localStorage.getItem('ot_local_tool_comments');
      const all: SupabaseToolComment[] = stored ? JSON.parse(stored) : [];
      return toolSlug ? all.filter((c) => c.tool_slug === toolSlug) : all;
    } catch {
      return [];
    }
  }

  try {
    let query = supabase.from('tool_comments').select('*').order('created_at', { ascending: false });
    if (toolSlug) {
      query = query.eq('tool_slug', toolSlug);
    }
    const { data, error } = await query;
    if (error || !data) return [];
    return data as SupabaseToolComment[];
  } catch {
    return [];
  }
}

export async function submitToolComment(comment: {
  tool_slug: string;
  author_name: string;
  author_email?: string;
  comment: string;
  rating?: number;
}): Promise<{ success: boolean; error?: string }> {
  if (isSupabaseConfigured() && supabase) {
    try {
      const { error } = await supabase.from('tool_comments').insert({
        tool_slug: comment.tool_slug,
        author_name: comment.author_name,
        author_email: comment.author_email || null,
        comment: comment.comment,
        rating: comment.rating || 5,
        status: 'approved', // Auto-approved or set to pending for moderation
      });

      if (!error) return { success: true };
    } catch (err: any) {
      console.warn('[ToolComment] Supabase insert failed:', err);
    }
  }

  // Local fallback
  try {
    const existing = await fetchToolComments();
    const newComment: SupabaseToolComment = {
      id: `comment-${Date.now()}`,
      tool_slug: comment.tool_slug,
      author_name: comment.author_name,
      author_email: comment.author_email,
      comment: comment.comment,
      rating: comment.rating || 5,
      status: 'approved',
      created_at: new Date().toISOString(),
    };
    localStorage.setItem('ot_local_tool_comments', JSON.stringify([newComment, ...existing]));
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function updateToolCommentStatus(
  id: string,
  status: SupabaseToolComment['status']
): Promise<{ success: boolean }> {
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('tool_comments').update({ status }).eq('id', id);
    } catch {
      // ignore
    }
  }

  try {
    const comments = await fetchToolComments();
    const updated = comments.map((c) => (c.id === id ? { ...c, status } : c));
    localStorage.setItem('ot_local_tool_comments', JSON.stringify(updated));
  } catch {
    // ignore
  }

  return { success: true };
}

export async function deleteToolComment(id: string): Promise<{ success: boolean }> {
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('tool_comments').delete().eq('id', id);
    } catch {
      // ignore
    }
  }

  try {
    const comments = await fetchToolComments();
    const filtered = comments.filter((c) => c.id !== id);
    localStorage.setItem('ot_local_tool_comments', JSON.stringify(filtered));
  } catch {
    // ignore
  }

  return { success: true };
}

// ----------------------------------------------------------------------------
// SITE SETTINGS IN SUPABASE
// ----------------------------------------------------------------------------

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
  if (!isSupabaseConfigured() || !supabase) {
    return false;
  }

  try {
    const { error } = await supabase.from('site_settings').upsert(
      {
        key: 'global_site_settings',
        value: settings,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    );

    return !error;
  } catch {
    return false;
  }
}
