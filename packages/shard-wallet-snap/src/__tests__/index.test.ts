/**
 * Basic tests for Shard Wallet Snap
 */

import { SecuritizationService } from '../services/securitization';
import { MockStorageService } from '../services/storage';

describe('Shard Wallet Snap', () => {
  describe('SecuritizationService', () => {
    it('should create an instance', () => {
      const service = new SecuritizationService();
      expect(service).toBeDefined();
    });

    // Additional tests will be added in Story 3.3
  });

  describe('MockStorageService', () => {
    let storage: MockStorageService;

    beforeEach(() => {
      storage = new MockStorageService();
    });

    it('should create an instance', () => {
      expect(storage).toBeDefined();
    });

    it('should check health of all storage locations', async () => {
      const health = await storage.checkHealth();

      expect(health).toHaveProperty('sim');
      expect(health).toHaveProperty('yubikey');
      expect(health).toHaveProperty('custodial');
      expect(health).toHaveProperty('escrow');
      expect(health).toHaveProperty('overall');

      // In test environment, localStorage should be available
      expect(['healthy', 'degraded', 'critical', 'offline']).toContain(
        health.overall,
      );
    });

    // Additional tests will be added in Story 3.4
  });
});
