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
  let rawEmail = (process.env.ADMIN_EMAIL || 'admin@onlinetools.internal').trim().toLowerCase();
  let rawPassword = (process.env.ADMIN_PASSWORD || 'AdminPass2026!').trim();
  let rawSecret = (process.env.ADMIN_SESSION_SECRET || '').trim();

  // Strip accidental surrounding quotes if user entered them in Vercel UI (e.g. "admin@gmail.com" or 'pass123')
  const email = rawEmail.replace(/^["']|["']$/g, '').trim() || 'admin@onlinetools.internal';
  const password = rawPassword.replace(/^["']|["']$/g, '').trim() || 'AdminPass2026!';
  const sessionSecret = rawSecret.replace(/^["']|["']$/g, '').trim() || 'online_tools_secure_admin_jwt_secret_key_2026_xyz';

  return { email, password, sessionSecret };
}

/**
 * Verifies admin_users.password_hash.
 * Supports the legacy plaintext value currently in the database and
 * transparently upgrades it to a salted scrypt hash after successful login.
 */
export function verifyAdminPassword(
  password: string,
  storedValue: string
): { valid: boolean; needsRehash: boolean } {
  try {
    if (!storedValue) return { valid: false, needsRehash: false };

    const parts = storedValue.split(' to prevent timing attacks
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

export function signPending2FAToken(email: string, secret: string): { token: string; expiresAt: number } {
  const expiresAt = Date.now() + 5 * 60 * 1000;
  const payload = Buffer.from(JSON.stringify({
    purpose: 'admin_2fa_pending',
    sub: email,
    exp: Math.floor(expiresAt / 1000),
  })).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return { token: `${payload}.${signature}`, expiresAt };
}

export function verifyPending2FAToken(token: string, secret: string): { email: string; expiresAt: number } | null {
  try {
    const [payload, signature] = String(token || '').split('.');
    if (!payload || !signature) return null;
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
    if (!timingSafeCompare(signature, expected)) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (data.purpose !== 'admin_2fa_pending' || !data.sub || data.exp * 1000 <= Date.now()) return null;
    return { email: String(data.sub), expiresAt: data.exp * 1000 };
  } catch { return null; }
}

export function setPending2FACookie(res: ServerResponse, token: string) {
  const secure = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  res.setHeader('Set-Cookie', `admin_2fa_pending=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=300${secure ? '; Secure' : ''}`);
}

export function clearPending2FACookie(res: ServerResponse) {
  res.setHeader('Set-Cookie', 'admin_2fa_pending=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
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
 * Helper to parse JSON body from incoming request safely in Vercel Serverless & Node
 */
export async function parseJsonBody<T = any>(req: IncomingMessage): Promise<T | null> {
  const anyReq = req as any;

  // 1. If body is already parsed by Vercel / middleware
  if (anyReq.body) {
    if (typeof anyReq.body === 'object' && !Buffer.isBuffer(anyReq.body)) {
      return anyReq.body as T;
    }
    if (typeof anyReq.body === 'string') {
      try {
        return JSON.parse(anyReq.body) as T;
      } catch {
        return null;
      }
    }
    if (Buffer.isBuffer(anyReq.body)) {
      try {
        return JSON.parse(anyReq.body.toString('utf-8')) as T;
      } catch {
        return null;
      }
    }
  }

  // 2. If request stream has already ended and body is missing
  if (anyReq.readableEnded || anyReq.complete) {
    return null;
  }

  // 3. Otherwise read stream with safety timeout (avoids hanging in serverless)
  return new Promise((resolve) => {
    let resolved = false;
    let rawData = '';

    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(null);
      }
    }, 2000);

    req.on('data', (chunk) => {
      rawData += chunk;
      if (rawData.length > 1e6) {
        req.destroy();
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          resolve(null);
        }
      }
    });

    req.on('end', () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        if (!rawData.trim()) {
          return resolve(null);
        }
        try {
          resolve(JSON.parse(rawData) as T);
        } catch {
          resolve(null);
        }
      }
    });

    req.on('error', () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        resolve(null);
      }
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
);
    if (parts.length === 3 && parts[0] === 'scrypt') {
      const salt = Buffer.from(parts[1], 'base64url');
      const expected = Buffer.from(parts[2], 'base64url');
      if (salt.length < 16 || expected.length !== 64) {
        return { valid: false, needsRehash: false };
      }
      const actual = crypto.scryptSync(password, salt, 64);
      return {
        valid: crypto.timingSafeEqual(actual, expected),
        needsRehash: false,
      };
    }

    const valid = timingSafeCompare(password, storedValue);
    return { valid, needsRehash: valid };
  } catch {
    return { valid: false, needsRehash: false };
  }
}

export function hashAdminPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `scrypt${salt.toString('base64url')}${derivedKey.toString('base64url')}`;
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

export function signPending2FAToken(email: string, secret: string): { token: string; expiresAt: number } {
  const expiresAt = Date.now() + 5 * 60 * 1000;
  const payload = Buffer.from(JSON.stringify({
    purpose: 'admin_2fa_pending',
    sub: email,
    exp: Math.floor(expiresAt / 1000),
  })).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
  return { token: `${payload}.${signature}`, expiresAt };
}

export function verifyPending2FAToken(token: string, secret: string): { email: string; expiresAt: number } | null {
  try {
    const [payload, signature] = String(token || '').split('.');
    if (!payload || !signature) return null;
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('base64url');
    if (!timingSafeCompare(signature, expected)) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (data.purpose !== 'admin_2fa_pending' || !data.sub || data.exp * 1000 <= Date.now()) return null;
    return { email: String(data.sub), expiresAt: data.exp * 1000 };
  } catch { return null; }
}

export function setPending2FACookie(res: ServerResponse, token: string) {
  const secure = process.env.NODE_ENV === 'production' || process.env.VERCEL === '1';
  res.setHeader('Set-Cookie', `admin_2fa_pending=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=300${secure ? '; Secure' : ''}`);
}

export function clearPending2FACookie(res: ServerResponse) {
  res.setHeader('Set-Cookie', 'admin_2fa_pending=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0');
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
 * Helper to parse JSON body from incoming request safely in Vercel Serverless & Node
 */
export async function parseJsonBody<T = any>(req: IncomingMessage): Promise<T | null> {
  const anyReq = req as any;

  // 1. If body is already parsed by Vercel / middleware
  if (anyReq.body) {
    if (typeof anyReq.body === 'object' && !Buffer.isBuffer(anyReq.body)) {
      return anyReq.body as T;
    }
    if (typeof anyReq.body === 'string') {
      try {
        return JSON.parse(anyReq.body) as T;
      } catch {
        return null;
      }
    }
    if (Buffer.isBuffer(anyReq.body)) {
      try {
        return JSON.parse(anyReq.body.toString('utf-8')) as T;
      } catch {
        return null;
      }
    }
  }

  // 2. If request stream has already ended and body is missing
  if (anyReq.readableEnded || anyReq.complete) {
    return null;
  }

  // 3. Otherwise read stream with safety timeout (avoids hanging in serverless)
  return new Promise((resolve) => {
    let resolved = false;
    let rawData = '';

    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        resolve(null);
      }
    }, 2000);

    req.on('data', (chunk) => {
      rawData += chunk;
      if (rawData.length > 1e6) {
        req.destroy();
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          resolve(null);
        }
      }
    });

    req.on('end', () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        if (!rawData.trim()) {
          return resolve(null);
        }
        try {
          resolve(JSON.parse(rawData) as T);
        } catch {
          resolve(null);
        }
      }
    });

    req.on('error', () => {
      if (!resolved) {
        resolved = true;
        clearTimeout(timer);
        resolve(null);
      }
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
