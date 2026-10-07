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
  if (!slug) return null;
  let decodedSlug = slug;
  try { decodedSlug = decodeURIComponent(slug); } catch {}
  const normalizedSlug = decodedSlug.toLowerCase().trim();

  // Production source of truth: Supabase metadata + public Storage bundle.
  // Local IndexedDB/localStorage is only a cache for the admin browser.
  try {
    const { supabase, isSupabaseConfigured } = await import('../lib/supabaseClient');
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('tools')
        .select('*')
        .eq('slug', normalizedSlug)
        .eq('is_custom', true)
        .eq('is_active', true)
        .maybeSingle();

      if (!error && data) {
        const storagePath = data.storage_path || undefined;
        const storageUrl = storagePath
          ? supabase.storage.from('custom-tools').getPublicUrl(storagePath).data.publicUrl
          : undefined;

        return {
          id: data.id,
          name: data.name,
          slug: data.slug,
          category: data.category,
          description: data.description,
          longDescription: data.long_description || undefined,
          seoTitle: data.seo_title || undefined,
          seoDescription: data.seo_description || undefined,
          iconName: data.icon || 'Wrench',
          thumbnailUrl: data.thumbnail_url || undefined,
          keywords: data.tags || [],
          featured: Boolean(data.is_featured),
          popular: Boolean(data.is_featured),
          status: data.is_active ? 'active' : 'inactive',
          isCustom: true,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          zipFileName: data.zip_file_name || undefined,
          zipFileSize: Number(data.zip_file_size || 0),
          filesCount: Number(data.files_count || 1),
          entryHtmlPath: data.entry_html_path || 'index.html',
          storagePath,
          storageUrl,
          performance: {
            views: Number(data.usage_count || 0),
            invocations: Number(data.usage_count || 0),
            avgDurationSec: 0,
            rating: 5,
          },
        };
      }
    }
  } catch {
    // Continue to local cache fallback.
  }

  const cached =
    toolMemoryCache.get(normalizedSlug) ||
    toolMemoryCache.get(normalizedSlug.replace(/\s+/g, '-')) ||
    toolMemoryCache.get(normalizedSlug.replace(/-/g, ' '));
  if (cached) return cached;

  try {
    const db = await openDatabase();
    const idbResult: DBToolRecord | null = await new Promise((resolve) => {
      const transaction = db.transaction(STORE_CUSTOM_TOOLS, 'readonly');
      const store = transaction.objectStore(STORE_CUSTOM_TOOLS);
      const request = store.index('slug').get(normalizedSlug);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
    if (idbResult) return idbResult;
  } catch {}

  return getLocalStorageTools().find((t) => (t.slug || '').toLowerCase().trim() === normalizedSlug) || null;
}

export async function putDBCustomTool(tool: DBToolRecord): Promise<void> {
  // Update memory cache immediately
  if (tool.slug) toolMemoryCache.set(tool.slug.toLowerCase().trim(), tool);
  if (tool.id) toolMemoryCache.set(tool.id.toLowerCase().trim(), tool);

  // Update localStorage fallback mirror
  try {
    const current = getLocalStorageTools().filter(
      (t) => t.id !== tool.id && t.slug?.toLowerCase().trim() !== tool.slug?.toLowerCase().trim()
    );
    current.push(tool);
    saveLocalStorageTools(current);
  } catch (e) {
    console.warn('LocalStorage save failed for tool:', e);
  }

  // Update IndexedDB
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_CUSTOM_TOOLS, 'readwrite');
      const store = transaction.objectStore(STORE_CUSTOM_TOOLS);
      const request = store.put(tool);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Using localStorage fallback for putDBCustomTool', err);
  }
}

export async function deleteDBCustomTool(id: string): Promise<void> {
  const normId = id.toLowerCase().trim();
  toolMemoryCache.delete(normId);

  const current = getLocalStorageTools().filter(
    (t) => t.id?.toLowerCase().trim() !== normId && t.slug?.toLowerCase().trim() !== normId
  );
  saveLocalStorageTools(current);

  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_CUSTOM_TOOLS, 'readwrite');
      const store = transaction.objectStore(STORE_CUSTOM_TOOLS);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('Using localStorage fallback for deleteDBCustomTool', err);
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
