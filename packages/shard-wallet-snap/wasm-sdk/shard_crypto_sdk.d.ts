/* tslint:disable */
/* eslint-disable */
export function start(): void;
/**
 * Encrypt data with PIN-derived key (PBKDF2 + AES-256-GCM)
 *
 * Returns an object with `encrypted` and `salt` properties
 */
export function encryptWithPin(data: Uint8Array, pin: string, salt?: Uint8Array | null): any;
/**
 * Decrypt data with PIN-derived key
 */
export function decryptWithPin(encrypted: Uint8Array, pin: string, salt: Uint8Array): Uint8Array;
/**
 * Generate a random AES-256 encryption key
 */
export function generateKey(): Uint8Array;
/**
 * Encrypt data with provided key (AES-256-GCM)
 */
export function encryptWithKey(data: Uint8Array, key: Uint8Array): Uint8Array;
/**
 * Decrypt data with provided key
 */
export function decryptWithKey(encrypted: Uint8Array, key: Uint8Array): Uint8Array;
/**
 * Verify a signature
 */
export function verifySignature(message: Uint8Array, signature: Uint8Array, public_key: Uint8Array): boolean;
/**
 * Get SDK version
 */
export function getVersion(): string;
/**
 * Convert bytes to hex string
 */
export function bytesToHex(bytes: Uint8Array): string;
/**
 * Convert hex string to bytes
 */
export function hexToBytes(hex_str: string): Uint8Array;
/**
 * ECDSA secp256k1 keypair for WASM
 */
export class KeyPair {
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Generate a new random keypair
   */
  constructor();
  /**
   * Create keypair from private key bytes
   */
  static fromPrivateKey(private_key: Uint8Array): KeyPair;
  /**
   * Sign a message
   */
  sign(message: Uint8Array): Uint8Array;
  /**
   * Get private key bytes (32 bytes)
   */
  readonly privateKey: Uint8Array;
  /**
   * Get Ethereum address as hex string (with 0x prefix)
   */
  readonly ethereumAddress: string;
  /**
   * Get compressed public key (33 bytes)
   */
  readonly publicKey: Uint8Array;
}
/**
 * Shamir Secret Sharing for WASM
 */
export class SecretSharer {
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Create a new secret sharer
   *
   * # Arguments
   * * `threshold` - Minimum shards needed to reconstruct (M)
   * * `total_shards` - Total number of shards to create (N)
   */
  constructor(threshold: number, total_shards: number);
  /**
   * Split a secret into shards
   *
   * Returns an array of Uint8Array shards
   */
  split(secret: Uint8Array): any;
  /**
   * Reconstruct secret from shards
   *
   * # Arguments
   * * `shards` - Array of shard byte arrays
   */
  reconstruct(shards: any): Uint8Array;
  /**
   * Get threshold value
   */
  readonly threshold: number;
  /**
   * Get total shards value
   */
  readonly totalShards: number;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_keypair_free: (a: number, b: number) => void;
  readonly keypair_generate: (a: number) => void;
  readonly keypair_fromPrivateKey: (a: number, b: number, c: number) => void;
  readonly keypair_privateKey: (a: number, b: number) => void;
  readonly keypair_ethereumAddress: (a: number, b: number) => void;
  readonly keypair_publicKey: (a: number, b: number) => void;
  readonly keypair_sign: (a: number, b: number, c: number, d: number) => void;
  readonly __wbg_secretsharer_free: (a: number, b: number) => void;
  readonly secretsharer_new: (a: number, b: number, c: number) => void;
  readonly secretsharer_threshold: (a: number) => number;
  readonly secretsharer_totalShards: (a: number) => number;
  readonly secretsharer_split: (a: number, b: number, c: number, d: number) => void;
  readonly secretsharer_reconstruct: (a: number, b: number, c: number) => void;
  readonly encryptWithPin: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly decryptWithPin: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly generateKey: (a: number) => void;
  readonly encryptWithKey: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly decryptWithKey: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly verifySignature: (a: number, b: number, c: number, d: number, e: number, f: number, g: number) => void;
  readonly getVersion: (a: number) => void;
  readonly bytesToHex: (a: number, b: number, c: number) => void;
  readonly hexToBytes: (a: number, b: number, c: number) => void;
  readonly start: () => void;
  readonly shard_keypair_generate: (a: number) => number;
  readonly shard_keypair_from_private_key: (a: number, b: number, c: number) => number;
  readonly shard_keypair_get_private_key: (a: number, b: number) => number;
  readonly shard_keypair_get_ethereum_address: (a: number, b: number) => number;
  readonly shard_keypair_get_public_key: (a: number, b: number) => number;
  readonly shard_keypair_sign_message: (a: number, b: number, c: number, d: number) => number;
  readonly shard_verify_signature: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly shard_keypair_free: (a: number) => void;
  readonly shard_byte_array_free: (a: number) => void;
  readonly shard_encrypt_with_pin: (a: number, b: number, c: number, d: number, e: number, f: number) => number;
  readonly shard_decrypt_with_pin: (a: number, b: number, c: number, d: number) => number;
  readonly shard_generate_encryption_key: (a: number) => number;
  readonly shard_encrypt_with_key: (a: number, b: number, c: number, d: number) => number;
  readonly shard_decrypt_with_key: (a: number, b: number, c: number) => number;
  readonly shard_sharer_create: (a: number, b: number, c: number) => number;
  readonly shard_split_secret: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly shard_reconstruct_secret: (a: number, b: number, c: number, d: number) => number;
  readonly shard_sharer_free: (a: number) => void;
  readonly shard_get_last_error: () => number;
  readonly shard_get_version: () => number;
  readonly shard_clear_last_error: () => void;
  readonly __wbindgen_export_0: (a: number) => void;
  readonly __wbindgen_export_1: (a: number, b: number, c: number) => void;
  readonly __wbindgen_export_2: (a: number, b: number) => number;
  readonly __wbindgen_export_3: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
