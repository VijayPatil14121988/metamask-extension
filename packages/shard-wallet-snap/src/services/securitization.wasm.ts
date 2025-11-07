/**
 * Securitization Service
 *
 * Wraps the WASM SDK for securitization and recovery operations
 */

import * as ShardSDK from '../../wasm-sdk/shard_crypto_sdk';
// @ts-ignore
import wasmBytes from '../../wasm-sdk/shard_crypto_sdk_bg.wasm';
import type { SecuritizationResult } from '../types';

/**
 * Service for wallet securitization and recovery
 */
export class SecuritizationService {
  private initialized = false;

  /**
 * Initialize WASM module
   */
  private async init(): Promise<void> {
    if (!this.initialized) {
      // Pass the WASM bytes directly instead of relying on URL resolution
      await ShardSDK.default(wasmBytes);
      this.initialized = true;
      console.log('[SecuritizationService] WASM SDK initialized');
    }
  }

  /**
   * Securitize a private key using 2-of-4 threshold SSS
   *
   * Algorithm:
   * 1. Generate random 256-bit encryption key (K)
   * 2. Split K into 4 shards using 2-of-4 Shamir Secret Sharing
   * 3. Encrypt private key with K -> encrypted_secret
   * 4. Encrypt encrypted_secret with PIN -> double_encrypted_secret
   * 5. Return 4 shards + encrypted_secret + double_encrypted_secret
   *
   * @param privateKey - Hex string private key (with or without 0x prefix)
   * @param pin - User PIN for shard encryption
   * @returns Securitization result with 4 shards
   */
  async securitize(
    privateKey: string,
    pin: string,
  ): Promise<SecuritizationResult> {
    await this.init();

    console.log('[SecuritizationService] Starting securitization...');

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
      const encryptionKey = ShardSDK.generateKey();

      // Step 2: Split encryption key into 4 shards using 2-of-4 threshold
      console.log('[SecuritizationService] Step 2: Splitting key into 4 shards (2-of-4 threshold)...');
      const secretSharer = new ShardSDK.SecretSharer(2, 4); // threshold=2, total=4
      const shards = secretSharer.split(encryptionKey) as Uint8Array[];

      if (shards.length !== 4) {
        throw new Error(`Expected 4 shards, got ${shards.length}`);
      }

      // Step 3: Encrypt private key with encryption key (AES-256-GCM)
      console.log('[SecuritizationService] Step 3: Encrypting private key with encryption key...');
      const encryptedSecret = ShardSDK.encryptWithKey(privateKeyBytes, encryptionKey);

      // Step 4: Encrypt the encrypted secret with PIN (PBKDF2 + AES-256-GCM)
      console.log('[SecuritizationService] Step 4: Encrypting with PIN...');
      const pinResult = ShardSDK.encryptWithPin(encryptedSecret, pin, null);
      const doubleEncryptedSecret = new Uint8Array([
        ...pinResult.salt,
        ...pinResult.encrypted,
      ]);

      console.log('[SecuritizationService] Securitization successful');
      console.log(`[SecuritizationService] Shard sizes: ${shards.map(s => s.length).join(', ')} bytes`);
      console.log(`[SecuritizationService] Encrypted secret size: ${encryptedSecret.length} bytes`);
      console.log(`[SecuritizationService] Double encrypted size: ${doubleEncryptedSecret.length} bytes`);

      // Free WASM resources
      secretSharer.free();

      // Return all 4 shards and encrypted secrets
      return {
        sim_shard: shards[0],
        recovery_shard: shards[1],
        cloud_shard: shards[2],
        custodial_shard: shards[3],
        encrypted_secret: encryptedSecret,
        double_encrypted_secret: doubleEncryptedSecret,
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
   * 2. Decrypt double_encrypted_secret with PIN -> encrypted_secret
   * 3. Decrypt encrypted_secret with K -> private key
   * 4. Return private key
   *
   * @param shards - Array of at least 2 shards
   * @param pin - User PIN
   * @param doubleEncryptedSecret - The double-encrypted secret (salt + encrypted data)
   * @returns Recovered private key as hex string (with 0x prefix)
   */
  async recover(
    shards: Uint8Array[],
    pin: string,
    doubleEncryptedSecret: Uint8Array,
  ): Promise<string> {
    await this.init();

    console.log('[SecuritizationService] Starting recovery...');

    if (shards.length < 2) {
      throw new Error(`Insufficient shards: got ${shards.length}, need at least 2`);
    }

    try {
      // Step 1: Reconstruct encryption key from shards using 2-of-4 threshold
      console.log(`[SecuritizationService] Step 1: Reconstructing encryption key from ${shards.length} shards...`);
      const secretSharer = new ShardSDK.SecretSharer(2, 4); // threshold=2, total=4
      const encryptionKey = secretSharer.reconstruct(shards);

      // Step 2: Extract salt and encrypted data from doubleEncryptedSecret
      // Format: [salt (16 bytes) | encrypted data]
      console.log('[SecuritizationService] Step 2: Extracting salt and encrypted data...');
      const saltSize = 16; // Standard salt size for PBKDF2
      const salt = doubleEncryptedSecret.slice(0, saltSize);
      const encryptedData = doubleEncryptedSecret.slice(saltSize);

      // Step 3: Decrypt with PIN to get encrypted_secret
      console.log('[SecuritizationService] Step 3: Decrypting with PIN...');
      const encryptedSecret = ShardSDK.decryptWithPin(encryptedData, pin, salt);

      // Step 4: Decrypt encrypted_secret with encryption key to get private key
      console.log('[SecuritizationService] Step 4: Decrypting with encryption key...');
      const privateKeyBytes = ShardSDK.decryptWithKey(encryptedSecret, encryptionKey);

      if (privateKeyBytes.length !== 32) {
        throw new Error(`Invalid recovered private key length: ${privateKeyBytes.length}, expected 32`);
      }

      // Convert to hex string with 0x prefix
      const privateKeyHex = '0x' + ShardSDK.bytesToHex(privateKeyBytes);

      console.log('[SecuritizationService] Recovery successful');

      // Free WASM resources
      secretSharer.free();

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

}
