/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EncryptedPayload } from '../types';
import { sha256 } from './security';

// In-memory key vault separated from file records
const KEY_VAULT = new Map<string, CryptoKey>();
const VAULT_STORAGE_KEY = 'soozan_key_vault_store_v1';

function saveRawKeyToVaultStore(keyId: string, rawHex: string) {
  try {
    const raw = sessionStorage.getItem(VAULT_STORAGE_KEY);
    const store = raw ? JSON.parse(raw) : {};
    store[keyId] = rawHex;
    sessionStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Session storage not available or quota exceeded
  }
}

function getRawKeyFromVaultStore(keyId: string): string | null {
  try {
    const raw = sessionStorage.getItem(VAULT_STORAGE_KEY);
    if (!raw) return null;
    const store = JSON.parse(raw);
    return store[keyId] || null;
  } catch {
    return null;
  }
}

function removeRawKeyFromVaultStore(keyId: string) {
  try {
    const raw = sessionStorage.getItem(VAULT_STORAGE_KEY);
    if (!raw) return;
    const store = JSON.parse(raw);
    delete store[keyId];
    sessionStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Ignore
  }
}

/**
 * Generate a 64-character cryptographically secure random string.
 * Section 3: "کد اشتراک: ۶۴ کاراکتر، یکتا، تصادفی؛ کلید گیرنده؛ فقط یک‌بار در صفحه‌ی پایانی ویزارد نمایش؛ سپس بازیابی‌ناپذیر."
 */
export function generateShareCode64(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';
  const randomBytes = new Uint8Array(64);
  crypto.getRandomValues(randomBytes);
  let result = '';
  for (let i = 0; i < 64; i++) {
    result += chars[randomBytes[i] % chars.length];
  }
  return result;
}

/**
 * Generate a 16-character human-readable management code for sender.
 * e.g. "MAN-9F3K-7A8B-2C4D"
 */
export function generateManageCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  let p1 = '', p2 = '', p3 = '';
  for (let i = 0; i < 4; i++) p1 += chars[bytes[i] % chars.length];
  for (let i = 4; i < 8; i++) p2 += chars[bytes[i] % chars.length];
  for (let i = 8; i < 12; i++) p3 += chars[bytes[i] % chars.length];
  return `MAN-${p1}-${p2}-${p3}`;
}

/**
 * Encrypt file payload using AES-GCM 256-bit.
 * Key is stored strictly in separated key vault; only the keyId is linked in payload.
 */
export async function encryptFilePayload(
  rawBytes: Uint8Array,
  fileName: string,
  mimeType: string,
  explicitKeyId?: string
): Promise<{ payload: EncryptedPayload; keyId: string }> {
  // Generate 256-bit AES-GCM Key
  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  const keyId = explicitKeyId || `key_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  KEY_VAULT.set(keyId, key);

  // Export raw key to retain across session views until burned
  const exported = await crypto.subtle.exportKey('raw', key);
  const rawHex = Array.from(new Uint8Array(exported))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  saveRawKeyToVaultStore(keyId, rawHex);

  // 12-byte initialization vector (IV)
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);

  // Encrypt
  const ciphertextBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    rawBytes as unknown as BufferSource
  );

  const cipherBytes = new Uint8Array(ciphertextBuffer);

  // Convert to hex for safe serialization
  const cipherBytesHex = Array.from(cipherBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  const ivHex = Array.from(iv)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  const payload: EncryptedPayload = {
    cipherBytesHex,
    ivHex,
    algorithm: 'AES-GCM-256',
    keyId,
    originalName: fileName,
    originalSize: rawBytes.length,
    mimeType,
  };

  return { payload, keyId };
}

/**
 * Decrypt file payload.
 * Verifies key existence and integrity.
 */
export async function decryptFilePayload(payload: EncryptedPayload): Promise<Uint8Array | null> {
  if (!payload || !payload.keyId) return null;

  let key = KEY_VAULT.get(payload.keyId);

  // Attempt recovery from vault storage if memory was refreshed
  if (!key) {
    const rawHex = getRawKeyFromVaultStore(payload.keyId);
    if (rawHex && rawHex.length === 64) {
      try {
        const rawBytes = new Uint8Array(
          rawHex.match(/.{1,2}/g)!.map(b => parseInt(b, 16))
        );
        key = await crypto.subtle.importKey(
          'raw',
          rawBytes,
          { name: 'AES-GCM', length: 256 },
          true,
          ['encrypt', 'decrypt']
        );
        KEY_VAULT.set(payload.keyId, key);
      } catch {
        key = undefined;
      }
    }
  }

  if (!key) {
    return null; // Key was securely destroyed or not found
  }

  try {
    // Parse hex back to Uint8Array
    if (!payload.ivHex || !payload.cipherBytesHex) return null;
    const iv = new Uint8Array(
      payload.ivHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
    );
    const cipherBytes = new Uint8Array(
      payload.cipherBytesHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
    );

    const decryptedBuffer = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      cipherBytes
    );

    return new Uint8Array(decryptedBuffer);
  } catch {
    return null;
  }
}

/**
 * Securely destroy the encryption key from vault (Cryptographic Shredding).
 * Without this key, ciphertext is mathematically unrecoverable.
 */
export function shredEncryptionKey(keyId: string): boolean {
  removeRawKeyFromVaultStore(keyId);
  return KEY_VAULT.delete(keyId);
}

/**
 * Check whether a key is currently intact in vault.
 */
export function isKeyIntactInVault(keyId: string): boolean {
  if (KEY_VAULT.has(keyId)) return true;
  return getRawKeyFromVaultStore(keyId) !== null;
}

/**
 * Get count and health metrics of keys in vault for Guardian / Telemetry.
 * Zero plaintext keys or raw secrets are exposed.
 */
export function getKeyVaultStats(): { activeKeysCount: number; keyIds: string[] } {
  const memoryKeyIds = Array.from(KEY_VAULT.keys());
  let storageKeyIds: string[] = [];
  try {
    const raw = sessionStorage.getItem(VAULT_STORAGE_KEY);
    if (raw) {
      storageKeyIds = Object.keys(JSON.parse(raw));
    }
  } catch {
    // ignore
  }

  const allKeyIds = Array.from(new Set([...memoryKeyIds, ...storageKeyIds]));
  return {
    activeKeysCount: allKeyIds.length,
    keyIds: allKeyIds,
  };
}

export const keyVault = {
  hasKey: (keyId: string): boolean => isKeyIntactInVault(keyId),
  shredKey: (keyId: string): boolean => shredEncryptionKey(keyId),
  storeRawKey: (keyId: string, rawBytes: Uint8Array): void => {
    const hex = Array.from(rawBytes).map(b => b.toString(16).padStart(2, '0')).join('');
    saveRawKeyToVaultStore(keyId, hex);
  },
  getStats: () => getKeyVaultStats(),
};


