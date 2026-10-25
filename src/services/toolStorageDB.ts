// IndexedDB storage manager for custom tools and embedded zip bundles

export interface DBToolRecord {
  id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  longDescription?: string;
  seoTitle?: string;
  seoDescription?: string;
  iconName: string;
  thumbnailUrl?: string;
  keywords: string[];
  featured: boolean;
  popular: boolean;
  status: 'active' | 'inactive';
  isCustom: boolean;
  createdAt: string;
  updatedAt: string;
  zipFileName?: string;
  zipFileSize?: number;
  filesCount?: number;
  entryHtmlPath: string;
  extractedHtml?: string; // Optional local admin cache of the self-contained HTML bundle
  storagePath?: string;
  storageUrl?: string;
  performance: {
    views: number;
    invocations: number;
    avgDurationSec: number;
    rating: number;
  };
}

export interface StatusOverrideRecord {
  toolId: string;
  status: 'active' | 'inactive';
  updatedAt: string;
}

const DB_NAME = 'online_tools_admin_db';
const DB_VERSION = 1;
const STORE_CUSTOM_TOOLS = 'custom_tools';
const STORE_STATUS_OVERRIDES = 'status_overrides';

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB is not supported in this environment.'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_CUSTOM_TOOLS)) {
        const store = db.createObjectStore(STORE_CUSTOM_TOOLS, { keyPath: 'id' });
        store.createIndex('slug', 'slug', { unique: true });
        store.createIndex('category', 'category', { unique: false });
      }

      if (!db.objectStoreNames.contains(STORE_STATUS_OVERRIDES)) {
        db.createObjectStore(STORE_STATUS_OVERRIDES, { keyPath: 'toolId' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

// Fallback to localStorage if IndexedDB is blocked in sandboxed environments
const LOCAL_STORAGE_CUSTOM_TOOLS_KEY = 'ot_custom_tools_fallback';
const LOCAL_STORAGE_OVERRIDES_KEY = 'ot_tool_status_overrides';

function getLocalStorageTools(): DBToolRecord[] {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_CUSTOM_TOOLS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveLocalStorageTools(tools: DBToolRecord[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_CUSTOM_TOOLS_KEY, JSON.stringify(tools));
  } catch (err) {
    console.warn('LocalStorage save failed:', err);
  }
}

function getLocalStorageOverrides(): Record<string, 'active' | 'inactive'> {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_OVERRIDES_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

function saveLocalStorageOverrides(overrides: Record<string, 'active' | 'inactive'>): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_OVERRIDES_KEY, JSON.stringify(overrides));
  } catch (err) {
    console.warn('LocalStorage save failed:', err);
  }
}

// Global runtime memory cache so tools are immediately retrievable across all views
const toolMemoryCache = new Map<string, DBToolRecord>();

export async function getAllDBCustomTools(): Promise<DBToolRecord[]> {
  try {
    const db = await openDatabase();
    const idbTools: DBToolRecord[] = await new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_CUSTOM_TOOLS, 'readonly');
      const store = transaction.objectStore(STORE_CUSTOM_TOOLS);
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result || []);
      };
      request.onerror = () => {
        reject(request.error);
      };
    });

    const localTools = getLocalStorageTools();
    const map = new Map<string, DBToolRecord>();
    for (const t of localTools) {
      if (t.slug) map.set(t.slug.toLowerCase().trim(), t);
      if (t.id) map.set(t.id.toLowerCase().trim(), t);
    }
    for (const t of idbTools) {
      if (t.slug) map.set(t.slug.toLowerCase().trim(), t);
      if (t.id) map.set(t.id.toLowerCase().trim(), t);
    }
    // Also merge from memory cache
    for (const [k, t] of toolMemoryCache.entries()) {
      if (t.slug) map.set(t.slug.toLowerCase().trim(), t);
    }

    // Populate memory cache with unique list
    const uniqueTools = Array.from(new Set(map.values()));
    for (const t of uniqueTools) {
      if (t.slug) toolMemoryCache.set(t.slug.toLowerCase().trim(), t);
      if (t.id) toolMemoryCache.set(t.id.toLowerCase().trim(), t);
    }

    return uniqueTools;
  } catch {
    const fallback = getLocalStorageTools();
    for (const t of fallback) {
      if (t.slug) toolMemoryCache.set(t.slug.toLowerCase().trim(), t);
      if (t.id) toolMemoryCache.set(t.id.toLowerCase().trim(), t);
    }
    return fallback;
  }
}

