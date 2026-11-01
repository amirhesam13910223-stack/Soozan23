/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Timing-safe string comparison to protect against side-channel timing attacks.
 */
export function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

/**
 * Cryptographic SHA-256 hashing using the browser's native Web Crypto API.
 */
export async function sha256(message: string, salt: string = 'soozan_salt_v1'): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(`${salt}:${message}`);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate cryptographically secure random string.
 */
export function generateSecureToken(length: number = 32): string {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('').slice(0, length);
}

/**
 * Password strength rules check.
 */
export interface PasswordRuleCheck {
  id: string;
  label: string;
  valid: boolean;
}

export function evaluatePasswordRules(password: string): {
  isValid: boolean;
  score: number; // 0 to 5
  rules: PasswordRuleCheck[];
} {
  const rules: PasswordRuleCheck[] = [
    {
      id: 'length',
      label: 'حداقل ۸ کاراکتر',
      valid: password.length >= 8,
    },
    {
      id: 'lowercase',
      label: 'حداقل یک حرف کوچک انگلیسی (a-z)',
      valid: /[a-z]/.test(password),
    },
    {
      id: 'uppercase',
      label: 'حداقل یک حرف بزرگ انگلیسی (A-Z)',
      valid: /[A-Z]/.test(password),
    },
    {
      id: 'number',
      label: 'حداقل یک عدد لاتین (0-9)',
      valid: /[0-9]/.test(password),
    },
    {
      id: 'special',
      label: 'حداقل یک نویسه ویژه (!@#$%^&*...)',
      valid: /[^A-Za-z0-9]/.test(password),
    },
  ];

  const validCount = rules.filter(r => r.valid).length;
  return {
    isValid: validCount === 5,
    score: validCount,
    rules,
  };
}

/**
 * Validate Iranian mobile phone number format.
 */
export function validateIranianMobile(mobile: string): boolean {
  const clean = mobile.replace(/[\s-]/g, '');
  return /^09[0-9]{9}$/.test(clean) || /^\+989[0-9]{9}$/.test(clean);
}

/**
 * Standardize Iranian mobile number to 09xxxxxxxxx format.
 */
export function normalizeIranianMobile(mobile: string): string {
  let clean = mobile.replace(/[\s-]/g, '');
  if (clean.startsWith('+98')) {
    clean = '0' + clean.slice(3);
  } else if (clean.startsWith('0098')) {
    clean = '0' + clean.slice(4);
  }
  return clean;
}

/**
 * Mask mobile number for privacy (e.g. 0912***7890).
 */
export function maskMobile(mobile: string): string {
  const norm = normalizeIranianMobile(mobile);
  if (norm.length !== 11) return norm;
  return `${norm.slice(0, 4)}***${norm.slice(7)}`;
}

/**
 * Convert English digits to Persian digits for display.
 */
export function toPersianDigits(num: number | string): string {
  const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  return num
    .toString()
    .replace(/[0-9]/g, (w) => farsiDigits[+w]);
}

/**
 * Format timestamp into relative or human Persian date.
 */
export function formatPersianRelativeTime(timestamp: number): string {
  const diffSec = Math.floor((Date.now() - timestamp) / 1000);
  if (diffSec < 60) return 'لحظاتی پیش';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${toPersianDigits(diffMin)} دقیقه پیش`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${toPersianDigits(diffHour)} ساعت پیش`;
  const diffDay = Math.floor(diffHour / 24);
  return `${toPersianDigits(diffDay)} روز پیش`;
}
