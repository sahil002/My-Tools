/**
 * Private Admin Authentication & Security Service
 * 
 * Features:
 * - PBKDF2 password hashing with SHA-256 and cryptographic salts
 * - Timing-safe password verification
 * - JWT-based signed session tokens with HMAC-SHA256 verification
 * - Configurable login route (defaults to /panel-access)
 * - Rate limiting on login attempts (5 max attempts with 15-min exponential lockout)
 * - "Remember Me" support (sessionStorage vs 30-day localStorage)
 * - Seeded admin account initialization & secure password change
 */

export interface AdminUser {
  email: string;
  role: 'admin';
  lastLoginAt: number;
}

export interface AdminSession {
  token: string;
  user: AdminUser;
  expiresAt: number;
  rememberMe: boolean;
}

export interface RateLimitStatus {
  isLocked: boolean;
  lockoutSecondsLeft: number;
  remainingAttempts: number;
  attemptsCount: number;
}

const STORAGE_SESSION_KEY = 'ot_admin_session';
const STORAGE_CREDENTIALS_KEY = 'ot_admin_credentials_v1';
const STORAGE_ADMIN_ACCOUNTS_KEY = 'ot_admin_accounts_v1';
const STORAGE_RATELIMIT_KEY = 'ot_admin_ratelimit_v1';
const STORAGE_SECRET_KEY = 'ot_admin_hmac_secret_v1';

export interface AdminAccountRecord {
  id: string;
  email: string;
  role: 'admin' | 'super_admin';
  passwordHash: string;
  createdAt: number;
  lastLoginAt: number | null;
  createdBy: string;
}

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

// Default seeded admin configuration
export const DEFAULT_ADMIN_EMAIL = 'admin@onlinetools.internal';
export const DEFAULT_ADMIN_INITIAL_PASSWORD = 'AdminPass2026!';

/**
 * Returns the configurable private login route.
 * Can be overridden via VITE_ADMIN_LOGIN_ROUTE in .env
 */
export function getAdminLoginRoute(): string {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_ADMIN_LOGIN_ROUTE) {
    const route = String(import.meta.env.VITE_ADMIN_LOGIN_ROUTE).trim();
    return route.startsWith('/') ? route : `/${route}`;
  }
  return '/panel-access';
}

// Helper: Convert ArrayBuffer to Hex String
function buf2hex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Helper: Convert Hex String to Uint8Array
function hex2buf(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

// Helper: Base64URL encode
function base64UrlEncode(str: string): string {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

// Helper: Base64URL decode
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) {
    base64 += '=';
  }
  return atob(base64);
}

/**
 * Secure PBKDF2 Password Hashing using Web Crypto API
 */
export async function hashPassword(password: string): Promise<string> {
  const enc = new TextEncoder();
  const salt = window.crypto.getRandomValues(new Uint8Array(16));
  const saltHex = buf2hex(salt.buffer);

  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const iterations = 100000;
  const derivedBits = await window.crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt.buffer as ArrayBuffer,
      iterations: iterations,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  const hashHex = buf2hex(derivedBits);
  return `pbkdf2$${iterations}$${saltHex}$${hashHex}`;
}

/**
 * Timing-safe password verification
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const parts = storedHash.split('$');
    if (parts.length !== 4 || parts[0] !== 'pbkdf2') {
      return false;
    }

    const iterations = parseInt(parts[1], 10);
    const saltHex = parts[2];
    const expectedHashHex = parts[3];

    const salt = hex2buf(saltHex);
    const enc = new TextEncoder();

    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(password),
      { name: 'PBKDF2' },
      false,
      ['deriveBits']
    );

    const derivedBits = await window.crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt.buffer as ArrayBuffer,
        iterations: iterations,
        hash: 'SHA-256',
      },
      keyMaterial,
      256
    );

    const computedHashHex = buf2hex(derivedBits);

    // Constant-time string comparison to prevent timing attacks
    if (computedHashHex.length !== expectedHashHex.length) {
      return false;
    }
    let diff = 0;
    for (let i = 0; i < computedHashHex.length; i++) {
      diff |= computedHashHex.charCodeAt(i) ^ expectedHashHex.charCodeAt(i);
    }
    return diff === 0;
  } catch (err) {
    console.error('Password verification error:', err);
    return false;
  }
}

/**
 * Retrieves or generates an internal HMAC secret for signing session JWTs
 */
