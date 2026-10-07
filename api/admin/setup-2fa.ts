import type { IncomingMessage, ServerResponse } from 'http';
import { getAdminServerConfig, parseJsonBody, sendJson, verifyPending2FAToken, clearPending2FACookie, signSessionToken, setSessionCookie } from '../_lib/adminAuthServer';
import { getSupabaseServerClient } from '../_lib/supabaseServer';
import * as OTPAuth from 'otpauth';

function getCookie(req: IncomingMessage, name: string) {
  const raw = String(req.headers.cookie || '');
  const item = raw.split(';').map(v => v.trim()).find(v => v.startsWith(name + '='));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : null;
}
function verifyTotp(secret: string, code: string) {
  const clean = String(code || '').replace(/\s+/g, '');
  if (!/^\d{6}$/.test(clean)) return false;
  try {
    const totp = new OTPAuth.TOTP({ issuer: 'OnlineTools Admin', algorithm: 'SHA1', digits: 6, period: 30, secret: OTPAuth.Secret.fromBase32(secret) });
    return totp.validate({ token: clean, window: 1 }) !== null;
  } catch { return false; }
}
export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return sendJson(res, 405, { error: 'Method not allowed' }); }
  try {
    const { sessionSecret } = getAdminServerConfig();
    const pending = verifyPending2FAToken(getCookie(req, 'admin_2fa_pending') || '', sessionSecret);
    if (!pending) return sendJson(res, 401, { success: false, error: 'Security setup session expired. Please sign in again.' });
    const body = await parseJsonBody<{ secret?: string; backupCodes?: string[]; code?: string }>(req);
    const secret = String(body?.secret || '').trim();
    const code = String(body?.code || '').trim();
    const backupCodes = Array.isArray(body?.backupCodes) ? body.backupCodes.map(String).slice(0, 10) : [];
    if (!secret || !code || !verifyTotp(secret, code) || backupCodes.length < 3) return sendJson(res, 400, { success: false, error: 'Invalid authenticator setup.' });
    const supabase = getSupabaseServerClient(true);
    if (!supabase) return sendJson(res, 503, { success: false, error: 'Secure Supabase server credentials are not configured.' });
    const payload = { enabled: true, secret, backupCodes, updatedAt: new Date().toISOString() };
    const { error } = await supabase.from('site_settings').upsert({ key: `2fa_${pending.email}`, value: payload, updated_at: new Date().toISOString() }, { onConflict: 'key' });
    if (error) return sendJson(res, 500, { success: false, error: 'Unable to save secure authenticator configuration.' });
    const user = { email: pending.email, role: 'admin' as const, lastLoginAt: Date.now() };
    const { token, expiresAt } = signSessionToken(user, 4 * 60 * 60 * 1000, sessionSecret);
    setSessionCookie(res, token, 4 * 60 * 60); clearPending2FACookie(res);
    return sendJson(res, 200, { success: true, user, token, expiresAt });
  } catch { return sendJson(res, 500, { success: false, error: 'Unable to complete authenticator setup.' }); }
}