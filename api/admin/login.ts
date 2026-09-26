import type { IncomingMessage, ServerResponse } from 'http';
import {
  getAdminServerConfig,
  timingSafeCompare,
  checkRateLimit,
  recordFailedLogin,
  resetRateLimit,
  signSessionToken,
  setSessionCookie,
  parseJsonBody,
  sendJson,
} from '../_lib/adminAuthServer';
import { getSupabaseServerClient } from '../_lib/supabaseServer';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

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

  // 2. Parse body
  const body = await parseJsonBody<{ email?: string; password?: string; rememberMe?: boolean }>(req);
  if (!body || !body.email || !body.password) {
    return sendJson(res, 400, {
      success: false,
      error: 'Email and password are required.',
    });
  }

  const { email: serverEmail, password: serverPassword, sessionSecret } = getAdminServerConfig();
  const inputEmail = (body.email || '').trim().toLowerCase();
  const inputPassword = body.password || '';
  const rememberMe = Boolean(body.rememberMe);

  let authenticatedUser: { email: string; role: 'admin'; source: string } | null = null;

  // 3. Try Authenticating with Supabase (if Supabase is connected)
  const supabase = getSupabaseServerClient();
  if (supabase) {
    try {
      const { data: userRecord, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', inputEmail)
        .maybeSingle();

      if (!error && userRecord && userRecord.password_hash) {
        const passwordMatches =
          timingSafeCompare(inputPassword, userRecord.password_hash) ||
          timingSafeCompare(inputPassword.trim(), userRecord.password_hash.trim());

        if (passwordMatches) {
          authenticatedUser = {
            email: userRecord.email,
            role: 'admin',
            source: 'supabase',
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
    } catch (err) {
      console.warn('[api/admin/login] Supabase auth check warning:', err);
    }
  }

  // 4. Fallback to Environment Variables credentials
  if (!authenticatedUser) {
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

  // 5. Verification Check
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

  // 6. Reset rate limit on success
  resetRateLimit(rateLimitKey);

  // 7. Generate signed JWT session token (4 hours normal, 30 days if remember me)
  const durationSec = rememberMe ? 30 * 24 * 60 * 60 : 4 * 60 * 60;
  const user = {
    email: authenticatedUser.email,
    role: authenticatedUser.role,
    lastLoginAt: Date.now(),
  };

  const { token, expiresAt } = signSessionToken(user, durationSec * 1000, sessionSecret);

  // 8. Set secure HttpOnly cookie
  setSessionCookie(res, token, durationSec);

  // 9. Return success response
  return sendJson(res, 200, {
    success: true,
    user,
    token,
    expiresAt,
  });
}
