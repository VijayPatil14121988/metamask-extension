/**
 * Securitization Service (Pure JavaScript Implementation)
 *
 * Uses pure JS crypto libraries for MetaMask Snaps SES compatibility
 * WASM version preserved in securitization.wasm.ts
 */

import { splitSecret, reconstructSecret, generateRandomSecret } from '../crypto/shamir';
import { encrypt, decrypt, generateKey } from '../crypto/aes';
import type { SecuritizationResult } from '../types';

/**
 * Service for wallet securitization and recovery using pure JavaScript crypto
 */
export class SecuritizationService {
  /**
   * Securitize a private key using 2-of-4 threshold SSS
   *
   * Algorithm:
   * 1. Generate random 256-bit encryption key (K)
   * 2. Split K into 4 shards using 2-of-4 Shamir Secret Sharing
   * 3. Encrypt private key with K -> encrypted_secret
   * 4. Return 4 shards + encrypted_secret
   *
   * @param privateKey - Hex string private key (with or without 0x prefix)
   * @returns Securitization result with 4 shards
   */
  async securitize(
    privateKey: string,
  ): Promise<SecuritizationResult> {
    console.log('[SecuritizationService] Starting securitization (Pure JS)...');

    try {
      // Remove 0x prefix if present
      const cleanKey = privateKey.startsWith('0x')
        ? privateKey.slice(2)
        : privateKey;

      // Convert hex private key to bytes
      const privateKeyBytes = this.hexToBytes(cleanKey);

      if (privateKeyBytes.length !== 32) {
        throw new Error(`Invalid private key length: ${privateKeyBytes.length}, expected 32`);
      }

      // Step 1: Generate random encryption key (32 bytes / 256 bits)
      console.log('[SecuritizationService] Step 1: Generating encryption key...');
      const encryptionKey = generateKey();

      // Step 2: Split encryption key into 4 shards using 2-of-4 threshold
      console.log('[SecuritizationService] Step 2: Splitting key into 4 shards (2-of-4 threshold)...');
      const shards = splitSecret(encryptionKey, 2, 4);

      if (shards.length !== 4) {
        throw new Error(`Expected 4 shards, got ${shards.length}`);
      }

      // Step 3: Encrypt private key with encryption key (AES-256-GCM)
      console.log('[SecuritizationService] Step 3: Encrypting private key with encryption key...');
      const encryptedSecret = encrypt(privateKeyBytes, encryptionKey);

      console.log('[SecuritizationService] Securitization successful');
      console.log(`[SecuritizationService] Shard sizes: ${shards.map(s => s.length).join(', ')} bytes`);
      console.log(`[SecuritizationService] Encrypted secret size: ${encryptedSecret.length} bytes`);

      // Return all 4 shards and encrypted secret
      return {
        sim_shard: shards[0],
        recovery_shard: shards[1],
        cloud_shard: shards[2],
        custodial_shard: shards[3],
        encrypted_secret: encryptedSecret,
      };
    } catch (error) {
      console.error('[SecuritizationService] Securitization failed:', error);
      throw new Error(`Securitization failed: ${(error as Error).message}`);
    }
  }

  /**
   * Recover a private key from shards
   *
   * Algorithm (reverse of securitization):
   * 1. Reconstruct encryption key K from any 2+ shards
   * 2. Decrypt encrypted_secret with K -> private key
   * 3. Return private key
   *
   * @param shards - Array of at least 2 shards
   * @param encryptedSecret - The encrypted secret
   * @returns Recovered private key as hex string (with 0x prefix)
   */
  async recover(
    shards: Uint8Array[],
    encryptedSecret: Uint8Array,
  ): Promise<string> {
    console.log('[SecuritizationService] Starting recovery (Pure JS)...');

    if (shards.length < 2) {
      throw new Error(`Insufficient shards: got ${shards.length}, need at least 2`);
    }

    try {
      // Step 1: Reconstruct encryption key from shards using 2-of-4 threshold
      console.log(`[SecuritizationService] Step 1: Reconstructing encryption key from ${shards.length} shards...`);
      const encryptionKey = reconstructSecret(shards);

      // Step 2: Decrypt encrypted_secret with encryption key to get private key
      console.log('[SecuritizationService] Step 2: Decrypting with encryption key...');
      const privateKeyBytes = decrypt(encryptedSecret, encryptionKey);

      if (privateKeyBytes.length !== 32) {
        throw new Error(`Invalid recovered private key length: ${privateKeyBytes.length}, expected 32`);
      }

      // Convert to hex string with 0x prefix
      const privateKeyHex = '0x' + this.bytesToHex(privateKeyBytes);

      console.log('[SecuritizationService] Recovery successful');

      return privateKeyHex;
    } catch (error) {
      console.error('[SecuritizationService] Recovery failed:', error);
      throw new Error(`Recovery failed: ${(error as Error).message}`);
    }
  }

  /**
   * Convert hex string to Uint8Array
   */
  private hexToBytes(hex: string): Uint8Array {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) {
      bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    }
    return bytes;
  }

  /**
   * Convert Uint8Array to hex string
   */
  private bytesToHex(bytes: Uint8Array): string {
    return Array.from(bytes)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }
}
