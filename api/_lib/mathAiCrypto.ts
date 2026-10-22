import crypto from 'crypto';

function getEncryptionKey(): Buffer {
  const secret = String(process.env.MATH_AI_ENCRYPTION_KEY || '').trim();
  if (!secret) throw new Error('MATH_AI_ENCRYPTION_KEY is not configured.');
  // Accept a 64-char hex key or derive a fixed 32-byte key from a strong secret.
  if (/^[a-f0-9]{64}$/i.test(secret)) return Buffer.from(secret, 'hex');
  return crypto.createHash('sha256').update(secret, 'utf8').digest();
}

export function encryptProviderKey(plaintext: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', getEncryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return ['v1', iv.toString('base64url'), tag.toString('base64url'), encrypted.toString('base64url')].join('.');
}

export function decryptProviderKey(ciphertext: string): string {
  const [version, ivText, tagText, dataText] = String(ciphertext || '').split('.');
  if (version !== 'v1' || !ivText || !tagText || !dataText) throw new Error('Stored provider credential is invalid.');
  const decipher = crypto.createDecipheriv('aes-256-gcm', getEncryptionKey(), Buffer.from(ivText, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagText, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(dataText, 'base64url')), decipher.final()]).toString('utf8');
}
