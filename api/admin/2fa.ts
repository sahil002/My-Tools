import type { IncomingMessage, ServerResponse } from 'http';
import crypto from 'crypto';
import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';
import {
  getAdminServerConfig,
  parseCookies,
  verifyPending2FAToken,
  clearPending2FACookie,
  signSessionToken,
  setSessionCookie,
  parseJsonBody,
  sendJson,
} from '../_lib/adminAuthServer.js';
import { getSupabaseServerClient } from '../_lib/supabaseServer.js';

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
function makeBase32(bytes: Buffer): string {
  // Preserve only unconsumed bits after each 5-bit output group.
  // Otherwise the 32-bit bitwise accumulator can overflow and corrupt secrets.
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of bytes) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31];
      bits -= 5;
      value &= (1 << bits) - 1;
    }
  }
  if (bits) output += alphabet[(value << (5 - bits)) & 31];
  return output;
}
function otpFor(email: string, secret: string) {
  // The generated secret is Base32. Decode it explicitly so the QR URI and
  // server-side TOTP validation use the same raw secret bytes.
  return new OTPAuth.TOTP({ issuer: 'Online Tools Admin', label: email, algorithm: 'SHA1', digits: 6, period: 30, secret: OTPAuth.Secret.fromBase32(secret) });
}
function hashBackup(code: string) {
  return crypto.createHash('sha256').update(code.toUpperCase()).digest('hex');
}
const attempts = new Map<string, { count: number; resetAt: number }>();
function isRateLimited(email: string) {
  const now = Date.now();
  const state = attempts.get(email);
  if (!state || state.resetAt < now) { attempts.set(email, { count: 1, resetAt: now + 10 * 60 * 1000 }); return false; }
  state.count += 1;
  return state.count > 8;
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return sendJson(res, 405, { success: false, error: 'Method not allowed' }); }
  try {
    const { sessionSecret } = getAdminServerConfig();
    if (!sessionSecret) return sendJson(res, 503, { success: false, error: 'Admin session secret is not configured.' });
    const cookies = parseCookies(req);
    const pending = cookies.admin_2fa_pending ? verifyPending2FAToken(cookies.admin_2fa_pending, sessionSecret) : null;
    if (!pending) return sendJson(res, 401, { success: false, error: 'Login verification expired. Enter your password again.' });
    const email = pending.email.trim().toLowerCase();
    if (isRateLimited(email)) return sendJson(res, 429, { success: false, error: 'Too many authenticator attempts. Please wait 10 minutes.' });

    const body = await parseJsonBody<{ action?: string; code?: string; secret?: string }>(req);
    if (!body) return sendJson(res, 400, { success: false, error: 'Request body is required.' });
    const action = String(body.action || '');
    const code = String(body.code || '').replace(/\s/g, '');
    const db = getSupabaseServerClient(true);
    if (!db) return sendJson(res, 503, { success: false, error: 'Secure authenticator storage is not configured.' });

    const { data: allowlistedAdmin, error: adminError } = await db.from('admin_users').select('email').eq('email', email).maybeSingle();
    if (adminError || !allowlistedAdmin) return sendJson(res, 403, { success: false, error: 'Administrator allowlist verification failed.' });

    if (action === 'setup') {
      const secret = makeBase32(crypto.randomBytes(20));
      const uri = otpFor(email, secret).toString();
      const qrCode = await QRCode.toDataURL(uri, { errorCorrectionLevel: 'M', margin: 2, width: 240 });
      return sendJson(res, 200, { success: true, secret, qrCode, manualEntryKey: secret });
    }

    if (action === 'enroll') {
      const secret = String(body.secret || '');
      if (!/^[A-Z2-7]{32}$/.test(secret) || !/^\d{6}$/.test(code)) return sendJson(res, 400, { success: false, error: 'Enter the 6-digit authenticator code from the QR you just scanned.' });
      const { data: existing, error: existingError } = await db.from('admin_two_factor').select('email').eq('email', email).maybeSingle();
      if (existingError) return sendJson(res, 503, { success: false, error: 'Unable to check existing authenticator enrollment.' });
      if (existing) return sendJson(res, 409, { success: false, error: 'An authenticator is already enrolled. Use your current code to sign in.' });
      if (otpFor(email, secret).validate({ token: code, window: 1 }) === null) return sendJson(res, 401, { success: false, error: 'Invalid or expired authenticator code.' });
      const backupCodes = Array.from({ length: 8 }, () => crypto.randomBytes(5).toString('hex').toUpperCase());
      const { error } = await db.from('admin_two_factor').insert({
        email, secret, backup_code_hashes: backupCodes.map(hashBackup), enabled_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      });
      if (error) { console.error('[api/admin/2fa] Enrollment save failed:', error.message); return sendJson(res, 500, { success: false, error: 'Unable to save authenticator securely.' }); }
      attempts.delete(email);
      const session = signSessionToken({ email, role: 'admin', lastLoginAt: Date.now() }, 4 * 60 * 60 * 1000, sessionSecret);
      setSessionCookie(res, session.token, 4 * 60 * 60);
      clearPending2FACookie(res);
      return sendJson(res, 200, { success: true, verified: true, backupCodes, expiresAt: session.expiresAt });
    }

    if (action === 'verify') {
      if (!/^\d{6}$/.test(code) && !/^[A-F0-9]{10}$/i.test(code)) return sendJson(res, 400, { success: false, error: 'Enter a 6-digit code or one unused backup code.' });
      const { data: record, error } = await db.from('admin_two_factor').select('secret, backup_code_hashes').eq('email', email).maybeSingle();
      if (error) return sendJson(res, 503, { success: false, error: 'Unable to read authenticator enrollment.' });
      if (!record) return sendJson(res, 409, { success: false, error: 'Authenticator setup is required. Sign in again to enroll.' });
      let valid = false;
      if (/^\d{6}$/.test(code)) valid = otpFor(email, record.secret).validate({ token: code, window: 1 }) !== null;
      else {
        const digest = hashBackup(code);
        const hashes: string[] = Array.isArray(record.backup_code_hashes) ? record.backup_code_hashes : [];
        const idx = hashes.indexOf(digest);
        if (idx >= 0) {
          const next = hashes.filter((_: string, i: number) => i !== idx);
          const { error: updateError } = await db.from('admin_two_factor').update({ backup_code_hashes: next, updated_at: new Date().toISOString() }).eq('email', email);
          valid = !updateError;
        }
      }
      if (!valid) return sendJson(res, 401, { success: false, error: 'Invalid or expired authenticator code.' });
      attempts.delete(email);
      const session = signSessionToken({ email, role: 'admin', lastLoginAt: Date.now() }, 4 * 60 * 60 * 1000, sessionSecret);
      setSessionCookie(res, session.token, 4 * 60 * 60);
      clearPending2FACookie(res);
      return sendJson(res, 200, { success: true, verified: true, expiresAt: session.expiresAt });
    }

    return sendJson(res, 400, { success: false, error: 'Unknown authenticator action.' });
  } catch (error) {
    console.error('[api/admin/2fa] Unexpected error:', error);
    return sendJson(res, 500, { success: false, error: 'Unable to complete authenticator verification.' });
  }
}
