import { TOOLS } from '../data/tools';
import { Tool } from '../types';

const STORAGE_KEY = 'ot_user_saved_favorites';
export const FAVORITES_UPDATED_EVENT = 'ot_favorites_updated';

// Default starter favorites for instant discovery
const DEFAULT_SEEDED_FAVORITES = [
  'loan-calculator',
  'percentage-calculator',
  'json-formatter',
];

export function getUserFavorites(): string[] {
  if (typeof window === 'undefined') return DEFAULT_SEEDED_FAVORITES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_SEEDED_FAVORITES));
      return DEFAULT_SEEDED_FAVORITES;
    }
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
  } catch {
    // fallback
  }
  return DEFAULT_SEEDED_FAVORITES;
}

export function isToolFavorited(toolIdOrSlug: string): boolean {
  const list = getUserFavorites();
  return list.includes(toolIdOrSlug);
}

export function toggleToolFavorite(toolIdOrSlug: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const list = getUserFavorites();
    const index = list.indexOf(toolIdOrSlug);
    let updated: string[];
    let isNowFavorited = false;

    if (index >= 0) {
      updated = list.filter((id) => id !== toolIdOrSlug);
      isNowFavorited = false;
    } else {
      updated = [...list, toolIdOrSlug];
      isNowFavorited = true;
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(FAVORITES_UPDATED_EVENT, { detail: { updated, toolIdOrSlug, isNowFavorited } }));
    return isNowFavorited;
  } catch {
    return false;
  }
}

export function getFavoritedTools(): Tool[] {
  const favIds = getUserFavorites();
  return TOOLS.filter((tool) => favIds.includes(tool.id) || favIds.includes(tool.slug));
}

export function clearAllFavorites(): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  window.dispatchEvent(new CustomEvent(FAVORITES_UPDATED_EVENT, { detail: { updated: [] } }));
}
