/**
 * Mock Storage Service (Snap State API)
 *
 * Uses snap_manageState for storage (MetaMask Snaps compatible)
 * Browser version preserved in storage.browser.ts
 */

import type {
  StorageAdapter,
  StorageHealth,
  HealthStatus,
  ShardMetadata,
  SecuritizationResult,
  HealthStatusType,
} from '../types';

/**
 * Get the current snap state
 */
async function getState(): Promise<any> {
  const state = await snap.request({
    method: 'snap_manageState',
    params: { operation: 'get' },
  });
  return state || { shards: {} };
}

/**
 * Update the snap state
 */
async function setState(newState: any): Promise<void> {
  await snap.request({
    method: 'snap_manageState',
    params: {
      operation: 'update',
      newState,
    },
  });
}

/**
 * Mock SIM Storage (Snap State)
 * Future: Binary SMS via SMPP Gateway
 */
class MockSIMStorage implements StorageAdapter {
  private readonly storageKey = 'sim';

  async store(shard: Uint8Array, metadata: ShardMetadata): Promise<void> {
    try {
      const state = await getState();

      if (!state.shards) {
        state.shards = {};
      }
      if (!state.shards[metadata.walletAddress]) {
        state.shards[metadata.walletAddress] = {};
      }

      state.shards[metadata.walletAddress][this.storageKey] = {
        data: Array.from(shard),
        metadata,
        timestamp: Date.now(),
      };

      await setState(state);
      console.log('[MockSIMStorage] Shard stored successfully');
    } catch (error) {
      console.error('[MockSIMStorage] Store failed:', error);
      throw new Error(`SIM storage failed: ${(error as Error).message}`);
    }
  }

  async retrieve(shardId: string): Promise<Uint8Array | null> {
    try {
      const state = await getState();
      const item = state.shards?.[shardId]?.[this.storageKey];

      if (!item) {
        console.warn('[MockSIMStorage] Shard not found');
        return null;
      }

      console.log('[MockSIMStorage] Shard retrieved successfully');
      return new Uint8Array(item.data);
    } catch (error) {
      console.error('[MockSIMStorage] Retrieve failed:', error);
      return null;
    }
  }

  async delete(shardId: string): Promise<void> {
    try {
      const state = await getState();
      if (state.shards?.[shardId]) {
        delete state.shards[shardId][this.storageKey];
        await setState(state);
      }
      console.log('[MockSIMStorage] Shard deleted');
    } catch (error) {
      console.error('[MockSIMStorage] Delete failed:', error);
    }
  }

  async healthCheck(): Promise<StorageHealth> {
    try {
      // Test state access
      await getState();

      return {
        status: 'healthy',
        location: 'sim_snap_state',
        lastChecked: Date.now(),
      };
    } catch (error) {
      return {
        status: 'offline',
        location: 'sim_snap_state',
        lastChecked: Date.now(),
        error: (error as Error).message,
      };
    }
  }
}

/**
 * Mock YubiKey Storage (Snap State)
 * Future: YubiKey FIDO2 largeBlob via WebAuthn
 */
class MockYubiKeyStorage implements StorageAdapter {
  private readonly storageKey = 'yubikey';

  async store(shard: Uint8Array, metadata: ShardMetadata): Promise<void> {
    try {
      const state = await getState();

      if (!state.shards) {
        state.shards = {};
      }
      if (!state.shards[metadata.walletAddress]) {
        state.shards[metadata.walletAddress] = {};
      }

      state.shards[metadata.walletAddress][this.storageKey] = {
        data: Array.from(shard),
        metadata,
        timestamp: Date.now(),
      };

      await setState(state);
      console.log('[MockYubiKeyStorage] Shard stored successfully');
    } catch (error) {
      console.error('[MockYubiKeyStorage] Store failed:', error);
      throw new Error(`YubiKey storage failed: ${(error as Error).message}`);
    }
  }

  async retrieve(shardId: string): Promise<Uint8Array | null> {
    try {
      const state = await getState();
      const item = state.shards?.[shardId]?.[this.storageKey];

      if (!item) {
        console.warn('[MockYubiKeyStorage] Shard not found');
        return null;
      }

      console.log('[MockYubiKeyStorage] Shard retrieved successfully');
      return new Uint8Array(item.data);
    } catch (error) {
      console.error('[MockYubiKeyStorage] Retrieve failed:', error);
      return null;
    }
  }

  async delete(shardId: string): Promise<void> {
    try {
      const state = await getState();
      if (state.shards?.[shardId]) {
        delete state.shards[shardId][this.storageKey];
        await setState(state);
      }
      console.log('[MockYubiKeyStorage] Shard deleted');
    } catch (error) {
      console.error('[MockYubiKeyStorage] Delete failed:', error);
    }
  }

  async healthCheck(): Promise<StorageHealth> {
    try {
      await getState();

      return {
        status: 'healthy',
        location: 'yubikey_snap_state',
        lastChecked: Date.now(),
      };
    } catch (error) {
      return {
        status: 'offline',
        location: 'yubikey_snap_state',
        lastChecked: Date.now(),
        error: (error as Error).message,
      };
    }
  }
}

