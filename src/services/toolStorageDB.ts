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
  extractedHtml: string; // Sanitized, ready-to-render self-contained HTML
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

export async function getAllDBCustomTools(): Promise<DBToolRecord[]> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
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
  } catch {
    return getLocalStorageTools();
  }
}

export async function getDBCustomToolBySlug(slug: string): Promise<DBToolRecord | null> {
  try {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_CUSTOM_TOOLS, 'readonly');
      const store = transaction.objectStore(STORE_CUSTOM_TOOLS);
      const index = store.index('slug');
      const request = index.get(slug);

      request.onsuccess = () => {
        if (request.result) {
          resolve(request.result);
        } else {
          // Check by ID as fallback
          const idReq = store.get(slug);
          idReq.onsuccess = () => resolve(idReq.result || null);
          idReq.onerror = () => resolve(null);
        }
      };
      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch {
    const tools = getLocalStorageTools();
    return tools.find((t) => t.slug === slug || t.id === slug) || null;
  }
}

export async function putDBCustomTool(tool: DBToolRecord): Promise<void> {
  // Always update localStorage fallback mirror
  const current = getLocalStorageTools().filter((t) => t.id !== tool.id);
  current.push(tool);
  saveLocalStorageTools(current);

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
  const current = getLocalStorageTools().filter((t) => t.id !== id);
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
