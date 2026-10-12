import type { IncomingMessage, ServerResponse } from 'http';
import {
  getAuthenticatedAdminFromRequest,
  hashAdminPassword,
  verifyAdminPassword,
  parseJsonBody,
  sendJson,
} from '../_lib/adminAuthServer.js';
import { getSupabaseServerClient } from '../_lib/supabaseServer.js';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { success: false, error: 'Method not allowed' });
  }
  const adminSession = getAuthenticatedAdminFromRequest(req);
  if (!adminSession) return sendJson(res, 401, { success: false, error: 'Please sign in again before changing your password.' });

  try {
    const body = await parseJsonBody<{ currentPassword?: string; newPassword?: string }>(req);
    const currentPassword = String(body?.currentPassword || '');
    const newPassword = String(body?.newPassword || '');
    if (!currentPassword || !newPassword) return sendJson(res, 400, { success: false, error: 'Current and new passwords are required.' });
    if (newPassword.length < 12 || !/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/\d/.test(newPassword) || !/[^A-Za-z0-9]/.test(newPassword)) {
      return sendJson(res, 400, { success: false, error: 'Use at least 12 characters including uppercase, lowercase, a number, and a symbol.' });
    }
    if (currentPassword === newPassword) return sendJson(res, 400, { success: false, error: 'New password must be different from the current password.' });

    const supabaseAuth = getSupabaseServerClient(false);
    const supabaseAdmin = getSupabaseServerClient(true);
    if (!supabaseAuth || !supabaseAdmin) return sendJson(res, 503, { success: false, error: 'Password service is not configured. Check Supabase server keys in Vercel.' });

    const { data: authData, error: authError } = await supabaseAuth.auth.signInWithPassword({ email: adminSession.email, password: currentPassword });
    if (!authError && authData.user) {
      const { error } = await supabaseAdmin.auth.admin.updateUserById(authData.user.id, { password: newPassword });
      if (error) {
        console.error('[api/admin/change-password] Supabase Auth update failed:', error.message);
        return sendJson(res, 500, { success: false, error: 'Unable to update password right now.' });
      }
      return sendJson(res, 200, { success: true, message: 'Password updated successfully. Use the new password next time.' });
    }

    const { data: record, error: lookupError } = await supabaseAdmin.from('admin_users').select('id, email, password_hash').eq('email', adminSession.email.toLowerCase()).maybeSingle();
    if (lookupError) {
      console.error('[api/admin/change-password] Admin lookup failed:', lookupError.message);
      return sendJson(res, 500, { success: false, error: 'Unable to verify the current password.' });
    }
    if (record?.password_hash && verifyAdminPassword(currentPassword, record.password_hash).valid) {
      const { error } = await supabaseAdmin.from('admin_users').update({ password_hash: hashAdminPassword(newPassword) }).eq('id', record.id);
      if (error) {
        console.error('[api/admin/change-password] Admin password update failed:', error.message);
        return sendJson(res, 500, { success: false, error: 'Unable to save the new password.' });
      }
      return sendJson(res, 200, { success: true, message: 'Password updated successfully.' });
    }
    return sendJson(res, 403, { success: false, error: 'Current password is incorrect, or this account uses environment-based credentials that cannot be changed here.' });
  } catch (error) {
    console.error('[api/admin/change-password] Unexpected error:', error);
    return sendJson(res, 500, { success: false, error: 'Unable to update password.' });
  }
}