/**
 * Mock Custodial Storage (Snap State)
 * Future: AWS DynamoDB via API Gateway
 */
class MockCustodialStorage implements StorageAdapter {
  private readonly storageKey = 'custodial';

  async store(shard: Uint8Array, metadata: ShardMetadata): Promise<void> {
    try {
      const state = await getState();

      if (!state.shards) {
        state.shards = {};
      }
      if (!state.shards[metadata.walletAddress]) {
        state.shards[metadata.walletAddress] = {};
      }

      state.shards[metadata.walletAddress][this.storageKey] = {
        data: Array.from(shard),
        metadata,
        timestamp: Date.now(),
      };

      await setState(state);
      console.log('[MockCustodialStorage] Shard stored successfully');
    } catch (error) {
      console.error('[MockCustodialStorage] Store failed:', error);
      throw new Error(`Custodial storage failed: ${(error as Error).message}`);
    }
  }

  async retrieve(shardId: string): Promise<Uint8Array | null> {
    try {
      const state = await getState();
      const item = state.shards?.[shardId]?.[this.storageKey];

      if (!item) {
        console.warn('[MockCustodialStorage] Shard not found');
        return null;
      }

      console.log('[MockCustodialStorage] Shard retrieved successfully');
      return new Uint8Array(item.data);
    } catch (error) {
      console.error('[MockCustodialStorage] Retrieve failed:', error);
      return null;
    }
  }

  async delete(shardId: string): Promise<void> {
    try {
      const state = await getState();
      if (state.shards?.[shardId]) {
        delete state.shards[shardId][this.storageKey];
        await setState(state);
      }
      console.log('[MockCustodialStorage] Shard deleted');
    } catch (error) {
      console.error('[MockCustodialStorage] Delete failed:', error);
    }
  }

  async healthCheck(): Promise<StorageHealth> {
    try {
      await getState();

      return {
        status: 'healthy',
        location: 'custodial_snap_state',
        lastChecked: Date.now(),
      };
    } catch (error) {
      return {
        status: 'offline',
        location: 'custodial_snap_state',
        lastChecked: Date.now(),
        error: (error as Error).message,
      };
    }
  }
}

/**
 * Mock Escrow Storage (Snap State)
 * Future: AWS QLDB via API Gateway
 */
class MockEscrowStorage implements StorageAdapter {
  private readonly storageKey = 'escrow';

  async store(shard: Uint8Array, metadata: ShardMetadata): Promise<void> {
    try {
      const state = await getState();

      if (!state.shards) {
        state.shards = {};
      }
      if (!state.shards[metadata.walletAddress]) {
        state.shards[metadata.walletAddress] = {};
      }

      state.shards[metadata.walletAddress][this.storageKey] = {
        data: Array.from(shard),
        metadata,
        timestamp: Date.now(),
      };

      await setState(state);
      console.log('[MockEscrowStorage] Shard stored successfully');
    } catch (error) {
      console.error('[MockEscrowStorage] Store failed:', error);
      throw new Error(`Escrow storage failed: ${(error as Error).message}`);
    }
  }

  async retrieve(shardId: string): Promise<Uint8Array | null> {
    try {
      const state = await getState();
      const item = state.shards?.[shardId]?.[this.storageKey];

      if (!item) {
        console.warn('[MockEscrowStorage] Shard not found');
        return null;
      }

      console.log('[MockEscrowStorage] Shard retrieved successfully');
      return new Uint8Array(item.data);
    } catch (error) {
      console.error('[MockEscrowStorage] Retrieve failed:', error);
      return null;
    }
  }

  async delete(shardId: string): Promise<void> {
    try {
      const state = await getState();
      if (state.shards?.[shardId]) {
        delete state.shards[shardId][this.storageKey];
        await setState(state);
      }
      console.log('[MockEscrowStorage] Shard deleted');
    } catch (error) {
      console.error('[MockEscrowStorage] Delete failed:', error);
    }
  }

  async healthCheck(): Promise<StorageHealth> {
    try {
      await getState();

      return {
        status: 'healthy',
        location: 'escrow_snap_state',
        lastChecked: Date.now(),
      };
    } catch (error) {
      return {
        status: 'offline',
        location: 'escrow_snap_state',
        lastChecked: Date.now(),
        error: (error as Error).message,
      };
    }
  }
}

/**
 * Main Mock Storage Service
 * Coordinates all 4 storage locations using Snap State API
 */
export class MockStorageService {
  private sim: MockSIMStorage;
  private yubikey: MockYubiKeyStorage;
  private custodial: MockCustodialStorage;
  private escrow: MockEscrowStorage;

  constructor() {
    this.sim = new MockSIMStorage();
    this.yubikey = new MockYubiKeyStorage();
    this.custodial = new MockCustodialStorage();
    this.escrow = new MockEscrowStorage();
  }

