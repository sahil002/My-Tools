import { CategoryInfo } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const STORAGE_KEY = 'onlinetools_categories_custom_v1';
export const CATEGORIES_UPDATED_EVENT = 'onlinetools_categories_updated';

// Empty default as requested by user ("sb tools or category ko khtm kr do lkn sections rehny chaiya hum new sy dashbaord sy new category bnay gy")
export const DEFAULT_TEMPLATE_CATEGORIES: CategoryInfo[] = [
  {
    id: 'calculators',
    name: 'Calculators',
    slug: 'calculators',
    description: 'Online calculators for financial, mathematical, and everyday tasks.',
    iconName: 'Calculator',
    seoTitle: 'Online Calculators – Free Mathematical & Financial Tools',
    seoDescription: 'Free online calculators for percentages, loan EMIs, and daily computations.',
    toolCount: 0,
  },
  {
    id: 'text-tools',
    name: 'Text Tools',
    slug: 'text-tools',
    description: 'Text utilities for word counting, formatting, and character analysis.',
    iconName: 'FileText',
    seoTitle: 'Online Text Tools – Word Counter & Text Utilities',
    seoDescription: 'Free online text utilities for writers, editors, and students.',
    toolCount: 0,
  },
  {
    id: 'converters',
    name: 'Converters',
    slug: 'converters',
    description: 'Unit conversion utilities for measurement, currency, and data.',
    iconName: 'ArrowLeftRight',
    seoTitle: 'Unit Converters – Metric & Imperial Measurement Tools',
    seoDescription: 'Convert length, weight, temperature, and currency with accuracy.',
    toolCount: 0,
  },
  {
    id: 'developer-tools',
    name: 'Developer Tools',
    slug: 'developer-tools',
    description: 'Browser-based utilities and code helpers for programmers.',
    iconName: 'Code',
    seoTitle: 'Developer Tools – Code, JSON & Web Utilities',
    seoDescription: 'Format JSON, encode strings, and debug data with client-side security.',
    toolCount: 0,
  },
];

/**
 * Loads all categories from storage. Returns empty array if user cleared them.
 */
export function getAllCategoriesFromStorage(): CategoryInfo[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Initialize with empty array so user can add fresh categories from dashboard
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      return [];
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to read categories from localStorage', err);
    return [];
  }
}

/**
 * Saves or updates a category in localStorage and Supabase (if configured)
 */
export async function saveCategoryToStorage(cat: CategoryInfo): Promise<void> {
  const categories = getAllCategoriesFromStorage();
  const existingIdx = categories.findIndex((c) => c.id === cat.id || c.slug === cat.slug);

  let updated: CategoryInfo[];
  if (existingIdx >= 0) {
    updated = [...categories];
    updated[existingIdx] = { ...updated[existingIdx], ...cat };
  } else {
    updated = [...categories, cat];
  }

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(CATEGORIES_UPDATED_EVENT));
  }

  // Sync to Supabase in background
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('categories').upsert({
        slug: cat.slug,
        name: cat.name,
        description: cat.description,
        icon: cat.iconName || 'Wrench',
        created_at: new Date().toISOString(),
      }, { onConflict: 'slug' });
    } catch (err) {
      console.warn('[Categories] Supabase sync error:', err);
    }
  }
}

/**
 * Deletes a category by id or slug
 */
export async function deleteCategoryFromStorage(idOrSlug: string): Promise<void> {
  const categories = getAllCategoriesFromStorage();
  const updated = categories.filter((c) => c.id !== idOrSlug && c.slug !== idOrSlug);

  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent(CATEGORIES_UPDATED_EVENT));
  }

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase.from('categories').delete().eq('slug', idOrSlug);
    } catch {
      // ignore
    }
  }
}

/**
 * Helper to reset or seed template categories if user wishes
 */
export function seedTemplateCategories(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_TEMPLATE_CATEGORIES));
    window.dispatchEvent(new CustomEvent(CATEGORIES_UPDATED_EVENT));
  }
}

/**
 * Clear all categories to start 100% empty
 */
export function clearAllCategoriesFromStorage(): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    window.dispatchEvent(new CustomEvent(CATEGORIES_UPDATED_EVENT));
  }
}
