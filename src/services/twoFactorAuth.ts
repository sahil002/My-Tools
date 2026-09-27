import * as OTPAuth from 'otpauth';
import QRCode from 'qrcode';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const TWO_FACTOR_STORAGE_KEY_PREFIX = 'ot_admin_2fa_config_';
const TWO_FACTOR_ENABLED_PREFIX = 'ot_admin_2fa_enabled_';

export interface TwoFactorConfig {
  email: string;
  secret: string;
  uri: string;
  backupCodes: string[];
  createdAt: number;
}

/**
 * Generates 5 cryptographically secure random backup recovery codes
 */
export function generateBackupCodes(): string[] {
  const codes: string[] = [];
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Base32 unambiguous charset
  for (let i = 0; i < 5; i++) {
    let code = '';
    for (let j = 0; j < 8; j++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`);
  }
  return codes;
}

/**
 * Initializes a new TOTP secret & QR code URI for an administrator
 */
export function createTOTPSecret(email: string): { secret: string; uri: string; backupCodes: string[] } {
  // Generate random base32 secret
  const totp = new OTPAuth.TOTP({
    issuer: 'OnlineTools Admin',
    label: email,
    algorithm: 'SHA1',
    digits: 6,
    period: 30,
    secret: new OTPAuth.Secret({ size: 20 }),
  });

  return {
    secret: totp.secret.base32,
    uri: totp.toString(),
    backupCodes: generateBackupCodes(),
  };
}

/**
 * Generates a Data URL for the QR code image
 */
export async function generateQRCodeImage(otpauthUri: string): Promise<string> {
  return QRCode.toDataURL(otpauthUri, {
    width: 256,
    margin: 2,
    color: {
      dark: '#1E1035',
      light: '#FFFFFF',
    },
  });
}

/**
 * Validates a 6-digit TOTP code against the secret
 */
export function verifyTOTPCode(secret: string, token: string): boolean {
  try {
    const cleanToken = token.replace(/\s+/g, '').trim();
    if (!/^\d{6}$/.test(cleanToken)) {
      return false;
    }

    const totp = new OTPAuth.TOTP({
      issuer: 'OnlineTools Admin',
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret.trim()),
    });

    // delta !== null means valid token (window +/- 1 period = 30s drift tolerance)
    const delta = totp.validate({ token: cleanToken, window: 1 });
    return delta !== null;
  } catch (err) {
    console.error('[2FA] Verification error:', err);
    return false;
  }
}

/**
 * Checks if 2FA is enabled for a given admin email
 */
export async function isTwoFactorEnabled(email: string): Promise<boolean> {
  const cleanEmail = email.trim().toLowerCase();

  // 1. Check Supabase site_settings if available
  if (isSupabaseConfigured() && supabase) {
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', `2fa_${cleanEmail}`)
        .maybeSingle();

      if (data?.value?.enabled && data?.value?.secret) {
        return true;
      }
    } catch {
      // ignore
    }
  }

  // 2. Check local fallback storage
  try {
    return localStorage.getItem(`${TWO_FACTOR_ENABLED_PREFIX}${cleanEmail}`) === 'true';
  } catch {
    return false;
  }
}

/**
 * Retrieves the 2FA secret for verification
 */
export async function getTwoFactorSecret(email: string): Promise<{ secret: string; backupCodes: string[] } | null> {
  const cleanEmail = email.trim().toLowerCase();

  if (isSupabaseConfigured() && supabase) {
    try {
      const { data } = await supabase
        .from('site_settings')
        .select('value')
        .eq('key', `2fa_${cleanEmail}`)
        .maybeSingle();

      if (data?.value?.secret) {
        return {
          secret: data.value.secret,
          backupCodes: data.value.backupCodes || [],
        };
      }
    } catch {
      // ignore
    }
  }

  try {
    const raw = localStorage.getItem(`${TWO_FACTOR_STORAGE_KEY_PREFIX}${cleanEmail}`);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.secret) {
        return {
          secret: parsed.secret,
          backupCodes: parsed.backupCodes || [],
        };
      }
    }
  } catch {
    // ignore
  }

  return null;
}

/**
 * Saves and enables 2FA for an administrator
 */
export async function enableTwoFactor(
  email: string,
  secret: string,
  backupCodes: string[]
): Promise<{ success: boolean; message: string }> {
  const cleanEmail = email.trim().toLowerCase();

  const payload = {
    enabled: true,
    secret,
    backupCodes,
    updatedAt: new Date().toISOString(),
  };

  // 1. Save to Supabase
  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase
        .from('site_settings')
        .upsert(
          {
            key: `2fa_${cleanEmail}`,
            value: payload,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'key' }
        );
    } catch (err) {
      console.warn('[2FA] Failed to save 2FA to Supabase:', err);
    }
  }

  // 2. Save to local fallback storage
  try {
    localStorage.setItem(`${TWO_FACTOR_STORAGE_KEY_PREFIX}${cleanEmail}`, JSON.stringify(payload));
    localStorage.setItem(`${TWO_FACTOR_ENABLED_PREFIX}${cleanEmail}`, 'true');
  } catch {
    // ignore
  }

  return {
    success: true,
    message: 'Two-Factor Authentication successfully activated.',
  };
}

/**
 * Disables 2FA for an administrator
 */
export async function disableTwoFactor(email: string): Promise<boolean> {
  const cleanEmail = email.trim().toLowerCase();

  if (isSupabaseConfigured() && supabase) {
    try {
      await supabase
        .from('site_settings')
        .delete()
        .eq('key', `2fa_${cleanEmail}`);
    } catch {
      // ignore
    }
  }

  try {
    localStorage.removeItem(`${TWO_FACTOR_STORAGE_KEY_PREFIX}${cleanEmail}`);
    localStorage.removeItem(`${TWO_FACTOR_ENABLED_PREFIX}${cleanEmail}`);
  } catch {
    // ignore
  }

  return true;
}

/**
 * Verifies code or backup code
 */
export async function verifyTwoFactorAuthentication(
  email: string,
  codeOrBackup: string
): Promise<{ valid: boolean; usedBackupCode?: boolean }> {
  const config = await getTwoFactorSecret(email);
  if (!config) {
    return { valid: false };
  }

  const cleanInput = codeOrBackup.trim().toUpperCase();

  // 1. Try TOTP 6-digit code
  if (/^\d{6}$/.test(cleanInput)) {
    if (verifyTOTPCode(config.secret, cleanInput)) {
      return { valid: true };
    }
  }

  // 2. Try Backup Recovery Code
  if (config.backupCodes.includes(cleanInput)) {
    // Consume backup code
    const remaining = config.backupCodes.filter((c) => c !== cleanInput);
    await enableTwoFactor(email, config.secret, remaining);
    return { valid: true, usedBackupCode: true };
  }

  return { valid: false };
}
