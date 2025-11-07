/**
 * Mock Storage Service
 *
 * Provides mock storage for 4 shard locations during development
 * Will be replaced with real storage in Epic 4
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
 * Mock SIM Storage (localStorage)
 * Future: Binary SMS via SMPP Gateway
 */
class MockSIMStorage implements StorageAdapter {
  private readonly storageKey = 'shard_sim_mock';

  async store(shard: Uint8Array, metadata: ShardMetadata): Promise<void> {
    try {
      const data = {
        data: Array.from(shard),
        metadata,
        timestamp: Date.now(),
      };

      localStorage.setItem(`${this.storageKey}_${metadata.walletAddress}`, JSON.stringify(data));
      console.log('[MockSIMStorage] Shard stored successfully');
    } catch (error) {
      console.error('[MockSIMStorage] Store failed:', error);
      throw new Error(`SIM storage failed: ${(error as Error).message}`);
    }
  }

  async retrieve(shardId: string): Promise<Uint8Array | null> {
    try {
      const item = localStorage.getItem(`${this.storageKey}_${shardId}`);
      if (!item) {
        console.warn('[MockSIMStorage] Shard not found');
        return null;
      }

      const { data } = JSON.parse(item);
      console.log('[MockSIMStorage] Shard retrieved successfully');
      return new Uint8Array(data);
    } catch (error) {
      console.error('[MockSIMStorage] Retrieve failed:', error);
      return null;
    }
  }

  async delete(shardId: string): Promise<void> {
    localStorage.removeItem(`${this.storageKey}_${shardId}`);
    console.log('[MockSIMStorage] Shard deleted');
  }

  async healthCheck(): Promise<StorageHealth> {
    try {
      // Test localStorage access
      const testKey = `${this.storageKey}_health_check`;
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);

      return {
        status: 'healthy',
        location: 'sim_mock_localStorage',
        lastChecked: Date.now(),
      };
    } catch (error) {
      return {
        status: 'offline',
        location: 'sim_mock_localStorage',
        lastChecked: Date.now(),
        error: (error as Error).message,
      };
    }
  }
}

/**
 * Mock YubiKey Storage (IndexedDB)
 * Future: YubiKey FIDO2 largeBlob via WebAuthn
 */
class MockYubiKeyStorage implements StorageAdapter {
  private readonly dbName = 'shard_yubikey_mock';
  private readonly storeName = 'shards';

  async store(shard: Uint8Array, metadata: ShardMetadata): Promise<void> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(this.storeName, 'readwrite');
      const store = tx.objectStore(this.storeName);

      await new Promise<void>((resolve, reject) => {
        const request = store.put({
          id: metadata.walletAddress,
          data: Array.from(shard),
          metadata,
          timestamp: Date.now(),
        });
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      console.log('[MockYubiKeyStorage] Shard stored successfully');
    } catch (error) {
      console.error('[MockYubiKeyStorage] Store failed:', error);
      throw new Error(`YubiKey storage failed: ${(error as Error).message}`);
    }
  }

  async retrieve(shardId: string): Promise<Uint8Array | null> {
    try {
      const db = await this.openDB();
      const tx = db.transaction(this.storeName, 'readonly');
      const store = tx.objectStore(this.storeName);

      const result = await new Promise<any>((resolve, reject) => {
        const request = store.get(shardId);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });

      if (!result) {
        console.warn('[MockYubiKeyStorage] Shard not found');
        return null;
      }

      console.log('[MockYubiKeyStorage] Shard retrieved successfully');
      return new Uint8Array(result.data);
    } catch (error) {
      console.error('[MockYubiKeyStorage] Retrieve failed:', error);
      return null;
    }
  }

  async delete(shardId: string): Promise<void> {
    const db = await this.openDB();
    const tx = db.transaction(this.storeName, 'readwrite');
    const store = tx.objectStore(this.storeName);

    await new Promise<void>((resolve, reject) => {
      const request = store.delete(shardId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    console.log('[MockYubiKeyStorage] Shard deleted');
  }

  async healthCheck(): Promise<StorageHealth> {
    try {
      const db = await this.openDB();
      db.close();

      return {
        status: 'healthy',
        location: 'yubikey_mock_indexedDB',
        lastChecked: Date.now(),
      };
    } catch (error) {
      return {
        status: 'offline',
        location: 'yubikey_mock_indexedDB',
        lastChecked: Date.now(),
        error: (error as Error).message,
      };
    }
  }

  private async openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains(this.storeName)) {
          db.createObjectStore(this.storeName, { keyPath: 'id' });
        }
      };
    });
  }
}

/**
 * Mock Custodial Storage (localStorage)
 * Future: AWS DynamoDB via API Gateway
 */
class MockCustodialStorage implements StorageAdapter {
  private readonly storageKey = 'shard_custodial_mock';

  async store(shard: Uint8Array, metadata: ShardMetadata): Promise<void> {
    try {
      const data = {
        data: Array.from(shard),
        metadata,
        timestamp: Date.now(),
      };

      localStorage.setItem(`${this.storageKey}_${metadata.walletAddress}`, JSON.stringify(data));
      console.log('[MockCustodialStorage] Shard stored successfully');
    } catch (error) {
      console.error('[MockCustodialStorage] Store failed:', error);
      throw new Error(`Custodial storage failed: ${(error as Error).message}`);
    }
  }

