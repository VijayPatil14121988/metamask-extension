/**
 * Mock WASM SDK for Testing
 *
 * Provides mock implementations of the WASM SDK functions for unit/integration testing
 */

console.log('[MOCK] shard_crypto_sdk mock loaded!');

/**
 * Mock initialization
 */
export default async function init(): Promise<void> {
  console.log('[MOCK] init() called');
  return Promise.resolve();
}

/**
 * Mock SecretSharer class
 */
export class SecretSharer {
  threshold: number;
  totalShards: number;

  constructor(threshold: number, totalShards: number) {
    this.threshold = threshold;
    this.totalShards = totalShards;
  }

  split(_secret: Uint8Array): Uint8Array[] {
    // Return mock shards
    return Array.from({ length: this.totalShards }, () =>
      new Uint8Array(32).fill(1)
    );
  }

  reconstruct(_shards: Uint8Array[]): Uint8Array {
    // Return mock reconstructed secret
    return new Uint8Array(32).fill(1);
  }

  free(): void {}
}

/**
 * Mock KeyPair class
 */
export class KeyPair {
  privateKey: Uint8Array;
  publicKey: Uint8Array;
  ethereumAddress: string;

  constructor() {
    this.privateKey = new Uint8Array(32).fill(1);
    this.publicKey = new Uint8Array(33).fill(2);
    this.ethereumAddress = '0x' + '1'.repeat(40);
  }

  static fromPrivateKey(_privateKey: Uint8Array): KeyPair {
    return new KeyPair();
  }

  sign(_message: Uint8Array): Uint8Array {
    return new Uint8Array(64).fill(1);
  }

  free(): void {}
}

/**
 * Mock encryptWithPin
 * Returns encrypted data and salt
 */
export function encryptWithPin(data: Uint8Array, _pin: string, salt?: Uint8Array | null): any {
  // Use provided salt or generate new one
  const usedSalt = salt || new Uint8Array(16).fill(2);

  // Mock encryption: just prepend a marker byte to distinguish encrypted data
  const mockEncrypted = new Uint8Array(data.length + 16); // data + GCM tag
  mockEncrypted[0] = 0xEE; // Marker for PIN-encrypted data
  mockEncrypted.set(data, 1);

  return {
    encrypted: mockEncrypted,
    salt: usedSalt,
  };
}

/**
 * Mock decryptWithPin
 * Reverses the mock encryption
 */
export function decryptWithPin(encrypted: Uint8Array, _pin: string, _salt: Uint8Array): Uint8Array {
  // Check for PIN-encrypted marker
  if (encrypted[0] !== 0xEE) {
    throw new Error('Invalid PIN-encrypted data');
  }

  // Remove marker and GCM tag simulation
  return encrypted.slice(1, encrypted.length - 15);
}

/**
 * Mock generateKey
 * Generate a deterministic but unique key for testing
 */
export function generateKey(): Uint8Array {
  const key = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    key[i] = (i * 7 + 42) % 256; // Deterministic pattern
  }
  return key;
}

/**
 * Mock encryptWithKey
 * Adds a marker and simulates GCM tag
 */
export function encryptWithKey(data: Uint8Array, _key: Uint8Array): Uint8Array {
  const encrypted = new Uint8Array(data.length + 16); // data + GCM tag
  encrypted[0] = 0xAA; // Marker for key-encrypted data
  encrypted.set(data, 1);
  return encrypted;
}

/**
 * Mock decryptWithKey
 * Reverses the mock encryption
 */
export function decryptWithKey(encrypted: Uint8Array, _key: Uint8Array): Uint8Array {
  // Check for key-encrypted marker
  if (encrypted[0] !== 0xAA) {
    throw new Error('Invalid key-encrypted data');
  }

  // Remove marker and GCM tag simulation
  return encrypted.slice(1, encrypted.length - 15);
}

/**
 * Mock getVersion
 */
export function getVersion(): string {
  return '1.0.0-mock';
}

/**
 * Mock bytesToHex
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Mock hexToBytes
 */
export function hexToBytes(hexStr: string): Uint8Array {
  const cleanHex = hexStr.startsWith('0x') ? hexStr.slice(2) : hexStr;
  const bytes = new Uint8Array(cleanHex.length / 2);
  for (let i = 0; i < cleanHex.length; i += 2) {
    bytes[i / 2] = parseInt(cleanHex.substr(i, 2), 16);
  }
  return bytes;
}
