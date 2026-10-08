import { createClient, SupabaseClient } from '@supabase/supabase-js';

export function getSupabaseServerClient(adminOnly = false): SupabaseClient | null {
  const rawUrl = (
    process.env.SUPABASE_URL ||
    process.env.VITE_SUPABASE_URL ||
    ''
  ).trim();

  const url = rawUrl.replace(/^["']|["']$/g, '').trim().replace(/\/+$/, '');

  const rawKey = adminOnly
    ? (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
    : (
        process.env.SUPABASE_ANON_KEY ||
        process.env.VITE_SUPABASE_ANON_KEY ||
        ''
      ).trim();

  const key = rawKey.replace(/^["']|["']$/g, '').trim();

  if (!url || !key || !url.startsWith('https://') || key.length < 20) {
    return null;
  }

  try {
    return createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  } catch (err) {
    console.warn('[supabaseServer] Failed to initialize Supabase client:', err);
    return null;
  }
}

export function isSupabaseServerConfigured(): boolean {
  return getSupabaseServerClient() !== null;
}
