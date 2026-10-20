import type { IncomingMessage, ServerResponse } from 'http';
import { getAuthenticatedAdminFromRequest, parseJsonBody, sendJson } from '../_lib/adminAuthServer.js';
import { getSupabaseServerClient } from '../_lib/supabaseServer.js';

const SETTINGS_KEY = 'global_ad_config';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  try {
    const supabase = getSupabaseServerClient(true);
    if (!supabase) {
      return sendJson(res, 500, { success: false, error: 'Server Supabase configuration is incomplete.' });
    }

    if (req.method === 'GET') {
      const { data, error } = await supabase.from('site_settings').select('value').eq('key', SETTINGS_KEY).maybeSingle();
      if (error) throw error;
      return sendJson(res, 200, { success: true, config: data?.value ?? null });
    }

    if (req.method !== 'POST') {
      res.setHeader('Allow', 'GET, POST');
      return sendJson(res, 405, { success: false, error: 'Method not allowed.' });
    }

    const admin = getAuthenticatedAdminFromRequest(req);
    if (!admin) return sendJson(res, 401, { success: false, error: 'Authentication required.' });

    const body = await parseJsonBody<{ config?: unknown }>(req);
    const config = body?.config;
    if (!config || typeof config !== 'object' || Array.isArray(config)) {
      return sendJson(res, 400, { success: false, error: 'A valid ad configuration is required.' });
    }

    const { error } = await supabase.from('site_settings').upsert({
      key: SETTINGS_KEY,
      value: config,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'key' });
    if (error) throw error;

    return sendJson(res, 200, { success: true, savedAt: new Date().toISOString() });
  } catch (error) {
    console.error('[admin/ad-settings] Request failed:', error instanceof Error ? error.message : 'Unknown error');
    return sendJson(res, 500, { success: false, error: 'Unable to read or save ad settings.' });
  }
}