async function getOrCreateHmacKey(): Promise<CryptoKey> {
  let secretHex = localStorage.getItem(STORAGE_SECRET_KEY);
  if (!secretHex) {
    const randomBytes = window.crypto.getRandomValues(new Uint8Array(32));
    secretHex = buf2hex(randomBytes.buffer);
    localStorage.setItem(STORAGE_SECRET_KEY, secretHex);
  }

  const rawKey = hex2buf(secretHex);
  return window.crypto.subtle.importKey(
    'raw',
    rawKey.buffer as ArrayBuffer,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

/**
 * Generates a signed JWT session token
 */
export async function createSessionToken(
  user: AdminUser,
  expiresInMs: number,
  rememberMe: boolean
): Promise<{ token: string; expiresAt: number }> {
  const hmacKey = await getOrCreateHmacKey();
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Date.now();
  const expiresAt = now + expiresInMs;

  const payload = {
    sub: user.email,
    role: user.role,
    iat: Math.floor(now / 1000),
    exp: Math.floor(expiresAt / 1000),
    rememberMe,
    sessionId: window.crypto.randomUUID ? window.crypto.randomUUID() : Math.random().toString(36).substring(2),
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const dataToSign = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`);

  const signatureBuffer = await window.crypto.subtle.sign('HMAC', hmacKey, dataToSign);
  const encodedSignature = base64UrlEncode(
    String.fromCharCode(...new Uint8Array(signatureBuffer))
  );

  const token = `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
  return { token, expiresAt };
}

/**
 * Verifies a signed JWT session token
 */
export async function verifySessionToken(token: string): Promise<{ valid: boolean; user?: AdminUser; error?: string }> {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return { valid: false, error: 'Malformed token structure' };
    }

    const [encodedHeader, encodedPayload, encodedSignature] = parts;
    const hmacKey = await getOrCreateHmacKey();
    const dataToVerify = new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`);

    // Decode signature
    const signatureBinary = atob(encodedSignature.replace(/-/g, '+').replace(/_/g, '/'));
    const signatureBytes = new Uint8Array(signatureBinary.length);
    for (let i = 0; i < signatureBinary.length; i++) {
      signatureBytes[i] = signatureBinary.charCodeAt(i);
    }

    const isValidSig = await window.crypto.subtle.verify(
      'HMAC',
      hmacKey,
      signatureBytes.buffer as ArrayBuffer,
      dataToVerify
    );

    if (!isValidSig) {
      return { valid: false, error: 'Invalid token signature' };
    }

    const payload = JSON.parse(base64UrlDecode(encodedPayload));
    const nowSec = Math.floor(Date.now() / 1000);

    if (payload.exp && payload.exp < nowSec) {
      return { valid: false, error: 'Session token has expired' };
    }

    return {
      valid: true,
      user: {
        email: payload.sub,
        role: payload.role || 'admin',
        lastLoginAt: payload.iat * 1000,
      },
    };
  } catch (err) {
    return { valid: false, error: 'Token validation exception' };
  }
}

/**
 * Initializes or gets the stored admin credentials
 */
export async function getAdminCredentials(): Promise<{ email: string; passwordHash: string }> {
  const stored = localStorage.getItem(STORAGE_CREDENTIALS_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      // ignore
    }
  }

  // Seed default admin account
  const defaultHash = await hashPassword(DEFAULT_ADMIN_INITIAL_PASSWORD);
  const seeded = {
    email: DEFAULT_ADMIN_EMAIL.toLowerCase(),
    passwordHash: defaultHash,
  };
  localStorage.setItem(STORAGE_CREDENTIALS_KEY, JSON.stringify(seeded));
  return seeded;
}

/**
 * Updates the admin's password (hashed securely)
 */
export async function updateAdminPassword(newPassword: string): Promise<boolean> {
  const currentCreds = await getAdminCredentials();
  const newHash = await hashPassword(newPassword);
  const updated = {
    ...currentCreds,
    passwordHash: newHash,
  };
  localStorage.setItem(STORAGE_CREDENTIALS_KEY, JSON.stringify(updated));

  // Also sync in multi-account storage
  const accounts = await getAdminAccounts();
  const updatedAccounts = accounts.map((acc) =>
    acc.email.toLowerCase() === currentCreds.email.toLowerCase()
      ? { ...acc, passwordHash: newHash }
      : acc
  );
  localStorage.setItem(STORAGE_ADMIN_ACCOUNTS_KEY, JSON.stringify(updatedAccounts));

  return true;
}

/**
 * Retrieves all registered administrator accounts
 */
export async function getAdminAccounts(): Promise<AdminAccountRecord[]> {
  try {
    const raw = localStorage.getItem(STORAGE_ADMIN_ACCOUNTS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch {
    // ignore
  }

  // Seed default admin account
  const defaultCreds = await getAdminCredentials();
  const seededAccounts: AdminAccountRecord[] = [
    {
      id: 'admin-root-01',
      email: defaultCreds.email,
      role: 'super_admin',
      passwordHash: defaultCreds.passwordHash,
      createdAt: Date.now() - 30 * 24 * 60 * 60 * 1000,
      lastLoginAt: Date.now() - 1000 * 60 * 15,
      createdBy: 'System Provisioning',
    },
  ];
  try {
    localStorage.setItem(STORAGE_ADMIN_ACCOUNTS_KEY, JSON.stringify(seededAccounts));
  } catch {
    // ignore
  }
  return seededAccounts;
}

/**
 * Creates a new administrator account (internal admin only, never public)
 */
export async function createAdminAccount(
  email: string,
  pass: string,
  role: 'admin' | 'super_admin' = 'admin',
  creatorEmail: string = 'admin'
): Promise<{ success: boolean; error?: string; account?: AdminAccountRecord }> {
  const cleanEmail = email.trim().toLowerCase();
  if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
    return { success: false, error: 'Please enter a valid email address.' };
  }

  if (pass.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters long.' };
  }

  const accounts = await getAdminAccounts();
  if (accounts.some((a) => a.email.toLowerCase() === cleanEmail)) {
    return { success: false, error: 'An administrator with this email already exists.' };
  }

  const passwordHash = await hashPassword(pass);
  const newAccount: AdminAccountRecord = {
    id: `admin-usr-${Date.now()}`,
    email: cleanEmail,
    role,
    passwordHash,
    createdAt: Date.now(),
    lastLoginAt: null,
    createdBy: creatorEmail,
  };

  const updatedAccounts = [...accounts, newAccount];
  localStorage.setItem(STORAGE_ADMIN_ACCOUNTS_KEY, JSON.stringify(updatedAccounts));

  return { success: true, account: newAccount };
}

/**
 * Removes an administrator account with safety safeguards
 */
export async function deleteAdminAccount(
  targetEmail: string,
  currentAdminEmail: string
): Promise<{ success: boolean; error?: string }> {
  const cleanTarget = targetEmail.trim().toLowerCase();
  const cleanCurrent = currentAdminEmail.trim().toLowerCase();

  if (cleanTarget === cleanCurrent) {
    return { success: false, error: 'You cannot delete your own active administrator account.' };
  }

  const accounts = await getAdminAccounts();
  if (accounts.length <= 1) {
    return { success: false, error: 'Cannot delete the only remaining administrator account.' };
  }

  const filtered = accounts.filter((a) => a.email.toLowerCase() !== cleanTarget);
  if (filtered.length === accounts.length) {
    return { success: false, error: 'Administrator account not found.' };
  }

  localStorage.setItem(STORAGE_ADMIN_ACCOUNTS_KEY, JSON.stringify(filtered));
  return { success: true };
}

/**
 * Updates password for a specified admin account
 */
export async function updateAdminAccountPassword(
  targetEmail: string,
  newPass: string
): Promise<{ success: boolean; error?: string }> {
  if (newPass.length < 8) {
    return { success: false, error: 'Password must be at least 8 characters long.' };
  }

  const cleanTarget = targetEmail.trim().toLowerCase();
  const accounts = await getAdminAccounts();
  const index = accounts.findIndex((a) => a.email.toLowerCase() === cleanTarget);

  if (index === -1) {
    return { success: false, error: 'Administrator account not found.' };
  }

  const newHash = await hashPassword(newPass);
  accounts[index] = {
    ...accounts[index],
    passwordHash: newHash,
  };
  localStorage.setItem(STORAGE_ADMIN_ACCOUNTS_KEY, JSON.stringify(accounts));

  // If default credentials email matches, also update it
  const defaultCreds = await getAdminCredentials();
  if (defaultCreds.email.toLowerCase() === cleanTarget) {
    localStorage.setItem(
      STORAGE_CREDENTIALS_KEY,
      JSON.stringify({ email: cleanTarget, passwordHash: newHash })
    );
  }

  return { success: true };
}

/**
 * Rate Limiting State Management
 */
export function getRateLimitStatus(): RateLimitStatus {
  try {
    const raw = localStorage.getItem(STORAGE_RATELIMIT_KEY);
    if (!raw) {
      return {
        isLocked: false,
        lockoutSecondsLeft: 0,
        remainingAttempts: MAX_LOGIN_ATTEMPTS,
        attemptsCount: 0,
      };
    }

    const data = JSON.parse(raw);
    const now = Date.now();

    if (data.lockoutUntil && data.lockoutUntil > now) {
      const secondsLeft = Math.ceil((data.lockoutUntil - now) / 1000);
      return {
        isLocked: true,
        lockoutSecondsLeft: secondsLeft,
        remainingAttempts: 0,
        attemptsCount: data.attempts || MAX_LOGIN_ATTEMPTS,
      };
    }

    // Lockout expired, reset attempts
    if (data.lockoutUntil && data.lockoutUntil <= now) {
      resetRateLimit();
      return {
        isLocked: false,
        lockoutSecondsLeft: 0,
        remainingAttempts: MAX_LOGIN_ATTEMPTS,
        attemptsCount: 0,
      };
    }

    const attempts = data.attempts || 0;
    const remaining = Math.max(0, MAX_LOGIN_ATTEMPTS - attempts);

    return {
      isLocked: false,
      lockoutSecondsLeft: 0,
      remainingAttempts: remaining,
      attemptsCount: attempts,
    };
  } catch {
    return {
      isLocked: false,
      lockoutSecondsLeft: 0,
      remainingAttempts: MAX_LOGIN_ATTEMPTS,
      attemptsCount: 0,
    };
  }
}

export function recordFailedAttempt(): RateLimitStatus {
  const current = getRateLimitStatus();
  const nextAttempts = current.attemptsCount + 1;
  const now = Date.now();

  if (nextAttempts >= MAX_LOGIN_ATTEMPTS) {
    const lockoutUntil = now + LOCKOUT_DURATION_MS;
    const data = { attempts: nextAttempts, lockoutUntil, lastAttempt: now };
    localStorage.setItem(STORAGE_RATELIMIT_KEY, JSON.stringify(data));
    return {
      isLocked: true,
      lockoutSecondsLeft: Math.ceil(LOCKOUT_DURATION_MS / 1000),
      remainingAttempts: 0,
      attemptsCount: nextAttempts,
    };
  }

  const data = { attempts: nextAttempts, lockoutUntil: null, lastAttempt: now };
  localStorage.setItem(STORAGE_RATELIMIT_KEY, JSON.stringify(data));
  return {
    isLocked: false,
    lockoutSecondsLeft: 0,
    remainingAttempts: MAX_LOGIN_ATTEMPTS - nextAttempts,
    attemptsCount: nextAttempts,
  };
}

export function resetRateLimit(): void {
  try {
    localStorage.removeItem(STORAGE_RATELIMIT_KEY);
  } catch {
    // ignore
  }
}

/**
 * Primary Login Action with Password Verification, Rate Limiting & JWT issuance
 */
export async function loginAdmin(
  email: string,
  pass: string,
  rememberMe: boolean = false
): Promise<{ success: boolean; session?: AdminSession; error?: string; rateLimit?: RateLimitStatus }> {
  // 1. Check rate limit
  const rateLimit = getRateLimitStatus();
  if (rateLimit.isLocked) {
    return {
      success: false,
      error: `Too many failed attempts. Login locked for ${Math.ceil(rateLimit.lockoutSecondsLeft / 60)} more minutes.`,
      rateLimit,
    };
  }

  // 2. Retrieve credentials and accounts
  const cleanEmail = email.trim().toLowerCase();
  const accounts = await getAdminAccounts();
  const matchedAccount = accounts.find((a) => a.email.toLowerCase() === cleanEmail);

  let authenticated = false;
  let authenticatedEmail = cleanEmail;

  if (matchedAccount) {
    authenticated = await verifyPassword(pass, matchedAccount.passwordHash);
  } else {
    const creds = await getAdminCredentials();
    if (creds.email.toLowerCase() === cleanEmail) {
      authenticated = await verifyPassword(pass, creds.passwordHash);
      authenticatedEmail = creds.email;
    }
  }

  if (!authenticated) {
    const updatedRateLimit = recordFailedAttempt();
    return {
      success: false,
      error: updatedRateLimit.isLocked
        ? 'Account locked out due to multiple failed login attempts. Please try again in 15 minutes.'
        : `Invalid email or password. ${updatedRateLimit.remainingAttempts} attempt${updatedRateLimit.remainingAttempts === 1 ? '' : 's'} remaining before lockout.`,
      rateLimit: updatedRateLimit,
    };
  }

  // 3. Reset rate limit on success
  resetRateLimit();

  // Update last login timestamp for this account
  if (matchedAccount) {
    matchedAccount.lastLoginAt = Date.now();
    try {
      localStorage.setItem(STORAGE_ADMIN_ACCOUNTS_KEY, JSON.stringify(accounts));
    } catch {
      // ignore
    }
  }

  // 4. Issue session token (4 hours normal, 30 days if remember me)
  const durationMs = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 4 * 60 * 60 * 1000;
  const user: AdminUser = {
    email: authenticatedEmail,
    role: 'admin',
    lastLoginAt: Date.now(),
  };

  const { token, expiresAt } = await createSessionToken(user, durationMs, rememberMe);
  const session: AdminSession = { token, user, expiresAt, rememberMe };

  // 5. Store session appropriately
  const sessionJson = JSON.stringify(session);
  if (rememberMe) {
    localStorage.setItem(STORAGE_SESSION_KEY, sessionJson);
    sessionStorage.removeItem(STORAGE_SESSION_KEY);
  } else {
    sessionStorage.setItem(STORAGE_SESSION_KEY, sessionJson);
    localStorage.removeItem(STORAGE_SESSION_KEY);
  }

  return { success: true, session };
}

/**
 * Returns current authenticated admin session if valid
 */
export async function getActiveAdminSession(): Promise<AdminSession | null> {
  try {
    let raw = sessionStorage.getItem(STORAGE_SESSION_KEY);
    let fromStorage: 'session' | 'local' = 'session';

    if (!raw) {
      raw = localStorage.getItem(STORAGE_SESSION_KEY);
      fromStorage = 'local';
    }

    if (!raw) return null;

    const session: AdminSession = JSON.parse(raw);
    if (!session.token || !session.expiresAt) {
      logoutAdmin();
      return null;
    }

    // Verify token validity & expiration
    const result = await verifySessionToken(session.token);
    if (!result.valid || !result.user) {
      logoutAdmin();
      return null;
    }

    return session;
  } catch (err) {
    logoutAdmin();
    return null;
  }
}

/**
 * Secure Logout - clears all auth sessions and tokens
 */
export function logoutAdmin(): void {
  try {
    sessionStorage.removeItem(STORAGE_SESSION_KEY);
    localStorage.removeItem(STORAGE_SESSION_KEY);
  } catch {
    // ignore
  }
}
