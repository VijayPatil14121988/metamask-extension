/**
 * Pure JavaScript PBKDF2 Key Derivation
 *
 * Uses @noble/hashes for PBKDF2-SHA256
 */

import { pbkdf2 } from '@noble/hashes/pbkdf2.js';
import { sha256 } from '@noble/hashes/sha2.js';
import { randomBytes } from '@noble/hashes/utils.js';

/**
 * Result of PIN-based encryption
 */
export interface PinEncryptionResult {
  salt: Uint8Array;
  encrypted: Uint8Array;
}

/**
 * Derive a 256-bit key from a PIN using PBKDF2-SHA256
 *
 * @param pin - User PIN (string)
 * @param salt - Salt for key derivation (16 bytes)
 * @param iterations - Number of PBKDF2 iterations (default: 100,000)
 * @returns Derived 256-bit key (32 bytes)
 */
export function deriveKeyFromPin(
  pin: string,
  salt: Uint8Array,
  iterations: number = 100000,
): Uint8Array {
  console.log(`[PBKDF2] Deriving key from PIN (${iterations} iterations)`);

  if (salt.length !== 16) {
    throw new Error(`Invalid salt length: ${salt.length}, expected 16 bytes`);
  }

  // Convert PIN to bytes
  const pinBytes = new TextEncoder().encode(pin);

  // Derive key using PBKDF2-SHA256
  // dkLen = 32 bytes (256 bits)
  const key = pbkdf2(sha256, pinBytes, salt, {
    c: iterations,
    dkLen: 32,
  });

  console.log(`[PBKDF2] Derived key: ${key.length} bytes`);
  return key;
}

/**
 * Encrypt data with a PIN-derived key
 *
 * @param data - Data to encrypt
 * @param pin - User PIN
 * @param existingSalt - Optional existing salt (for re-encryption)
 * @returns Salt and encrypted data
 */
export function encryptWithPin(
  data: Uint8Array,
  pin: string,
  existingSalt?: Uint8Array | null,
): PinEncryptionResult {
  console.log(`[PBKDF2] Encrypting with PIN (data: ${data.length} bytes)`);

  // Generate or use existing salt
  const salt = existingSalt || randomBytes(16);

  // Derive key from PIN
  const key = deriveKeyFromPin(pin, salt);

  // Encrypt data with AES-256-GCM
  const { encrypt } = require('./aes');
  const encrypted = encrypt(data, key);

  console.log(`[PBKDF2] Encrypted: ${encrypted.length} bytes, salt: ${salt.length} bytes`);

  return {
    salt,
    encrypted,
  };
}

/**
 * Decrypt data with a PIN-derived key
 *
 * @param encrypted - Encrypted data
 * @param pin - User PIN
 * @param salt - Salt used during encryption (16 bytes)
 * @returns Decrypted data
 */
export function decryptWithPin(
  encrypted: Uint8Array,
  pin: string,
  salt: Uint8Array,
): Uint8Array {
  console.log(`[PBKDF2] Decrypting with PIN (encrypted: ${encrypted.length} bytes)`);

  if (salt.length !== 16) {
    throw new Error(`Invalid salt length: ${salt.length}, expected 16 bytes`);
  }

  // Derive key from PIN
  const key = deriveKeyFromPin(pin, salt);

  // Decrypt data with AES-256-GCM
  const { decrypt } = require('./aes');
  const decrypted = decrypt(encrypted, key);

  console.log(`[PBKDF2] Decrypted: ${decrypted.length} bytes`);
  return decrypted;
}
