import type { IncomingMessage, ServerResponse } from 'http';
import { getAuthenticatedAdminFromRequest, parseJsonBody, sendJson } from '../_lib/adminAuthServer.js';
import { getSupabaseServerClient } from '../_lib/supabaseServer.js';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (!getAuthenticatedAdminFromRequest(req)) return sendJson(res, 401, { success: false, error: 'Authentication required.' });
  const db = getSupabaseServerClient(true);
  if (!db) return sendJson(res, 503, { success: false, error: 'Secure database configuration is missing.' });
  try {
    if (req.method === 'GET') {
      const kind = String((req.url || '').split('?')[1] || '');
      const url = new URL(req.url || '/', 'http://localhost');
      const type = url.searchParams.get('type');
      if (type === 'requests') {
        const { data, error } = await db.from('tool_requests').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return sendJson(res, 200, { success: true, items: data || [] });
      }
      if (type === 'comments') {
        const { data, error } = await db.from('tool_comments').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        return sendJson(res, 200, { success: true, items: data || [] });
      }
      return sendJson(res, 400, { success: false, error: 'Unknown moderation type.' });
    }
    if (req.method === 'POST') {
      const body = await parseJsonBody<{ action?: string; id?: string; status?: string; notes?: string }>(req);
      if (!body?.id || !body.action) return sendJson(res, 400, { success: false, error: 'Action and record ID are required.' });
      if (body.action === 'update-request') {
        const allowed = ['pending', 'in-review', 'planned', 'completed', 'declined'];
        if (!allowed.includes(String(body.status))) return sendJson(res, 400, { success: false, error: 'Invalid request status.' });
        const { error } = await db.from('tool_requests').update({ status: body.status, admin_notes: String(body.notes || '').slice(0, 5000) }).eq('id', body.id);
        if (error) throw error;
        return sendJson(res, 200, { success: true });
      }
      if (body.action === 'update-comment') {
        if (!['pending', 'approved', 'rejected'].includes(String(body.status))) return sendJson(res, 400, { success: false, error: 'Invalid comment status.' });
        const { error } = await db.from('tool_comments').update({ status: body.status }).eq('id', body.id);
        if (error) throw error;
        return sendJson(res, 200, { success: true });
      }
      return sendJson(res, 400, { success: false, error: 'Unknown moderation action.' });
    }
    if (req.method === 'DELETE') {
      const body = await parseJsonBody<{ kind?: string; id?: string }>(req);
      if (!body?.id || !['requests', 'comments'].includes(String(body.kind))) return sendJson(res, 400, { success: false, error: 'Record type and ID are required.' });
      const table = body.kind === 'requests' ? 'tool_requests' : 'tool_comments';
      const { error } = await db.from(table).delete().eq('id', body.id);
      if (error) throw error;
      return sendJson(res, 200, { success: true });
    }
    res.setHeader('Allow', 'GET, POST, DELETE');
    return sendJson(res, 405, { success: false, error: 'Method not allowed.' });
  } catch (error: any) {
    console.error('[AdminModerationAPI] Request failed:', error?.message || error);
    return sendJson(res, 500, { success: false, error: 'Moderation operation failed.' });
  }
}
