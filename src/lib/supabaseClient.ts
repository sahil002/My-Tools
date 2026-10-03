import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Client-side environment variables with Node/browser safe access
const metaEnv = typeof import.meta !== 'undefined' && import.meta.env ? import.meta.env : (typeof process !== 'undefined' ? process.env : {});
const envUrl = (metaEnv?.VITE_SUPABASE_URL as string | undefined)?.trim();
const envAnonKey = (metaEnv?.VITE_SUPABASE_ANON_KEY as string | undefined)?.trim();

export function getActiveSupabaseCredentials(): { url: string; anonKey: string; isConfigured: boolean } {
  let url = envUrl || '';
  let anonKey = envAnonKey || '';

  if (typeof window !== 'undefined') {
    const savedUrl = localStorage.getItem('prbsolver_supabase_url') || localStorage.getItem('ot_supabase_url');
    const savedKey = localStorage.getItem('prbsolver_supabase_key') || localStorage.getItem('ot_supabase_anon_key');
    if (savedUrl && savedKey) {
      url = savedUrl.trim();
      anonKey = savedKey.trim();
    }
  }

  const isConfigured = Boolean(
    url &&
    anonKey &&
    url.startsWith('https://') &&
    anonKey.length > 20
  );

  return { url, anonKey, isConfigured };
}

export function saveSupabaseCredentials(url: string, anonKey: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('prbsolver_supabase_url', url.trim());
    localStorage.setItem('prbsolver_supabase_key', anonKey.trim());
    clientInstance = null;
    lastUrl = '';
    lastKey = '';
  }
}

export function clearSupabaseCredentials(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('prbsolver_supabase_url');
    localStorage.removeItem('prbsolver_supabase_key');
    localStorage.removeItem('ot_supabase_url');
    localStorage.removeItem('ot_supabase_anon_key');
    clientInstance = null;
    lastUrl = '';
    lastKey = '';
  }
}

export const isSupabaseConfigured = (): boolean => {
  return getActiveSupabaseCredentials().isConfigured;
};

export const getSupabaseConfig = () => {
  const creds = getActiveSupabaseCredentials();
  return {
    url: creds.url,
    isConfigured: creds.isConfigured,
  };
};

let clientInstance: SupabaseClient | null = null;
let lastUrl = '';
let lastKey = '';

export function getSupabase(): SupabaseClient | null {
  const { url, anonKey, isConfigured } = getActiveSupabaseCredentials();
  if (!isConfigured) {
    return null;
  }
  if (!clientInstance || url !== lastUrl || anonKey !== lastKey) {
    clientInstance = createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    lastUrl = url;
    lastKey = anonKey;
  }
  return clientInstance;
}

// Proxy getter for backward compatibility
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const client = getSupabase();
    if (!client) {
      return () => Promise.resolve({ data: null, error: new Error('Supabase not configured') });
    }
    const val = (client as any)[prop];
    return typeof val === 'function' ? val.bind(client) : val;
  }
});
