export interface SiteConfig {
  name: string;
  description: string;
  privacyEffectiveDate: string;
  privacyLastUpdated: string;
  termsEffectiveDate: string;
  termsLastUpdated: string;
  cookieEffectiveDate: string;
  cookieLastUpdated: string;
  contactEmail: string;
  privacyContactEmail: string;
}

export function getSiteUrl(): string {
  let envUrl: string | undefined;

  try {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      envUrl =
        import.meta.env.NEXT_PUBLIC_SITE_URL ||
        import.meta.env.VITE_SITE_URL ||
        import.meta.env.APP_URL;
    }
  } catch {
    // fall back to process.env if in node script
  }

  if (!envUrl && typeof process !== 'undefined' && process.env) {
    envUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      process.env.VITE_SITE_URL ||
      process.env.APP_URL;
  }

  if (envUrl && typeof envUrl === 'string' && envUrl.trim() && envUrl.trim() !== 'MY_APP_URL') {
    return envUrl.trim().replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return window.location.origin.replace(/\/+$/, '');
  }

  return 'https://onlinetools.app';
}

function getEnv(key: string, fallback = ''): string {
  try {
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key] !== undefined) {
      return import.meta.env[key];
    }
  } catch {
    // ignore
  }
  if (typeof process !== 'undefined' && process.env && process.env[key] !== undefined) {
    return process.env[key] || fallback;
  }
  return fallback;
}

export const SITE_CONFIG: SiteConfig = {
  name: 'Online Tools',
  description: 'Fast, accurate, and easy-to-use online calculators, converters, text utilities, and practical tools.',
  // Configurable dates via environment variables without hardcoded or invented assumptions
  privacyEffectiveDate: getEnv('VITE_PRIVACY_EFFECTIVE_DATE', 'September 2024'),
  privacyLastUpdated: getEnv('VITE_PRIVACY_LAST_UPDATED', 'September 2024'),
  termsEffectiveDate: getEnv('VITE_TERMS_EFFECTIVE_DATE', 'September 2024'),
  termsLastUpdated: getEnv('VITE_TERMS_LAST_UPDATED', 'September 2024'),
  cookieEffectiveDate: getEnv('VITE_COOKIE_EFFECTIVE_DATE', 'September 2024'),
  cookieLastUpdated: getEnv('VITE_COOKIE_LAST_UPDATED', 'September 2024'),
  // Contact emails configured via environment variables
  contactEmail: getEnv('VITE_CONTACT_EMAIL', ''),
  privacyContactEmail: getEnv('VITE_PRIVACY_CONTACT_EMAIL', getEnv('VITE_CONTACT_EMAIL', '')),
};
