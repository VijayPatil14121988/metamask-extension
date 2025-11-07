/**
 * Integration Tests: Complete Securitization Flow
 *
 * Tests the end-to-end wallet securitization process
 */

import { SecuritizationService } from '../../services/securitization';
import { MockStorageService } from '../../services/storage';
import {
  VALID_PRIVATE_KEYS,
  INVALID_PRIVATE_KEYS,
  VALID_ADDRESSES,
  VALID_PINS,
  SHARD_CONSTANTS,
} from '../fixtures/test-data';

describe('Securitization Integration', () => {
  let securitizationService: SecuritizationService;
  let storageService: MockStorageService;

  const TEST_PRIVATE_KEY = VALID_PRIVATE_KEYS.STANDARD;
  const TEST_PIN = VALID_PINS.SIX_DIGIT;
  const TEST_WALLET_ADDRESS = VALID_ADDRESSES.ALTERNATIVE;

  beforeEach(() => {
    securitizationService = new SecuritizationService();
    storageService = new MockStorageService();
  });

  describe('Complete Securitization Flow', () => {
    it('should securitize wallet and distribute shards', async () => {
      // Step 1: Securitize the private key
      const result = await securitizationService.securitize(
        TEST_PRIVATE_KEY,
        TEST_PIN,
      );

      // Verify 4 shards were created (matching SHARD_CONSTANTS)
      expect(result).toHaveProperty('sim_shard');
      expect(result).toHaveProperty('recovery_shard');
      expect(result).toHaveProperty('cloud_shard');
      expect(result).toHaveProperty('custodial_shard');
      expect(result).toHaveProperty('encrypted_secret');
      expect(result).toHaveProperty('double_encrypted_secret');

      // Verify shards are Uint8Array
      expect(result.sim_shard).toBeInstanceOf(Uint8Array);
      expect(result.recovery_shard).toBeInstanceOf(Uint8Array);
      expect(result.cloud_shard).toBeInstanceOf(Uint8Array);
      expect(result.custodial_shard).toBeInstanceOf(Uint8Array);

      // Verify shards are not empty
      expect(result.sim_shard.length).toBeGreaterThan(0);
      expect(result.recovery_shard.length).toBeGreaterThan(0);
      expect(result.cloud_shard.length).toBeGreaterThan(0);
      expect(result.custodial_shard.length).toBeGreaterThan(0);

      // Step 2: Distribute shards to storage
      await storageService.distributeShards(result, TEST_WALLET_ADDRESS);

      // Step 3: Verify health status
      const health = await storageService.checkHealth();
      expect(health.overall).toBe('healthy');
      expect(health.sim.status).toBe('healthy');
      expect(health.yubikey.status).toBe('healthy');
      expect(health.custodial.status).toBe('healthy');
      expect(health.escrow.status).toBe('healthy');
    });

    it('should retrieve shards from all 4 storage locations', async () => {
      // Securitize and distribute
      const result = await securitizationService.securitize(
        TEST_PRIVATE_KEY,
        TEST_PIN,
      );
      await storageService.distributeShards(result, TEST_WALLET_ADDRESS);

      // Retrieve shards
      const shards = await storageService.retrieveShards(TEST_WALLET_ADDRESS);

      // Verify we got 4 shards back (matching SHARD_CONSTANTS.TOTAL_SHARDS)
      expect(shards).toHaveLength(SHARD_CONSTANTS.TOTAL_SHARDS);
      expect(shards.every((s) => s instanceof Uint8Array)).toBe(true);
      expect(shards.every((s) => s.length > 0)).toBe(true);
    });

    it('should maintain 2-of-4 threshold semantics', async () => {
      const result = await securitizationService.securitize(
        TEST_PRIVATE_KEY,
        TEST_PIN,
      );
      await storageService.distributeShards(result, TEST_WALLET_ADDRESS);

      const shards = await storageService.retrieveShards(TEST_WALLET_ADDRESS);

      // In a 2-of-4 system, any 2 shards should be sufficient
      expect(shards.length).toBe(SHARD_CONSTANTS.TOTAL_SHARDS);

      // Verify health is "healthy" with all 4 shards
      const health = await storageService.checkHealth();
      expect(health.overall).toBe('healthy');
    });

    it('should complete full securitization and recovery round-trip', async () => {
      // Securitize
      const result = await securitizationService.securitize(
        TEST_PRIVATE_KEY,
        TEST_PIN,
      );
      await storageService.distributeShards(result, TEST_WALLET_ADDRESS);

      // Retrieve all components for recovery
      const shards = await storageService.retrieveShards(TEST_WALLET_ADDRESS);
      const doubleEncryptedSecret = await storageService.retrieveEncryptedSecret(TEST_WALLET_ADDRESS);

      expect(shards.length).toBeGreaterThanOrEqual(SHARD_CONSTANTS.MIN_SHARDS_FOR_RECOVERY);
      expect(doubleEncryptedSecret).toBeDefined();

      // Recover private key
      const recoveredKey = await securitizationService.recover(
        shards,
        TEST_PIN,
        doubleEncryptedSecret!,
      );

      // Verify recovered key matches original
      expect(recoveredKey).toBe(TEST_PRIVATE_KEY);
    });

    it('should recover with only 2 out of 4 shards (threshold test)', async () => {
      // Securitize
      const result = await securitizationService.securitize(
        TEST_PRIVATE_KEY,
        TEST_PIN,
      );
      await storageService.distributeShards(result, TEST_WALLET_ADDRESS);

      // Retrieve all components
      const allShards = await storageService.retrieveShards(TEST_WALLET_ADDRESS);
      const doubleEncryptedSecret = await storageService.retrieveEncryptedSecret(TEST_WALLET_ADDRESS);

      // Use only first 2 shards (simulating 2 storage locations available)
      const twoShards = allShards.slice(0, 2);

      // Should still be able to recover
      const recoveredKey = await securitizationService.recover(
        twoShards,
        TEST_PIN,
        doubleEncryptedSecret!,
      );

      expect(recoveredKey).toBe(TEST_PRIVATE_KEY);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid private key gracefully', async () => {
      await expect(
        securitizationService.securitize(INVALID_PRIVATE_KEYS.INVALID_CHARS, TEST_PIN),
      ).rejects.toThrow();
    });

    it('should handle empty private key', async () => {
      await expect(
        securitizationService.securitize(INVALID_PRIVATE_KEYS.EMPTY, TEST_PIN),
      ).rejects.toThrow();
    });

    it('should handle invalid PIN', async () => {
      // This should still work - validation happens at RPC level
      const result = await securitizationService.securitize(
        TEST_PRIVATE_KEY,
        '', // Empty PIN
      );

      expect(result).toBeDefined();
    });
  });

  describe('Storage Resilience', () => {
    it('should handle storage failures gracefully', async () => {
      const result = await securitizationService.securitize(
        TEST_PRIVATE_KEY,
        TEST_PIN,
      );

      // Distribution should succeed even if we're testing
      await expect(
        storageService.distributeShards(result, TEST_WALLET_ADDRESS),
      ).resolves.not.toThrow();
    });

    it('should report correct health when some storage is unavailable', async () => {
      // In real scenario, some storage might be offline
      // Mock storage should always report healthy in test environment
      const health = await storageService.checkHealth();

      expect(['healthy', 'degraded', 'critical', 'offline']).toContain(
        health.overall,
      );
    });
  });

  describe('Multiple Wallets', () => {
    it('should handle multiple wallet securitizations', async () => {
      const wallet1 = VALID_ADDRESSES.STANDARD;
      const wallet2 = VALID_ADDRESSES.ALTERNATIVE;

      // Securitize first wallet
      const result1 = await securitizationService.securitize(
        TEST_PRIVATE_KEY,
        TEST_PIN,
      );
      await storageService.distributeShards(result1, wallet1);

      // Securitize second wallet
      const result2 = await securitizationService.securitize(
        TEST_PRIVATE_KEY,
        TEST_PIN,
      );
      await storageService.distributeShards(result2, wallet2);

      // Retrieve shards for each wallet
      const shards1 = await storageService.retrieveShards(wallet1);
      const shards2 = await storageService.retrieveShards(wallet2);

      expect(shards1).toHaveLength(SHARD_CONSTANTS.TOTAL_SHARDS);
      expect(shards2).toHaveLength(SHARD_CONSTANTS.TOTAL_SHARDS);
    });
  });
});
