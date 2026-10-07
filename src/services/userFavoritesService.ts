import { TOOLS } from '../data/tools';
import { Tool } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const STORAGE_KEY = 'ot_user_saved_favorites';
const VISITOR_KEY = 'ot_favorites_visitor_id';
export const FAVORITES_UPDATED_EVENT = 'ot_favorites_updated';

function getVisitorId(): string {
  if (typeof window === 'undefined') return '';
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : 'visitor_' + Date.now() + '_' + Math.random().toString(36).slice(2);
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

/** User favorites are empty by default. No seeded/demo favorites are used. */
export function getUserFavorites(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch { return []; }
}

export function isToolFavorited(toolIdOrSlug: string): boolean { return getUserFavorites().includes(toolIdOrSlug); }

export function toggleToolFavorite(toolIdOrSlug: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const list = getUserFavorites();
    const index = list.indexOf(toolIdOrSlug);
    const isNowFavorited = index < 0;
    const updated = isNowFavorited ? [...list, toolIdOrSlug] : list.filter((id) => id !== toolIdOrSlug);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(FAVORITES_UPDATED_EVENT, { detail: { updated, toolIdOrSlug, isNowFavorited } }));
    if (isSupabaseConfigured() && supabase) {
      const visitorId = getVisitorId();
      if (isNowFavorited) void supabase.from('tool_favorites').insert({ tool_slug: toolIdOrSlug, visitor_id: visitorId });
      else void supabase.from('tool_favorites').delete().eq('tool_slug', toolIdOrSlug).eq('visitor_id', visitorId);
    }
    return isNowFavorited;
  } catch { return false; }
}

export function getFavoritedTools(): Tool[] {
  const favIds = getUserFavorites();
  return TOOLS.filter((tool) => favIds.includes(tool.id) || favIds.includes(tool.slug));
}

export function clearAllFavorites(): void {
  if (typeof window === 'undefined') return;
  const current = getUserFavorites();
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  const visitorId = getVisitorId();
  if (isSupabaseConfigured() && supabase && visitorId) {
    for (const slug of current) void supabase.from('tool_favorites').delete().eq('tool_slug', slug).eq('visitor_id', visitorId);
  }
  window.dispatchEvent(new CustomEvent(FAVORITES_UPDATED_EVENT, { detail: { updated: [] } }));
}