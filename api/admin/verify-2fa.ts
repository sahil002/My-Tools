import type { IncomingMessage, ServerResponse } from 'http';
import {
  getAdminServerConfig,
  parseJsonBody,
  sendJson,
  verifyPending2FAToken,
  clearPending2FACookie,
  signSessionToken,
  setSessionCookie,
} from '../_lib/adminAuthServer.js';
import { getSupabaseServerClient } from '../_lib/supabaseServer.js';
import * as OTPAuth from 'otpauth';

function getCookie(req: IncomingMessage, name: string) {
  const raw = String(req.headers.cookie || '');
  const item = raw
    .split(';')
    .map((v) => v.trim())
    .find((v) => v.startsWith(name + '='));
  return item ? decodeURIComponent(item.slice(name.length + 1)) : null;
}

function verifyTotp(secret: string, code: string) {
  const clean = String(code || '').replace(/\s+/g, '');
  if (!/^\d{6}$/.test(clean)) return false;
  try {
    const totp = new OTPAuth.TOTP({
      issuer: 'OnlineTools Admin',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret),
    });
    return totp.validate({ token: clean, window: 1 }) !== null;
  } catch {
    return false;
  }
}

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { success: false, error: 'Method not allowed' });
  }

  try {
    const { sessionSecret } = getAdminServerConfig();
    const pending = verifyPending2FAToken(
      getCookie(req, 'admin_2fa_pending') || '',
      sessionSecret
    );

    if (!pending) {
      return sendJson(res, 401, {
        success: false,
        error: 'Two-factor verification session expired. Please sign in again.',
      });
    }

    const body = await parseJsonBody<{ code?: string }>(req);
    const code = String(body?.code || '').trim().toUpperCase();

    if (!code) {
      return sendJson(res, 400, {
        success: false,
        error: 'Authentication code is required.',
      });
    }

    const supabase = getSupabaseServerClient(true);
    if (!supabase) {
      return sendJson(res, 503, {
        success: false,
        error: 'Security service is not configured. Please check the server Supabase secret key.',
      });
    }

    const settingKey = `2fa_${pending.email}`;
    const { data: row, error } = await supabase
      .from('site_settings')
      .select('value')
      .eq('key', settingKey)
      .maybeSingle();

    if (error) {
      console.error('[api/admin/verify-2fa] Supabase lookup failed:', error);
      return sendJson(res, 500, {
        success: false,
        error: 'Unable to access two-factor configuration.',
      });
    }

    if (!row?.value?.enabled || !row.value.secret) {
      return sendJson(res, 401, {
        success: false,
        error: 'Two-factor authentication is not configured for this account.',
      });
    }

    let valid = verifyTotp(String(row.value.secret), code);

    if (!valid) {
      const backupCodes = Array.isArray(row.value.backupCodes)
        ? row.value.backupCodes.map(String)
        : [];

      if (backupCodes.includes(code)) {
        valid = true;
        const remaining = backupCodes.filter((c) => c !== code);
        const updatedValue = {
          ...row.value,
          backupCodes: remaining,
          updatedAt: new Date().toISOString(),
        };

        const { error: updateError } = await supabase
          .from('site_settings')
          .update({
            value: updatedValue,
            updated_at: new Date().toISOString(),
          })
          .eq('key', settingKey);

        if (updateError) {
          console.error('[api/admin/verify-2fa] Backup-code update failed:', updateError);
          return sendJson(res, 500, {
            success: false,
            error: 'Unable to update backup-code configuration.',
          });
        }
      }
    }

    if (!valid) {
      return sendJson(res, 401, {
        success: false,
        error: 'Invalid authentication code.',
      });
    }

    const user = {
      email: pending.email,
      role: 'admin' as const,
      lastLoginAt: Date.now(),
    };

    const { token, expiresAt } = signSessionToken(
      user,
      4 * 60 * 60 * 1000,
      sessionSecret
    );

    setSessionCookie(res, token, 4 * 60 * 60);
    clearPending2FACookie(res);

    return sendJson(res, 200, {
      success: true,
      user,
      token,
      expiresAt,
    });
  } catch (error) {
    console.error('[api/admin/verify-2fa] Unexpected error:', error);
    return sendJson(res, 500, {
      success: false,
      error: 'Unable to complete two-factor verification.',
    });
  }
}