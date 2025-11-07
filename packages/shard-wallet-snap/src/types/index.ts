/**
 * Type definitions for Shard Wallet Snap
 */

// Shard metadata
export interface ShardMetadata {
  shardId: string;
  index: number;
  walletAddress?: string;
  timestamp: number;
  threshold: number;
  totalShards: number;
}

// Securitization result from crypto SDK
export interface SecuritizationResult {
  sim_shard: Uint8Array;
  recovery_shard: Uint8Array;
  cloud_shard: Uint8Array;
  custodial_shard: Uint8Array;
  encrypted_secret: Uint8Array;
}

// Storage health status
export type HealthStatusType = 'healthy' | 'degraded' | 'critical' | 'offline';

export interface StorageHealth {
  status: HealthStatusType;
  location: string;
  lastChecked: number;
  error?: string;
}

export interface HealthStatus {
  sim: StorageHealth;
  yubikey: StorageHealth;
  custodial: StorageHealth;
  escrow: StorageHealth;
  overall: HealthStatusType;
}

// RPC request/response types
export interface SecuritizeRequest {
  privateKey: string;
  walletAddress: string;
}

export interface SecuritizeResponse {
  success: boolean;
  message: string;
  healthStatus?: HealthStatus;
}

export interface RecoverRequest {
  walletAddress: string;
}

export interface RecoverResponse {
  success: boolean;
  privateKey?: string;
  error?: string;
}

export interface HealthCheckResponse {
  timestamp: number;
  status: HealthStatusType;
  details: {
    sim: HealthStatusType;
    yubikey: HealthStatusType;
    custodial: HealthStatusType;
    escrow: HealthStatusType;
  };
  recommendations: string[];
}

// Snap state
export interface SnapState {
  wallets: {
    [address: string]: {
      securitized: boolean;
      timestamp: number;
      shardLocations: string[];
    };
  };
  lastHealthCheck: number;
  healthStatus: HealthStatus;
}

// Storage adapter interface
export interface StorageAdapter {
  store(shard: Uint8Array, metadata: ShardMetadata): Promise<void>;
  retrieve(shardId: string): Promise<Uint8Array | null>;
  delete(shardId: string): Promise<void>;
  healthCheck(): Promise<StorageHealth>;
}
