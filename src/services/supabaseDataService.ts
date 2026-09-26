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
          message: 'Connected to Supabase, but tables are not created yet. Please run the schema.sql in Supabase SQL Editor.',
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
      is_active: true,
      is_featured: t.popular || false,
      usage_count: 0,
      favorite_count: 0,
      tags: t.keywords || [],
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

    // Merge Supabase active status & stats into existing rich tool registry
    const toolMap = new Map(TOOLS.map((t) => [t.slug, t]));
    return data.map((row) => {
      const existing = toolMap.get(row.slug);
      if (existing) {
        return {
          ...existing,
          popular: row.is_featured,
          description: row.description || existing.description,
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
