import type { IncomingMessage, ServerResponse } from 'http';
import { getAuthenticatedAdminFromRequest, parseJsonBody, sendJson } from '../_lib/adminAuthServer.js';
import { getSupabaseServerClient } from '../_lib/supabaseServer.js';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { success: false, error: 'Method not allowed.' });
  }
  if (!getAuthenticatedAdminFromRequest(req)) return sendJson(res, 401, { success: false, error: 'Authentication required.' });
  const db = getSupabaseServerClient(true);
  if (!db) return sendJson(res, 503, { success: false, error: 'Secure database configuration is missing.' });
  try {
    const body = await parseJsonBody<{ settings?: unknown }>(req);
    if (!body || typeof body.settings !== 'object' || body.settings === null || Array.isArray(body.settings)) {
      return sendJson(res, 400, { success: false, error: 'Valid settings object is required.' });
    }
    const { error } = await db.from('site_settings').upsert({
      key: 'global_site_settings', value: body.settings, updated_at: new Date().toISOString(),
    }, { onConflict: 'key' });
    if (error) {
      console.error('[AdminSettingsAPI] Save failed:', error.message);
      return sendJson(res, 500, { success: false, error: 'Unable to save site settings.' });
    }
    return sendJson(res, 200, { success: true });
  } catch {
    return sendJson(res, 400, { success: false, error: 'Invalid settings request.' });
  }
}
