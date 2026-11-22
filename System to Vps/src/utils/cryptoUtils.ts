/**
 * BCT Enterprise - Cryptographic Utilities
 * Provides secure SHA-256 password hashing, verification, and strength validation.
 * Works seamlessly in both browser and Node.js environments without external dependencies.
 */

function sha256Sync(ascii: string): string {
  function rightRotate(value: number, amount: number): number {
    return (value >>> amount) | (value << (32 - amount));
  }
  const mathPow = Math.pow;
  const maxWord = mathPow(2, 32);
  const lengthProperty = 'length';
  let i = 0;
  let j = 0;
  let result = '';
  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;
  let hash: number[] = [];
  const k: number[] = [];
  let primeCounter = 0;
  const isComposite: Record<number, boolean> = {};

  for (let candidate = 2; primeCounter < 64; candidate++) {
    if (!isComposite[candidate]) {
      for (i = 0; i < 313; i += candidate) {
        isComposite[i] = true;
      }
      hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
      k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
    }
  }

  let formattedAscii = ascii + '\x80';
  while (formattedAscii.length % 64 !== 56) {
    formattedAscii += '\x00';
  }

  for (i = 0; i < formattedAscii.length; i++) {
    j = formattedAscii.charCodeAt(i);
    words[i >> 2] = (words[i >> 2] || 0) | (j << ((3 - i) % 4) * 8);
  }
  words[words.length] = (asciiBitLength / maxWord) | 0;
  words[words.length] = asciiBitLength;

  for (j = 0; j < words.length; ) {
    const w = words.slice(j, (j += 16));
    const oldHash = [...hash];
    hash = hash.slice(0, 8);

    for (i = 0; i < 64; i++) {
      const w15 = w[i - 15] || 0;
      const w2 = w[i - 2] || 0;
      const a = hash[0];
      const e = hash[4];
      const temp1 =
        hash[7] +
        (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25)) +
        ((e & hash[5]) ^ (~e & hash[6])) +
        k[i] +
        (w[i] =
          i < 16
            ? w[i] || 0
            : ((w[i - 16] || 0) +
                (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3)) +
                (w[i - 7] || 0) +
                (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))) |
              0);
      const temp2 =
        (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22)) +
        ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

      hash = [((temp1 + temp2) | 0), ...hash];
      hash[4] = ((hash[4] + temp1) | 0);
    }

    for (i = 0; i < 8; i++) {
      hash[i] = ((hash[i] + oldHash[i]) | 0);
    }
  }

  for (i = 0; i < 8; i++) {
    for (j = 3; j >= 0; j--) {
      const b = (hash[i] >> (j * 8)) & 255;
      result += (b < 16 ? '0' : '') + b.toString(16);
    }
  }
  return result;
}

/**
 * Standard temporary initial password for new/reset system users
 */
export const DEFAULT_INITIAL_PASSWORD = '123';

/**
 * Pre-computed SHA-256 hash for temporary initial password '123'
 */
export const DEFAULT_INITIAL_PASSWORD_HASH = sha256Sync(DEFAULT_INITIAL_PASSWORD);

/**
 * Demo accounts password hash for 'BctPassword2026!'
 */
export const DEMO_PASSWORD_HASH = sha256Sync('BctPassword2026!');

/**
 * Synchronous password hashing using SHA-256
 */
export function hashPasswordSync(password: string): string {
  return sha256Sync(password);
}

/**
 * Asynchronous password hashing using Web Crypto API where available, fallback to pure sync JS
 */
export async function hashPassword(password: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    try {
      const msgBuffer = new TextEncoder().encode(password);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      return hashPasswordSync(password);
    }
  }
  return hashPasswordSync(password);
}

/**
 * Synchronous password verification
 */
export function verifyPasswordSync(password: string, storedHash?: string): boolean {
  if (!storedHash) return false;
  const computed = hashPasswordSync(password);
  return computed.toLowerCase() === storedHash.toLowerCase();
}

/**
 * Asynchronous password verification
 */
export async function verifyPassword(password: string, storedHash?: string): Promise<boolean> {
  if (!storedHash) return false;
  const computed = await hashPassword(password);
  return computed.toLowerCase() === storedHash.toLowerCase();
}

/**
 * Password strength policy validation
 * Policy:
 * 1. Minimum 6 characters
 * 2. Cannot be the default initial password '123'
 */
export function validatePasswordStrength(
  password: string,
  currentInitialPassword: string = DEFAULT_INITIAL_PASSWORD
): { isValid: boolean; messageAr?: string; messageEn?: string } {
  if (!password || password.trim().length === 0) {
    return {
      isValid: false,
      messageAr: 'يرجى إدخال كلمة المرور الجديدة',
      messageEn: 'Please enter a new password'
    };
  }

  if (password.length < 6) {
    return {
      isValid: false,
      messageAr: 'يجب ألا تقل كلمة المرور عن 6 أحرف أو أرقام',
      messageEn: 'Password must be at least 6 characters long'
    };
  }

  if (password === currentInitialPassword) {
    return {
      isValid: false,
      messageAr: 'لا يمكن استخدام كلمة المرور الافتراضية المؤقتة (123) ككلمة مرور جديدة',
      messageEn: 'Cannot reuse the temporary initial password (123) as your new password'
    };
  }

  return { isValid: true };
}
