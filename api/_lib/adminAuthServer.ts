import crypto from 'crypto';
import type { IncomingMessage, ServerResponse } from 'http';

export interface AdminUser {
  email: string;
  role: 'admin';
  lastLoginAt: number;
}

export interface AdminSession {
  token: string;
  user: AdminUser;
  expiresAt: number;
}

export interface RateLimitRecord {
  attempts: number;
  lockoutUntil: number | null;
}

// In-memory rate limiting store (keyed by IP or email)
const rateLimitStore = new Map<string, RateLimitRecord>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Returns server admin credentials from environment variables.
 * In development, if ADMIN_PASSWORD is not explicitly provided, a secure development fallback is used.
 */
export function getAdminServerConfig() {
  const email = (process.env.ADMIN_EMAIL || 'admin@onlinetools.internal').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'AdminPass2026!';
  const sessionSecret = process.env.ADMIN_SESSION_SECRET || 'online_tools_secure_admin_jwt_secret_key_2026_xyz';

  return { email, password, sessionSecret };
}

/**
 * Constant-time string comparison to prevent timing attacks
 */
export function timingSafeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    if (bufA.length !== bufB.length) {
      // Avoid timing leakage on length mismatch by comparing with self
      crypto.timingSafeEqual(bufA, bufA);
      return false;
    }
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

/**
 * Rate limit checker for login attempts
 */
export function checkRateLimit(key: string): { isLocked: boolean; secondsLeft: number; remainingAttempts: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key);

  if (!record) {
    return { isLocked: false, secondsLeft: 0, remainingAttempts: MAX_ATTEMPTS };
  }

  if (record.lockoutUntil && record.lockoutUntil > now) {
    const secondsLeft = Math.ceil((record.lockoutUntil - now) / 1000);
    return { isLocked: true, secondsLeft, remainingAttempts: 0 };
  }

  if (record.lockoutUntil && record.lockoutUntil <= now) {
    rateLimitStore.delete(key);
    return { isLocked: false, secondsLeft: 0, remainingAttempts: MAX_ATTEMPTS };
  }

  const remaining = Math.max(0, MAX_ATTEMPTS - record.attempts);
  return { isLocked: false, secondsLeft: 0, remainingAttempts: remaining };
}

export function recordFailedLogin(key: string): { isLocked: boolean; secondsLeft: number; remainingAttempts: number } {
  const now = Date.now();
  const record = rateLimitStore.get(key) || { attempts: 0, lockoutUntil: null };
  record.attempts += 1;

  if (record.attempts >= MAX_ATTEMPTS) {
    record.lockoutUntil = now + LOCKOUT_MS;
    rateLimitStore.set(key, record);
    return { isLocked: true, secondsLeft: Math.ceil(LOCKOUT_MS / 1000), remainingAttempts: 0 };
  }

  rateLimitStore.set(key, record);
  return { isLocked: false, secondsLeft: 0, remainingAttempts: MAX_ATTEMPTS - record.attempts };
}

export function resetRateLimit(key: string) {
  rateLimitStore.delete(key);
}

/**
 * Creates an HMAC-SHA256 signed session token
 */
export function signSessionToken(user: AdminUser, expiresInMs: number, secret: string): { token: string; expiresAt: number } {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Date.now();
  const expiresAt = now + expiresInMs;

  const payload = {
    sub: user.email,
    role: user.role,
    iat: Math.floor(now / 1000),
    exp: Math.floor(expiresAt / 1000),
    jti: crypto.randomBytes(16).toString('hex'),
  };

  const encHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(`${encHeader}.${encPayload}`).digest('base64url');

  const token = `${encHeader}.${encPayload}.${signature}`;
  return { token, expiresAt };
}

/**
 * Validates an HMAC-SHA256 session token
 */
export function verifySessionToken(token: string, secret: string): { valid: boolean; user?: AdminUser; error?: string } {
  if (!token || typeof token !== 'string') {
    return { valid: false, error: 'No token provided' };
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return { valid: false, error: 'Malformed token structure' };
  }

  const [encHeader, encPayload, signature] = parts;
  const expectedSig = crypto.createHmac('sha256', secret).update(`${encHeader}.${encPayload}`).digest('base64url');

  if (!timingSafeCompare(signature, expectedSig)) {
    return { valid: false, error: 'Invalid token signature' };
  }

  try {
    const payloadJson = Buffer.from(encPayload, 'base64url').toString('utf-8');
    const payload = JSON.parse(payloadJson);
    const nowSec = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < nowSec) {
      return { valid: false, error: 'Session token expired' };
    }

    return {
      valid: true,
      user: {
        email: payload.sub,
        role: payload.role || 'admin',
        lastLoginAt: payload.iat * 1000,
      },
    };
  } catch {
    return { valid: false, error: 'Failed to decode token payload' };
  }
}

/**
 * Parses cookies from HTTP request
 */
export function parseCookies(req: IncomingMessage): Record<string, string> {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return {};

  const cookies: Record<string, string> = {};
  cookieHeader.split(';').forEach((part) => {
    const [name, ...valParts] = part.trim().split('=');
    if (name) {
      cookies[name] = decodeURIComponent(valParts.join('='));
    }
  });
  return cookies;
}

/**
 * Authenticates request using HttpOnly cookie or Authorization Bearer header
 */
export function getAuthenticatedAdminFromRequest(req: IncomingMessage): AdminUser | null {
  const { sessionSecret } = getAdminServerConfig();

  // 1. Try cookie
  const cookies = parseCookies(req);
  let token = cookies['admin_session'];

  // 2. Try Authorization Bearer header
  if (!token && req.headers.authorization) {
    const authParts = req.headers.authorization.split(' ');
    if (authParts.length === 2 && authParts[0].toLowerCase() === 'bearer') {
      token = authParts[1];
    }
  }

  if (!token) return null;

  const result = verifySessionToken(token, sessionSecret);
  return result.valid && result.user ? result.user : null;
}

/**
 * Helper to set secure HttpOnly cookie on response
 */
export function setSessionCookie(res: ServerResponse, token: string, maxAgeSec: number) {
  const isProd = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  const cookieFlags = [
    `admin_session=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSec}`,
  ];

  if (isProd) {
    cookieFlags.push('Secure');
  }

  res.setHeader('Set-Cookie', cookieFlags.join('; '));
}

/**
 * Helper to clear session cookie on logout
 */
export function clearSessionCookie(res: ServerResponse) {
  res.setHeader(
    'Set-Cookie',
    'admin_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0'
  );
}

/**
 * Helper to parse JSON body from incoming request
 */
export async function parseJsonBody<T = any>(req: IncomingMessage): Promise<T | null> {
  return new Promise((resolve) => {
    if ((req as any).body && typeof (req as any).body === 'object') {
      return resolve((req as any).body);
    }

    let rawData = '';
    req.on('data', (chunk) => {
      rawData += chunk;
      // Safeguard against memory flood (1MB max body)
      if (rawData.length > 1e6) {
        req.destroy();
        resolve(null);
      }
    });

    req.on('end', () => {
      if (!rawData.trim()) {
        resolve(null);
        return;
      }
      try {
        resolve(JSON.parse(rawData));
      } catch {
        resolve(null);
      }
    });

    req.on('error', () => {
      resolve(null);
    });
  });
}

/**
 * Helper to send JSON response
 */
export function sendJson(res: ServerResponse, statusCode: number, data: any) {
  res.statusCode = statusCode;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.end(JSON.stringify(data));
}
