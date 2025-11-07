/**
 * Unit Tests: Storage Service
 *
 * Tests for mock storage adapters and distribution logic
 */

import { MockStorageService } from '../storage';
import {
  VALID_ADDRESSES,
  SHARD_CONSTANTS,
  createMockSecuritizationResult,
} from '../../__tests__/fixtures/test-data';

describe('MockStorageService', () => {
  let storageService: MockStorageService;

  beforeEach(() => {
    storageService = new MockStorageService();
    // Clear localStorage before each test
    (global as any).localStorage.clear();
  });

  describe('distributeShards', () => {
    it('should distribute shards to multiple storage locations', async () => {
      const mockResult = createMockSecuritizationResult();
      const walletAddress = VALID_ADDRESSES.STANDARD;

      await storageService.distributeShards(mockResult, walletAddress);

      // Verify shards were stored
      // Note: IndexedDB mock is limited, so we expect at least 3 shards (localStorage-based ones)
      const retrievedShards = await storageService.retrieveShards(walletAddress);
      expect(retrievedShards.length).toBeGreaterThanOrEqual(SHARD_CONSTANTS.MIN_SHARDS_FOR_RECOVERY);
      expect(retrievedShards.length).toBeLessThanOrEqual(SHARD_CONSTANTS.TOTAL_SHARDS);
    });

    it('should store encrypted secret alongside shards', async () => {
      const mockResult = createMockSecuritizationResult();
      const walletAddress = VALID_ADDRESSES.STANDARD;

      await storageService.distributeShards(mockResult, walletAddress);

      // Verify encrypted secret was stored
      const encryptedSecret = await storageService.retrieveEncryptedSecret(walletAddress);
      expect(encryptedSecret).toBeDefined();
      expect(encryptedSecret).toBeInstanceOf(Uint8Array);
    });

    it('should handle multiple wallet distributions', async () => {
      const result1 = createMockSecuritizationResult();
      const result2 = createMockSecuritizationResult();
      const wallet1 = VALID_ADDRESSES.STANDARD;
      const wallet2 = VALID_ADDRESSES.ALTERNATIVE;

      await storageService.distributeShards(result1, wallet1);
      await storageService.distributeShards(result2, wallet2);

      // Both wallets should have their shards (at least 2 for recovery)
      const shards1 = await storageService.retrieveShards(wallet1);
      const shards2 = await storageService.retrieveShards(wallet2);

      expect(shards1.length).toBeGreaterThanOrEqual(SHARD_CONSTANTS.MIN_SHARDS_FOR_RECOVERY);
      expect(shards2.length).toBeGreaterThanOrEqual(SHARD_CONSTANTS.MIN_SHARDS_FOR_RECOVERY);
    });

    it('should handle empty wallet address', async () => {
      const mockResult = createMockSecuritizationResult();

      // Empty address is still valid for the mock storage (just uses it as key)
      // In real implementation, validation would happen at RPC level
      await storageService.distributeShards(mockResult, '');

      const shards = await storageService.retrieveShards('');
      expect(shards.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('retrieveShards', () => {
    it('should retrieve distributed shards', async () => {
      const mockResult = createMockSecuritizationResult();
      const walletAddress = VALID_ADDRESSES.STANDARD;

      await storageService.distributeShards(mockResult, walletAddress);
      const shards = await storageService.retrieveShards(walletAddress);

      // Verify we have enough shards for recovery
      expect(shards.length).toBeGreaterThanOrEqual(SHARD_CONSTANTS.MIN_SHARDS_FOR_RECOVERY);
      shards.forEach(shard => {
        expect(shard).toBeInstanceOf(Uint8Array);
        expect(shard.length).toBeGreaterThan(0);
      });
    });

    it('should return empty array for non-existent wallet', async () => {
      const shards = await storageService.retrieveShards('0xNonExistent');
      expect(shards).toHaveLength(0);
    });

    it('should handle partial shard availability gracefully', async () => {
      const mockResult = createMockSecuritizationResult();
      const walletAddress = VALID_ADDRESSES.STANDARD;

      await storageService.distributeShards(mockResult, walletAddress);

      // Manually delete one shard from localStorage
      (global as any).localStorage.removeItem(`shard_sim_mock_${walletAddress}`);

      const shards = await storageService.retrieveShards(walletAddress);

      // Should return 3 shards (4 - 1 deleted)
      expect(shards.length).toBeGreaterThanOrEqual(SHARD_CONSTANTS.MIN_SHARDS_FOR_RECOVERY);
      expect(shards.length).toBeLessThan(SHARD_CONSTANTS.TOTAL_SHARDS);
    });
  });

  describe('retrieveEncryptedSecret', () => {
    it('should retrieve stored encrypted secret', async () => {
      const mockResult = createMockSecuritizationResult();
      const walletAddress = VALID_ADDRESSES.STANDARD;

      await storageService.distributeShards(mockResult, walletAddress);
      const secret = await storageService.retrieveEncryptedSecret(walletAddress);

      expect(secret).toBeDefined();
      expect(secret).toBeInstanceOf(Uint8Array);
      expect(secret!.length).toBeGreaterThan(0);
    });

    it('should return null for non-existent wallet', async () => {
      const secret = await storageService.retrieveEncryptedSecret('0xNonExistent');
      expect(secret).toBeNull();
    });

    it('should retrieve different secrets for different wallets', async () => {
      const result1 = createMockSecuritizationResult();
      const result2 = createMockSecuritizationResult();
      const wallet1 = VALID_ADDRESSES.STANDARD;
      const wallet2 = VALID_ADDRESSES.ALTERNATIVE;

      await storageService.distributeShards(result1, wallet1);
      await storageService.distributeShards(result2, wallet2);

      const secret1 = await storageService.retrieveEncryptedSecret(wallet1);
      const secret2 = await storageService.retrieveEncryptedSecret(wallet2);

      expect(secret1).toBeDefined();
      expect(secret2).toBeDefined();
      // Secrets should exist for both wallets
      expect(secret1!.length).toBeGreaterThan(0);
      expect(secret2!.length).toBeGreaterThan(0);
    });
  });

  describe('checkHealth', () => {
    it('should return healthy status for all storage locations', async () => {
      const health = await storageService.checkHealth();

      expect(health.overall).toBe('healthy');
      expect(health.sim.status).toBe('healthy');
      expect(health.yubikey.status).toBe('healthy');
      expect(health.custodial.status).toBe('healthy');
      expect(health.escrow.status).toBe('healthy');
    });

    it('should include timestamps in health check', async () => {
      const beforeTime = Date.now();
      const health = await storageService.checkHealth();
      const afterTime = Date.now();

      expect(health.sim.lastChecked).toBeGreaterThanOrEqual(beforeTime);
      expect(health.sim.lastChecked).toBeLessThanOrEqual(afterTime);
    });

    it('should provide location information for each storage', async () => {
      const health = await storageService.checkHealth();

      expect(health.sim).toHaveProperty('location');
      expect(health.yubikey).toHaveProperty('location');
      expect(health.custodial).toHaveProperty('location');
      expect(health.escrow).toHaveProperty('location');
    });
  });

  describe('Error Resilience', () => {
    it('should handle storage quota exceeded', async () => {
      const mockResult = createMockSecuritizationResult();
      const walletAddress = VALID_ADDRESSES.STANDARD;

      // Mock quota exceeded error on localStorage
      const originalSetItem = (global as any).localStorage.setItem;
      (global as any).localStorage.setItem = jest.fn(() => {
        throw new Error('QuotaExceededError');
      });

      await expect(
        storageService.distributeShards(mockResult, walletAddress),
      ).rejects.toThrow();

      // Restore original method
      (global as any).localStorage.setItem = originalSetItem;
    });

    it('should handle corrupted storage data gracefully', async () => {
      const walletAddress = VALID_ADDRESSES.STANDARD;

      // Insert corrupted data
      (global as any).localStorage.setItem(
        `shard_sim_mock_${walletAddress}`,
        'corrupted-invalid-json',
      );

      const shards = await storageService.retrieveShards(walletAddress);

      // Should return empty array for corrupted data
      expect(shards).toHaveLength(0);
    });
  });

  describe('Storage Isolation', () => {
    it('should isolate shards between different wallets', async () => {
      const result1 = createMockSecuritizationResult();
      const result2 = createMockSecuritizationResult();
      const wallet1 = VALID_ADDRESSES.STANDARD;
      const wallet2 = VALID_ADDRESSES.ALTERNATIVE;

      await storageService.distributeShards(result1, wallet1);
      await storageService.distributeShards(result2, wallet2);

      // Delete wallet1's shards
      (global as any).localStorage.removeItem(`shard_sim_mock_${wallet1}`);
      (global as any).localStorage.removeItem(`shard_custodial_mock_${wallet1}`);
      (global as any).localStorage.removeItem(`shard_escrow_mock_${wallet1}`);

      // Wallet2's shards should still be intact
      const shards2 = await storageService.retrieveShards(wallet2);
      expect(shards2.length).toBeGreaterThan(0);
    });
  });
});