  async retrieve(shardId: string): Promise<Uint8Array | null> {
    try {
      const item = localStorage.getItem(`${this.storageKey}_${shardId}`);
      if (!item) {
        console.warn('[MockCustodialStorage] Shard not found');
        return null;
      }

      const { data } = JSON.parse(item);
      console.log('[MockCustodialStorage] Shard retrieved successfully');
      return new Uint8Array(data);
    } catch (error) {
      console.error('[MockCustodialStorage] Retrieve failed:', error);
      return null;
    }
  }

  async delete(shardId: string): Promise<void> {
    localStorage.removeItem(`${this.storageKey}_${shardId}`);
    console.log('[MockCustodialStorage] Shard deleted');
  }

  async healthCheck(): Promise<StorageHealth> {
    try {
      const testKey = `${this.storageKey}_health_check`;
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);

      return {
        status: 'healthy',
        location: 'custodial_mock_localStorage',
        lastChecked: Date.now(),
      };
    } catch (error) {
      return {
        status: 'offline',
        location: 'custodial_mock_localStorage',
        lastChecked: Date.now(),
        error: (error as Error).message,
      };
    }
  }
}

/**
 * Mock Escrow Storage (localStorage)
 * Future: AWS QLDB via API Gateway
 */
class MockEscrowStorage implements StorageAdapter {
  private readonly storageKey = 'shard_escrow_mock';

  async store(shard: Uint8Array, metadata: ShardMetadata): Promise<void> {
    try {
      const data = {
        data: Array.from(shard),
        metadata,
        timestamp: Date.now(),
      };

      localStorage.setItem(`${this.storageKey}_${metadata.walletAddress}`, JSON.stringify(data));
      console.log('[MockEscrowStorage] Shard stored successfully');
    } catch (error) {
      console.error('[MockEscrowStorage] Store failed:', error);
      throw new Error(`Escrow storage failed: ${(error as Error).message}`);
    }
  }

  async retrieve(shardId: string): Promise<Uint8Array | null> {
    try {
      const item = localStorage.getItem(`${this.storageKey}_${shardId}`);
      if (!item) {
        console.warn('[MockEscrowStorage] Shard not found');
        return null;
      }

      const { data } = JSON.parse(item);
      console.log('[MockEscrowStorage] Shard retrieved successfully');
      return new Uint8Array(data);
    } catch (error) {
      console.error('[MockEscrowStorage] Retrieve failed:', error);
      return null;
    }
  }

  async delete(shardId: string): Promise<void> {
    localStorage.removeItem(`${this.storageKey}_${shardId}`);
    console.log('[MockEscrowStorage] Shard deleted');
  }

  async healthCheck(): Promise<StorageHealth> {
    try {
      const testKey = `${this.storageKey}_health_check`;
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);

      return {
        status: 'healthy',
        location: 'escrow_mock_localStorage',
        lastChecked: Date.now(),
      };
    } catch (error) {
      return {
        status: 'offline',
        location: 'escrow_mock_localStorage',
        lastChecked: Date.now(),
        error: (error as Error).message,
      };
    }
  }
}

/**
 * Main Mock Storage Service
 * Coordinates all 4 storage locations
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
   * Also stores the double_encrypted_secret in SIM storage
   */
  async distributeShards(
    result: SecuritizationResult,
    walletAddress: string,
  ): Promise<void> {
    console.log('[MockStorageService] Distributing shards for', walletAddress);

    const baseMetadata = {
      walletAddress,
      timestamp: Date.now(),
      threshold: 2,
      totalShards: 4,
    };

    // Distribute shards in parallel
    await Promise.all([
      this.sim.store(result.sim_shard, { ...baseMetadata, shardId: 'shard_1', index: 1 }),
      this.yubikey.store(result.recovery_shard, { ...baseMetadata, shardId: 'shard_2', index: 2 }),
      this.custodial.store(result.cloud_shard, { ...baseMetadata, shardId: 'shard_3', index: 3 }),
      this.escrow.store(result.custodial_shard, { ...baseMetadata, shardId: 'shard_4', index: 4 }),
    ]);

    // Store the double_encrypted_secret (stored in SIM/localStorage for easy retrieval)
    await this.storeEncryptedSecret(walletAddress, result.double_encrypted_secret);

    console.log('[MockStorageService] All shards and encrypted secret distributed successfully');
  }

  /**
   * Store the double-encrypted secret for a wallet
   */
  private async storeEncryptedSecret(
    walletAddress: string,
    doubleEncryptedSecret: Uint8Array,
  ): Promise<void> {
    try {
      const data = {
        data: Array.from(doubleEncryptedSecret),
        timestamp: Date.now(),
      };

      localStorage.setItem(`shard_secret_${walletAddress}`, JSON.stringify(data));
      console.log('[MockStorageService] Encrypted secret stored successfully');
    } catch (error) {
      console.error('[MockStorageService] Failed to store encrypted secret:', error);
      throw new Error(`Failed to store encrypted secret: ${(error as Error).message}`);
    }
  }

  /**
   * Retrieve the double-encrypted secret for a wallet
   */
  async retrieveEncryptedSecret(walletAddress: string): Promise<Uint8Array | null> {
    try {
      const item = localStorage.getItem(`shard_secret_${walletAddress}`);
      if (!item) {
        console.warn('[MockStorageService] Encrypted secret not found');
        return null;
      }

      const { data } = JSON.parse(item);
      console.log('[MockStorageService] Encrypted secret retrieved successfully');
      return new Uint8Array(data);
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
