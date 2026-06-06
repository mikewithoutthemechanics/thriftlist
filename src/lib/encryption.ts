import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto';

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error('ENCRYPTION_KEY is required');
  }
  return createHash('sha256').update(key).digest();
}

export function encrypt(text: string): string {
  if (!text) return '';
  const key = getKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}.${tag.toString('base64')}.${ciphertext.toString('base64')}`;
}

export function decrypt(encryptedText: string): string {
  if (!encryptedText) return '';
  try {
    const [ivB64, tagB64, dataB64] = encryptedText.split('.');
    if (!ivB64 || !tagB64 || !dataB64) return '';

    const key = getKey();
    const iv = Buffer.from(ivB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    const data = Buffer.from(dataB64, 'base64');
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
  } catch {
    return '';
  }
}
