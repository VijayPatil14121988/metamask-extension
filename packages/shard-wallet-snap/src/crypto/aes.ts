/**
 * Pure JavaScript AES-256-GCM Encryption
 *
 * Uses @noble/ciphers for AES-GCM encryption/decryption
 */

import { gcm } from '@noble/ciphers/aes.js';
import { randomBytes } from '@noble/hashes/utils.js';

/**
 * Encrypt data using AES-256-GCM
 *
 * @param plaintext - Data to encrypt (Uint8Array)
 * @param key - 256-bit encryption key (32 bytes)
 * @returns Encrypted data with IV prepended (IV + ciphertext + tag)
 */
export function encrypt(plaintext: Uint8Array, key: Uint8Array): Uint8Array {
  if (key.length !== 32) {
    throw new Error(`Invalid key length: ${key.length}, expected 32 bytes`);
  }

  console.log(`[AES] Encrypting ${plaintext.length} bytes`);

  // Generate random 12-byte IV (nonce) for GCM
  const iv = randomBytes(12);

  // Create AES-256-GCM cipher
  const cipher = gcm(key, iv);

  // Encrypt plaintext
  const ciphertext = cipher.encrypt(plaintext);

  // Return IV + ciphertext (GCM tag is included in ciphertext by @noble/ciphers)
  const encrypted = new Uint8Array(iv.length + ciphertext.length);
  encrypted.set(iv, 0);
  encrypted.set(ciphertext, iv.length);

  console.log(`[AES] Encrypted: ${encrypted.length} bytes (IV: ${iv.length}, Ciphertext: ${ciphertext.length})`);
  return encrypted;
}

/**
 * Decrypt data using AES-256-GCM
 *
 * @param encrypted - Encrypted data with IV prepended (IV + ciphertext + tag)
 * @param key - 256-bit encryption key (32 bytes)
 * @returns Decrypted plaintext
 */
export function decrypt(encrypted: Uint8Array, key: Uint8Array): Uint8Array {
  if (key.length !== 32) {
    throw new Error(`Invalid key length: ${key.length}, expected 32 bytes`);
  }

  console.log(`[AES] Decrypting ${encrypted.length} bytes`);

  // Extract IV (first 12 bytes)
  const ivLength = 12;
  if (encrypted.length < ivLength + 16) { // 16 = minimum ciphertext + tag
    throw new Error(`Invalid encrypted data length: ${encrypted.length}`);
  }

  const iv = encrypted.slice(0, ivLength);
  const ciphertext = encrypted.slice(ivLength);

  // Create AES-256-GCM cipher
  const cipher = gcm(key, iv);

  // Decrypt ciphertext
  try {
    const plaintext = cipher.decrypt(ciphertext);
    console.log(`[AES] Decrypted: ${plaintext.length} bytes`);
    return plaintext;
  } catch (error) {
    console.error('[AES] Decryption failed:', error);
    throw new Error(`Decryption failed: ${(error as Error).message}`);
  }
}

/**
 * Generate a random 256-bit (32-byte) encryption key
 *
 * @returns Random 256-bit key
 */
export function generateKey(): Uint8Array {
  const key = randomBytes(32);
  console.log('[AES] Generated 256-bit key');
  return key;
}
