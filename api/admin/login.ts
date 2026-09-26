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
  const inputEmail = body.email.trim().toLowerCase();
  const inputPassword = body.password;
  const rememberMe = Boolean(body.rememberMe);

  // 3. Timing-safe comparison against server credentials
  const emailMatches = timingSafeCompare(inputEmail, serverEmail);
  const passwordMatches = timingSafeCompare(inputPassword, serverPassword);

  if (!emailMatches || !passwordMatches) {
    const updatedRateLimit = recordFailedLogin(rateLimitKey);
    return sendJson(res, 401, {
      success: false,
      error: updatedRateLimit.isLocked
        ? 'Account locked out due to multiple failed login attempts. Please wait 15 minutes.'
        : `Invalid email or password. ${updatedRateLimit.remainingAttempts} attempt(s) remaining.`,
      rateLimit: updatedRateLimit,
    });
  }

  // 4. Reset rate limit on success
  resetRateLimit(rateLimitKey);

  // 5. Generate signed JWT session token (4 hours normal, 30 days if remember me)
  const durationSec = rememberMe ? 30 * 24 * 60 * 60 : 4 * 60 * 60;
  const user = {
    email: serverEmail,
    role: 'admin' as const,
    lastLoginAt: Date.now(),
  };

  const { token, expiresAt } = signSessionToken(user, durationSec * 1000, sessionSecret);

  // 6. Set secure HttpOnly cookie
  setSessionCookie(res, token, durationSec);

  // 7. Return success response
  return sendJson(res, 200, {
    success: true,
    user,
    token, // Provided for fallback Authorization Bearer header if cookies restricted
    expiresAt,
  });
}
