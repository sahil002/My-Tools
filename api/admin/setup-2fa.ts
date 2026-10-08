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
    .map(v => v.trim())
    .find(v => v.startsWith(name + '='));

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

    return totp.validate({
      token: clean,
      window: 1,
    }) !== null;
  } catch {
    return false;
  }
}

export default async function handler(
  req: IncomingMessage,
  res: ServerResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');

    return sendJson(res, 405, {
      error: 'Method not allowed',
    });
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
        error: 'Security setup session expired. Please sign in again.',
      });
    }

    const body = await parseJsonBody<{
      secret?: string;
      backupCodes?: string[];
      code?: string;
    }>(req);

    const secret = String(body?.secret || '').trim();
    const code = String(body?.code || '').trim();

    const backupCodes = Array.isArray(body?.backupCodes)
      ? body.backupCodes.map(String).slice(0, 10)
      : [];

    // Validate submitted authenticator setup
    if (
      !secret ||
      !code ||
      !verifyTotp(secret, code) ||
      backupCodes.length < 3
    ) {
      return sendJson(res, 400, {
        success: false,
        error: 'Invalid authenticator setup.',
      });
    }

    // Use the privileged server-side Supabase client
    const supabase = getSupabaseServerClient(true);

    if (!supabase) {
      return sendJson(res, 503, {
        success: false,
        error: 'Secure Supabase server credentials are not configured.',
      });
    }

    const settingKey = `2fa_${pending.email}`;
    const now = new Date().toISOString();

    const payload = {
      enabled: true,
      secret,
      backupCodes,
      updatedAt: now,
    };

    /*
     * Save the 2FA configuration reliably.
     *
     * Instead of relying only on upsert/onConflict, first check
     * whether the setting already exists and then explicitly
     * UPDATE or INSERT it.
     */
    const { data: existingSetting, error: readError } = await supabase
      .from('site_settings')
      .select('key')
      .eq('key', settingKey)
      .maybeSingle();

    if (readError) {
      console.error(
        '2FA configuration lookup failed:',
        readError
      );

      return sendJson(res, 500, {
        success: false,
        error:
          'Unable to access secure authenticator configuration.',
      });
    }

    let saveError = null;

    if (existingSetting) {
      const { error } = await supabase
        .from('site_settings')
        .update({
          value: payload,
          updated_at: now,
        })
        .eq('key', settingKey);

      saveError = error;
    } else {
      const { error } = await supabase
        .from('site_settings')
        .insert({
          key: settingKey,
          value: payload,
          updated_at: now,
        });

      saveError = error;
    }

    if (saveError) {
      console.error(
        '2FA configuration save failed:',
        saveError
      );

      return sendJson(res, 500, {
        success: false,
        error:
          'Unable to save secure authenticator configuration.',
      });
    }

    // Create authenticated admin session
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

    // Set secure session cookie and clear temporary 2FA setup cookie
    setSessionCookie(res, token, 4 * 60 * 60);
    clearPending2FACookie(res);

    return sendJson(res, 200, {
      success: true,
      user,
      token,
      expiresAt,
    });
  } catch (error) {
    console.error(
      'Unable to complete authenticator setup:',
      error
    );

    return sendJson(res, 500, {
      success: false,
      error: 'Unable to complete authenticator setup.',
    });
  }
}
```
