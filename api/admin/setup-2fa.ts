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

  return item
    ? decodeURIComponent(item.slice(name.length + 1))
    : null;
}

function verifyTotp(secret: string, code: string) {
  const clean = String(code || '').replace(/\s+/g, '');

  if (!/^\d{6}$/.test(clean)) {
    return false;
  }

  try {
    const totp = new OTPAuth.TOTP({
      issuer: 'OnlineTools Admin',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret),
    });

    return (
      totp.validate({
        token: clean,
        window: 1,
      }) !== null
    );
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
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const { sessionSecret } = getAdminServerConfig();

    // Verify temporary 2FA setup session
    const pendingToken = getCookie(
      req,
      'admin_2fa_pending'
    );

    const pending = verifyPending2FAToken(
      pendingToken || '',
      sessionSecret
    );

    if (!pending) {
      return sendJson(res, 401, {
        success: false,
        error:
          'Security setup session expired. Please sign in again.',
      });
    }

    // Read request body
    const body = await parseJsonBody<{
      secret?: string;
      backupCodes?: string[];
      code?: string;
    }>(req);

    const secret = String(body?.secret || '').trim();
    const code = String(body?.code || '').trim();

    const backupCodes = Array.isArray(body?.backupCodes)
      ? body.backupCodes
          .map((item) => String(item).trim())
          .filter(Boolean)
          .slice(0, 10)
      : [];

    // Validate submitted authenticator code
    if (!secret) {
      return sendJson(res, 400, {
        success: false,
        error: 'Authenticator secret is missing.',
      });
    }

    if (!code) {
      return sendJson(res, 400, {
        success: false,
        error: 'Authenticator verification code is missing.',
      });
    }

    if (!verifyTotp(secret, code)) {
      return sendJson(res, 400, {
        success: false,
        error:
          'The authenticator code is invalid or expired. Please enter the current 6-digit code.',
      });
    }

    if (backupCodes.length < 3) {
      return sendJson(res, 400, {
        success: false,
        error: 'Authenticator backup codes are missing.',
      });
    }

    // IMPORTANT:
    // Use the privileged server-side Supabase client.
    const supabase = getSupabaseServerClient(true);

    if (!supabase) {
      return sendJson(res, 503, {
        success: false,
        error:
          'Secure Supabase server credentials are not configured.',
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

    console.log('2FA setup: saving configuration', {
      email: pending.email,
      settingKey,
      backupCodesCount: backupCodes.length,
    });

    /*
     * STEP 1:
     * Check whether the 2FA setting already exists.
     */
    const {
      data: existingSetting,
      error: lookupError,
    } = await supabase
      .from('site_settings')
      .select('key')
      .eq('key', settingKey)
      .maybeSingle();

    if (lookupError) {
      console.error(
        '2FA setup: lookup failed',
        JSON.stringify(lookupError)
      );

      return sendJson(res, 500, {
        success: false,
        error:
          'Unable to access secure authenticator configuration.',
        debug: {
          stage: 'lookup',
          code: lookupError.code || null,
          message: lookupError.message || null,
          details: lookupError.details || null,
          hint: lookupError.hint || null,
        },
      });
    }

    /*
     * STEP 2:
     * Explicit UPDATE if the setting already exists.
     */
    if (existingSetting) {
      console.log(
        '2FA setup: existing configuration found, updating'
      );

      const {
        data: updatedRows,
        error: updateError,
      } = await supabase
        .from('site_settings')
        .update({
          value: payload,
          updated_at: now,
        })
        .eq('key', settingKey)
        .select('key');

      if (updateError) {
        console.error(
          '2FA setup: update failed',
          JSON.stringify(updateError)
        );

        return sendJson(res, 500, {
          success: false,
          error:
            'Unable to save secure authenticator configuration.',
          debug: {
            stage: 'update',
            code: updateError.code || null,
            message: updateError.message || null,
            details: updateError.details || null,
            hint: updateError.hint || null,
          },
        });
      }

      if (!updatedRows || updatedRows.length === 0) {
        console.error(
          '2FA setup: update returned no rows'
        );

        return sendJson(res, 500, {
          success: false,
          error:
            'Unable to save secure authenticator configuration.',
          debug: {
            stage: 'update',
            message:
              'The database update completed without returning the expected row.',
          },
        });
      }
    } else {
      /*
       * STEP 3:
       * INSERT if the setting does not exist.
       */
      console.log(
        '2FA setup: configuration does not exist, inserting'
      );

      const {
        data: insertedRows,
        error: insertError,
      } = await supabase
        .from('site_settings')
        .insert({
          key: settingKey,
          value: payload,
          updated_at: now,
        })
        .select('key');

      if (insertError) {
        console.error(
          '2FA setup: insert failed',
          JSON.stringify(insertError)
        );

        return sendJson(res, 500, {
          success: false,
          error:
            'Unable to save secure authenticator configuration.',
          debug: {
            stage: 'insert',
            code: insertError.code || null,
            message: insertError.message || null,
            details: insertError.details || null,
            hint: insertError.hint || null,
          },
        });
      }

      if (!insertedRows || insertedRows.length === 0) {
        console.error(
          '2FA setup: insert returned no rows'
        );

        return sendJson(res, 500, {
          success: false,
          error:
            'Unable to save secure authenticator configuration.',
          debug: {
            stage: 'insert',
            message:
              'The database insert completed without returning the expected row.',
          },
        });
      }
    }

    /*
     * STEP 4:
     * Confirm that the configuration was actually saved.
     */
    const {
      data: savedSetting,
      error: verifySaveError,
    } = await supabase
      .from('site_settings')
      .select('key, updated_at')
      .eq('key', settingKey)
      .maybeSingle();

    if (verifySaveError) {
      console.error(
        '2FA setup: post-save verification failed',
        JSON.stringify(verifySaveError)
      );

      return sendJson(res, 500, {
        success: false,
        error:
          'Authenticator configuration was saved but could not be verified.',
        debug: {
          stage: 'verify-save',
          code: verifySaveError.code || null,
          message: verifySaveError.message || null,
          details: verifySaveError.details || null,
          hint: verifySaveError.hint || null,
        },
      });
    }

    if (!savedSetting) {
      console.error(
        '2FA setup: configuration missing after save'
      );

      return sendJson(res, 500, {
        success: false,
        error:
          'Authenticator configuration could not be verified after saving.',
        debug: {
          stage: 'verify-save',
          message:
            'No site_settings row was found after the save operation.',
        },
      });
    }

    console.log(
      '2FA setup: configuration saved successfully'
    );

    /*
     * STEP 5:
     * Create authenticated admin session.
     */
    const user = {
      email: pending.email,
      role: 'admin' as const,
      lastLoginAt: Date.now(),
    };

    const {
      token,
      expiresAt,
    } = signSessionToken(
      user,
      4 * 60 * 60 * 1000,
      sessionSecret
    );

    /*
     * STEP 6:
     * Set secure session cookie and clear temporary setup cookie.
     */
    setSessionCookie(
      res,
      token,
      4 * 60 * 60
    );

    clearPending2FACookie(res);

    /*
     * STEP 7:
     * Return success.
     */
    return sendJson(res, 200, {
      success: true,
      user,
      token,
      expiresAt,
    });
  } catch (error) {
    console.error(
      '2FA setup: unexpected error',
      error
    );

    return sendJson(res, 500, {
      success: false,
      error:
        'Unable to complete authenticator setup.',
      debug: {
        stage: 'unexpected',
        message:
          error instanceof Error
            ? error.message
            : String(error),
      },
    });
  }
}
