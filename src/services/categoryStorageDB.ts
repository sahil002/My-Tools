import { CategoryInfo } from '../types';


const STORAGE_KEY = 'onlinetools_categories_custom_v1';

export const CATEGORIES_UPDATED_EVENT = 'onlinetools_categories_updated';

/**
 * Refresh public categories from the shared Supabase-backed API.
 * Browser storage remains a cache only; it is not the cross-device source of truth.
 */
export async function syncCategoriesFromSupabase(includeHidden = false): Promise<{ success: boolean; count: number; error?: string }> {
  if (typeof window === 'undefined') return { success: false, count: 0, error: 'Browser environment required.' };

  try {
    const response = await fetch(includeHidden ? '/api/admin/categories' : '/api/public-categories', {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
    });

    if (!response.ok) {
      return { success: false, count: 0, error: `Public categories request failed: ${response.status}` };
    }

    const payload = await response.json();
    if (!payload?.success || !Array.isArray(payload.categories)) {
      return { success: false, count: 0, error: 'Invalid public categories response.' };
    }

    const cached = getAllCategoriesFromStorage();
    const cachedBySlug = new Map(cached.map((category) => [String(category.slug || '').toLowerCase(), category]));
    const categories: CategoryInfo[] = payload.categories
      .filter((row: any) => row && typeof row.slug === 'string' && typeof row.name === 'string')
      .map((row: any) => {
        const slug = String(row.slug).trim().toLowerCase();
        const previous = cachedBySlug.get(slug);
        return {
          id: String(row.id || previous?.id || slug),
          name: String(row.name),
          slug,
          parentCategoryId: row.parent_category_id ? String(row.parent_category_id) : null,
          description: String(row.description || ''),
          iconName: String(row.icon || row.icon_name || previous?.iconName || 'Grid2X2'),
          iconMode: row.icon_mode === 'manual' || previous?.iconMode === 'manual' ? 'manual' : 'auto',
          seoTitle: String(row.seo_title || row.seoTitle || previous?.seoTitle || `${row.name} – Free Online Tools`),
          seoDescription: String(row.seo_description || row.seoDescription || previous?.seoDescription || row.description || ''),
          toolCount: Number(row.tool_count ?? previous?.toolCount ?? 0),
          isVisible: row.is_visible !== false,
          ...(Array.isArray(row.faq) ? { faq: row.faq } : previous?.faq ? { faq: previous.faq } : {}),
        };
      })
      .sort((left: CategoryInfo, right: CategoryInfo) => left.name.localeCompare(right.name));

    localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
    window.dispatchEvent(new CustomEvent(CATEGORIES_UPDATED_EVENT));
    return { success: true, count: categories.length };
  } catch (error: any) {
    console.warn('[Categories] Public sync failed; keeping cached categories:', error);
    return { success: false, count: 0, error: error?.message || 'Network error.' };
  }
}

// Empty default as requested by user ("sb tools or category ko khtm kr do lkn sections rehny chaiya hum new sy dashbaord sy new category bnay gy")
// No seeded categories: administrators create real categories from the dashboard.
export const DEFAULT_TEMPLATE_CATEGORIES: CategoryInfo[] = [];

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

  // Persist through the authenticated server API; never grant public clients category writes.
  try {
    const response = await fetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(cat),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload?.error || `Category save failed: ${response.status}`);
    }
  } catch (err) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(categories));
      window.dispatchEvent(new CustomEvent(CATEGORIES_UPDATED_EVENT));
    }
    console.error('[Categories] Secure server save failed:', err);
    throw err;
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

  try {
    const response = await fetch('/api/admin/categories', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ slug: idOrSlug }),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload?.error || `Category delete failed: ${response.status}`);
    }
  } catch (err) {
    console.error('[Categories] Secure server delete failed:', err);
    throw err;
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