  /**
   * Distribute shards to all 4 storage locations
   * Also stores the encrypted_secret
   */
  async distributeShards(
    result: SecuritizationResult,
    walletAddress: string,
  ): Promise<void> {
    console.log('[MockStorageService] Distributing shards for', walletAddress);

    const timestamp = Date.now();
    const baseMetadata = {
      walletAddress,
      timestamp,
      threshold: 2,
      totalShards: 4,
    };

    // Get state once to avoid race conditions
    const state = await getState();

    if (!state.shards) {
      state.shards = {};
    }
    if (!state.shards[walletAddress]) {
      state.shards[walletAddress] = {};
    }
    if (!state.secrets) {
      state.secrets = {};
    }

    // Store all 4 shards in state
    state.shards[walletAddress].sim = {
      data: Array.from(result.sim_shard),
      metadata: { ...baseMetadata, shardId: 'shard_1', index: 1 },
      timestamp,
    };

    state.shards[walletAddress].yubikey = {
      data: Array.from(result.recovery_shard),
      metadata: { ...baseMetadata, shardId: 'shard_2', index: 2 },
      timestamp,
    };

    state.shards[walletAddress].custodial = {
      data: Array.from(result.cloud_shard),
      metadata: { ...baseMetadata, shardId: 'shard_3', index: 3 },
      timestamp,
    };

    state.shards[walletAddress].escrow = {
      data: Array.from(result.custodial_shard),
      metadata: { ...baseMetadata, shardId: 'shard_4', index: 4 },
      timestamp,
    };

    // Store the encrypted_secret
    state.secrets[walletAddress] = {
      data: Array.from(result.encrypted_secret),
      timestamp,
    };

    // Save state once
    await setState(state);

    console.log('[MockStorageService] All shards and encrypted secret distributed successfully');
  }

  /**
   * Store the encrypted secret for a wallet
   */
  private async storeEncryptedSecret(
    walletAddress: string,
    encryptedSecret: Uint8Array,
  ): Promise<void> {
    try {
      const state = await getState();

      if (!state.secrets) {
        state.secrets = {};
      }

      state.secrets[walletAddress] = {
        data: Array.from(doubleEncryptedSecret),
        timestamp: Date.now(),
      };

      await setState(state);
      console.log('[MockStorageService] Encrypted secret stored successfully');
    } catch (error) {
      console.error('[MockStorageService] Failed to store encrypted secret:', error);
      throw new Error(`Failed to store encrypted secret: ${(error as Error).message}`);
    }
  }

  /**
   * Retrieve the encrypted secret for a wallet
   */
  async retrieveEncryptedSecret(walletAddress: string): Promise<Uint8Array | null> {
    try {
      const state = await getState();
      const item = state.secrets?.[walletAddress];

      if (!item) {
        console.warn('[MockStorageService] Encrypted secret not found');
        return null;
      }

      console.log('[MockStorageService] Encrypted secret retrieved successfully');
      return new Uint8Array(item.data);
    } catch (error) {
      console.error('[MockStorageService] Failed to retrieve encrypted secret:', error);
      return null;
    }
  }

  /**
   * Retrieve shards from all available storage locations
   */
  async retrieveShards(walletAddress: string): Promise<Uint8Array[]> {
    console.log('[MockStorageService] Retrieving shards for', walletAddress);

    const [shard1, shard2, shard3, shard4] = await Promise.all([
      this.sim.retrieve(walletAddress),
      this.yubikey.retrieve(walletAddress),
      this.custodial.retrieve(walletAddress),
      this.escrow.retrieve(walletAddress),
    ]);

    const shards = [shard1, shard2, shard3, shard4].filter(
      (s) => s !== null,
    ) as Uint8Array[];

    console.log(`[MockStorageService] Retrieved ${shards.length} shards`);
    return shards;
  }

  /**
   * Check health of all storage locations
   */
  async checkHealth(): Promise<HealthStatus> {
    console.log('[MockStorageService] Checking health of all storage locations...');

    const [sim, yubikey, custodial, escrow] = await Promise.all([
      this.sim.healthCheck(),
      this.yubikey.healthCheck(),
      this.custodial.healthCheck(),
      this.escrow.healthCheck(),
    ]);

    const overall = this.computeOverallHealth([sim, yubikey, custodial, escrow]);

    const healthStatus = {
      sim,
      yubikey,
      custodial,
      escrow,
      overall,
    };

    console.log('[MockStorageService] Health check complete:', healthStatus);
    return healthStatus;
  }

  /**
   * Compute overall health status based on individual checks
   */
  private computeOverallHealth(checks: StorageHealth[]): HealthStatusType {
    const healthyCount = checks.filter((c) => c.status === 'healthy').length;

    if (healthyCount >= 3) return 'healthy'; // 3+ shards (can lose 1 more)
    if (healthyCount >= 2) return 'degraded'; // 2 shards (minimum for recovery)
    return 'critical'; // <2 shards (cannot recover)
  }
}
