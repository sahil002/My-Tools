import type { IncomingMessage, ServerResponse } from 'http';
import {
  getAdminServerConfig,
  timingSafeCompare,
  checkRateLimit,
  recordFailedLogin,
  resetRateLimit,
  signSessionToken,
  setSessionCookie,
  signPending2FAToken,
  setPending2FACookie,
  parseJsonBody,
  sendJson,
} from '../_lib/adminAuthServer';
import { getSupabaseServerClient } from '../_lib/supabaseServer';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  try {
    const clientIp = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown-ip';
    const rateLimitKey = `login:${clientIp.split(',')[0].trim()}`;

    // 1. Check Rate Limit
    const rateLimit = checkRateLimit(rateLimitKey);
    if (rateLimit.isLocked) {
      return sendJson(res, 429, {
        success: false,
        error: `Too many failed attempts. Login locked for ${Math.ceil(rateLimit.secondsLeft / 60)} more minutes.`,
        rateLimit,
      });
    }

    // 2. Parse body safely
    const body = await parseJsonBody<{ email?: string; password?: string; rememberMe?: boolean }>(req);
    if (!body || !body.email || !body.password) {
      return sendJson(res, 400, {
        success: false,
        error: 'Email and password are required.',
      });
    }

    const { sessionSecret } = getAdminServerConfig();
    const inputEmail = (body.email || '').trim().toLowerCase();
    const inputPassword = body.password || '';
    const rememberMe = Boolean(body.rememberMe);

    let authenticatedUser: { email: string; role: 'admin'; source: string } | null = null;

    // 3. Try Authenticating with Supabase (if configured)
    const supabase = getSupabaseServerClient();
    if (supabase) {
      // 3a. Check Supabase Auth (Users created in Supabase Dashboard -> Authentication -> Users)
      try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: inputEmail,
          password: inputPassword,
        });

        if (!authError && authData?.user) {
          authenticatedUser = {
            email: authData.user.email || inputEmail,
            role: 'admin',
            source: 'supabase_auth',
          };
        }
      } catch (authErr) {
        console.warn('[api/admin/login] Supabase auth.signInWithPassword check failed:', authErr);
      }

      // 3b. Check Supabase Table (public.admin_users created by schema.sql)
      if (!authenticatedUser) {
        try {
          const { data: userRecord, error: tableError } = await supabase
            .from('admin_users')
            .select('*')
            .eq('email', inputEmail)
            .maybeSingle();

          if (!tableError && userRecord) {
            const storedPassword = userRecord.password_hash || (userRecord as any).password;
            if (storedPassword && typeof storedPassword === 'string') {
              const passwordMatches =
                timingSafeCompare(inputPassword, storedPassword) ||
                timingSafeCompare(inputPassword.trim(), storedPassword.trim());

              if (passwordMatches) {
                authenticatedUser = {
                  email: userRecord.email,
                  role: 'admin',
                  source: 'supabase_table',
                };

                // Update last_login_at in background
                Promise.resolve(
                  supabase
                    .from('admin_users')
                    .update({ last_login_at: new Date().toISOString() })
                    .eq('id', userRecord.id)
                ).catch(() => {});
              }
            }
          }
        } catch (tableErr) {
          console.warn('[api/admin/login] Supabase admin_users table check failed:', tableErr);
        }
      }
    }

    // 4. Fallback to Environment Variables credentials (ADMIN_EMAIL & ADMIN_PASSWORD)
    if (!authenticatedUser) {
      const { email: serverEmail, password: serverPassword } = getAdminServerConfig();
      const emailMatches = timingSafeCompare(inputEmail, serverEmail);
      const passwordMatches =
        timingSafeCompare(inputPassword, serverPassword) ||
        timingSafeCompare(inputPassword.trim(), serverPassword) ||
        timingSafeCompare(inputPassword, serverPassword.trim());

      if (emailMatches && passwordMatches) {
        authenticatedUser = {
          email: serverEmail,
          role: 'admin',
          source: 'env',
        };
      }
    }

    // 5. Verification Check: if none matched
    if (!authenticatedUser) {
      const updatedRateLimit = recordFailedLogin(rateLimitKey);
      return sendJson(res, 401, {
        success: false,
        error: updatedRateLimit.isLocked
          ? 'Account locked out due to multiple failed login attempts. Please wait 15 minutes.'
          : `Invalid email or password. ${updatedRateLimit.remainingAttempts} attempt(s) remaining.`,
        rateLimit: updatedRateLimit,
      });
    }

    // 6. Reset rate limit on successful password verification
    resetRateLimit(rateLimitKey);

    // 7. If TOTP is enabled, NEVER issue the real admin session yet.
    // Issue only a short-lived HttpOnly pre-auth cookie. The session is
    // created by /api/admin/verify-2fa after the second factor succeeds.
    if (supabase) {
      try {
        const { data: twoFaRow } = await supabase
          .from('site_settings')
          .select('value')
          .eq('key', `2fa_${inputEmail}`)
          .maybeSingle();
        if (twoFaRow?.value?.enabled && twoFaRow?.value?.secret) {
          const pending = signPending2FAToken(inputEmail, sessionSecret);
          setPending2FACookie(res, pending.token);
          return sendJson(res, 200, {
            success: true,
            requires2FA: true,
            user: { email: inputEmail, role: 'admin' },
            expiresAt: pending.expiresAt,
          });
        }
      } catch {
        // If 2FA storage cannot be read, fail closed rather than silently
        // downgrading a configured account to password-only authentication.
        return sendJson(res, 503, {
          success: false,
          error: 'Security verification service is temporarily unavailable. Please try again.',
        });
      }
    }

    // 8. Generate signed JWT session token (4 hours normal, 30 days if remember me)
    const durationSec = rememberMe ? 30 * 24 * 60 * 60 : 4 * 60 * 60;
    const user = {
      email: authenticatedUser.email,
      role: authenticatedUser.role,
      lastLoginAt: Date.now(),
    };

    const { token, expiresAt } = signSessionToken(user, durationSec * 1000, sessionSecret);

    // 9. Set secure HttpOnly cookie
    setSessionCookie(res, token, durationSec);

    // 10. Return success response
    return sendJson(res, 200, {
      success: true,
      user,
      token,
      expiresAt,
    });
  } catch (fatalError: any) {
    console.error('[api/admin/login] Fatal error during login processing:', fatalError);
    return sendJson(res, 500, {
      success: false,
      error: `Server processing error: ${fatalError?.message || 'Unexpected failure'}.`,
    });
  }
}