export async function getDBCustomToolBySlug(slug: string): Promise<DBToolRecord | null> {
  // Supabase is the production source of truth; resolve each tool by its public slug.
  const normalizedSlug = String(slug || '').trim().toLowerCase();
  if (!normalizedSlug) return null;

  try {
    const response = await fetch(`/api/secure?route=public-tools&slug=${encodeURIComponent(normalizedSlug)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
    });
    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error(`Tool lookup failed: ${response.status}`);
    }

    const payload = await response.json();
    const row = payload?.tool;
    if (!payload?.success || !row || String(row.slug || '').toLowerCase() !== normalizedSlug) {
      return null;
    }

    const tool: DBToolRecord = {
      id: String(row.id || row.slug),
      name: String(row.name || ''),
      slug: String(row.slug),
      category: String(row.category || ''),
      description: String(row.description || ''),
      longDescription: row.long_description || undefined,
      seoTitle: row.seo_title || undefined,
      seoDescription: row.seo_description || undefined,
      iconName: String(row.icon || 'Wrench'),
      thumbnailUrl: row.thumbnail_url || undefined,
      keywords: Array.isArray(row.tags) ? row.tags : [],
      featured: Boolean(row.is_featured),
      popular: Boolean(row.is_featured),
      status: row.is_active ? 'active' : 'inactive',
      isCustom: Boolean(row.is_custom),
      createdAt: String(row.created_at || ''),
      updatedAt: String(row.updated_at || ''),
      zipFileName: row.zip_file_name || undefined,
      zipFileSize: Number(row.zip_file_size || 0),
      filesCount: Number(row.files_count || 1),
      entryHtmlPath: String(row.entry_html_path || 'index.html'),
      storagePath: row.storage_path || undefined,
      storageUrl: row.storage_url || undefined,
      performance: {
        views: Number(row.usage_count || 0),
        invocations: Number(row.usage_count || 0),
        avgDurationSec: 0,
        rating: 0,
      },
    };

    if (tool.slug) toolMemoryCache.set(tool.slug.toLowerCase().trim(), tool);
    if (tool.id) toolMemoryCache.set(tool.id.toLowerCase().trim(), tool);
    return tool;
  } catch (error) {
    console.warn('[CustomTools] Public tool lookup failed:', error);
    return null;
  }
}

export async function putDBCustomTool(tool: DBToolRecord): Promise<void> {
  const normalizedSlug = String(tool.slug || '').trim().toLowerCase();
  const normalizedId = String(tool.id || '').trim().toLowerCase();

  // Remove stale aliases for this tool from the memory cache. Older uploads may
  // have stored the slug as the primary id, while Supabase now returns a UUID.
  for (const [key, cached] of toolMemoryCache.entries()) {
    if (
      key === normalizedSlug ||
      key === normalizedId ||
      String(cached.slug || '').trim().toLowerCase() === normalizedSlug ||
      String(cached.id || '').trim().toLowerCase() === normalizedId
    ) {
      toolMemoryCache.delete(key);
    }
  }
  if (normalizedSlug) toolMemoryCache.set(normalizedSlug, tool);
  if (normalizedId) toolMemoryCache.set(normalizedId, tool);

  // Keep localStorage aligned with the canonical record. Match by either id or
  // slug because historical records may use a slug id while Supabase uses UUIDs.
  try {
    const current = getLocalStorageTools().filter((existing) => {
      const existingSlug = String(existing.slug || '').trim().toLowerCase();
      const existingId = String(existing.id || '').trim().toLowerCase();
      return existingSlug !== normalizedSlug && existingId !== normalizedId;
    });
    current.push(tool);
    saveLocalStorageTools(current);
  } catch (e) {
    console.warn('LocalStorage save failed for tool:', e);
  }

  // IndexedDB has a unique index on slug. Delete any stale record with the same
  // normalized slug (or id) in the same transaction before inserting the new
  // canonical row. This fixes status-toggle failures after older cache records
  // were stored with a different id for the same Supabase tool.
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_CUSTOM_TOOLS, 'readwrite');
      const store = transaction.objectStore(STORE_CUSTOM_TOOLS);
      const cursorRequest = store.openCursor();

      cursorRequest.onsuccess = () => {
        const cursor = cursorRequest.result;
        if (!cursor) {
          store.put(tool);
          return;
        }

        const existing = cursor.value as DBToolRecord;
        const existingSlug = String(existing.slug || '').trim().toLowerCase();
        const existingId = String(existing.id || '').trim().toLowerCase();
        if (
          (normalizedSlug && existingSlug === normalizedSlug) ||
          (normalizedId && existingId === normalizedId)
        ) {
          cursor.delete();
        }
        cursor.continue();
      };

      cursorRequest.onerror = () => {
        try { transaction.abort(); } catch { /* transaction may already be closed */ }
      };
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error || new Error('IndexedDB tool cache update failed.'));
      transaction.onabort = () => reject(transaction.error || new Error('IndexedDB tool cache update was aborted.'));
    });
  } catch (err) {
    // IndexedDB can be blocked in embedded browsers; localStorage remains fallback.
    console.warn('Using localStorage fallback for putDBCustomTool', err);
  }
}

export async function deleteDBCustomTool(slugOrId: string): Promise<void> {
  const normalized = String(slugOrId || '').toLowerCase().trim();

  // Clear every in-memory alias for the tool, not just the slug or database id.
  for (const [key, tool] of toolMemoryCache.entries()) {
    if (
      key === normalized ||
      tool.id?.toLowerCase().trim() === normalized ||
      tool.slug?.toLowerCase().trim() === normalized
    ) {
      toolMemoryCache.delete(key);
    }
  }

  const current = getLocalStorageTools().filter(
    (tool) =>
      tool.id?.toLowerCase().trim() !== normalized &&
      tool.slug?.toLowerCase().trim() !== normalized
  );
  saveLocalStorageTools(current);

  // IndexedDB uses the UUID as its primary key, while the admin API deletes
  // by slug. Resolve the cached row by its slug index so the local cache does
  // not resurrect a deleted tool in older admin screens.
  try {
    const db = await openDatabase();
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_CUSTOM_TOOLS, 'readwrite');
      const store = transaction.objectStore(STORE_CUSTOM_TOOLS);
      const bySlug = store.index('slug').getKey(normalized);
      bySlug.onsuccess = () => {
        if (bySlug.result !== undefined) {
          store.delete(bySlug.result);
        } else {
          store.delete(slugOrId);
        }
      };
      bySlug.onerror = () => reject(bySlug.error);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
      transaction.onabort = () => reject(transaction.error || new Error('IndexedDB deletion was aborted.'));
    });
  } catch (err) {
    console.warn('IndexedDB custom-tool cache cleanup failed', err);
  }
}

export async function getDBStatusOverrides(): Promise<Record<string, 'active' | 'inactive'>> {
  try {
    const db = await openDatabase();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_STATUS_OVERRIDES, 'readonly');
      const store = transaction.objectStore(STORE_STATUS_OVERRIDES);
      const request = store.getAll();

      request.onsuccess = () => {
        const result: Record<string, 'active' | 'inactive'> = {};
        for (const item of request.result || []) {
          result[item.toolId] = item.status;
        }
        resolve(result);
      };
      request.onerror = () => {
        resolve(getLocalStorageOverrides());
      };
    });
  } catch {
    return getLocalStorageOverrides();
  }
}

export async function setDBStatusOverride(toolId: string, status: 'active' | 'inactive'): Promise<void> {
  const current = getLocalStorageOverrides();
  current[toolId] = status;
  saveLocalStorageOverrides(current);

  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_STATUS_OVERRIDES, 'readwrite');
      const store = transaction.objectStore(STORE_STATUS_OVERRIDES);
      const request = store.put({
        toolId,
        status,
        updatedAt: new Date().toISOString(),
      });

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Using localStorage fallback for setDBStatusOverride', err);
  }
}
