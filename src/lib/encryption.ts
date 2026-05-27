import CryptoJS from 'crypto-js';

// Derive encryption key from environment or fallback
function getKey(): string {
  const key = process.env.ENCRYPTION_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'thriftlist-default-key';
  // Hash to fixed length for AES-256
  return CryptoJS.SHA256(key).toString(CryptoJS.enc.Hex).slice(0, 32);
}

export function encrypt(text: string): string {
  if (!text) return '';
  const key = getKey();
  const encrypted = CryptoJS.AES.encrypt(text, key);
  return encrypted.toString();
}

export function decrypt(encryptedText: string): string {
  if (!encryptedText) return '';
  try {
    const key = getKey();
    const decrypted = CryptoJS.AES.decrypt(encryptedText, key);
    return decrypted.toString(CryptoJS.enc.Utf8);
  } catch {
    return '';
  }
}
