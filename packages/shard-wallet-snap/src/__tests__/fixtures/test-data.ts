/**
 * Test Fixtures
 *
 * Common test data for use across test suites
 */

/**
 * Valid test private keys
 */
export const VALID_PRIVATE_KEYS = {
  // Standard test key (all 1s)
  STANDARD: '0x' + '1'.repeat(64),

  // Alternative test key (all 2s)
  ALTERNATIVE: '0x' + '2'.repeat(64),

  // Mixed hex characters (exactly 64 hex chars)
  MIXED_HEX: '0x' + 'abcdef1234567890'.repeat(4), // 16 * 4 = 64 chars

  // Uppercase hex
  UPPERCASE: '0x' + 'A'.repeat(64),

  // Without 0x prefix
  NO_PREFIX: 'f'.repeat(64),
};

/**
 * Invalid test private keys
 */
export const INVALID_PRIVATE_KEYS = {
  // Too short
  TOO_SHORT: '0x' + '1'.repeat(32),

  // Too long
  TOO_LONG: '0x' + '1'.repeat(128),

  // Invalid characters
  INVALID_CHARS: '0x' + 'g'.repeat(64),

  // All zeros
  ALL_ZEROS: '0x' + '0'.repeat(64),

  // Empty string
  EMPTY: '',

  // With spaces
  WITH_SPACES: '0x' + '1'.repeat(32) + ' ' + '1'.repeat(31),

  // Special characters
  SPECIAL_CHARS: '0x' + '1'.repeat(60) + '!@#$',
};

/**
 * Valid test Ethereum addresses
 */
export const VALID_ADDRESSES = {
  // Standard test address (all 1s)
  STANDARD: '0x' + '1'.repeat(40),

  // Alternative test address (all 2s)
  ALTERNATIVE: '0x' + '2'.repeat(40),

  // Third test address (all 3s)
  THIRD: '0x' + '3'.repeat(40),

  // Checksummed address (real example)
  CHECKSUMMED: '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',

  // Lowercase
  LOWERCASE: '0xabcdef1234567890abcdef1234567890abcdef12',

  // Uppercase
  UPPERCASE: '0x' + 'A'.repeat(40),
};

/**
 * Invalid test Ethereum addresses
 */
export const INVALID_ADDRESSES = {
  // No 0x prefix
  NO_PREFIX: '1'.repeat(40),

  // Too short
  TOO_SHORT: '0x' + '1'.repeat(20),

  // Too long
  TOO_LONG: '0x' + '1'.repeat(80),

  // Invalid characters
  INVALID_CHARS: '0x' + 'g'.repeat(40),

  // Empty string
  EMPTY: '',

  // With spaces
  WITH_SPACES: '0x' + '1'.repeat(20) + ' ' + '1'.repeat(19),

  // Special characters
  SPECIAL_CHARS: '0x' + '1'.repeat(38) + '!@',
};

/**
 * Valid test PINs
 */
export const VALID_PINS = {
  // 4 digits
  FOUR_DIGIT: '1234',

  // 6 digits
  SIX_DIGIT: '123456',

  // 8 digits
  EIGHT_DIGIT: '12345678',

  // Alphanumeric lowercase
  ALPHANUMERIC_LOWER: 'abc123',

  // Alphanumeric uppercase
  ALPHANUMERIC_UPPER: 'ABC123',

  // Mixed case
  MIXED_CASE: 'AbC123',

  // All letters
  ALL_LETTERS: 'abcd',
};

/**
 * Invalid test PINs
 */
export const INVALID_PINS = {
  // Too short (3 characters)
  TOO_SHORT: '123',

  // Too long (9 characters)
  TOO_LONG: '123456789',

  // Empty string
  EMPTY: '',

  // With special characters
  SPECIAL_CHARS: '123!@#',

  // With spaces
  WITH_SPACES: '12 34',

  // With underscores
  WITH_UNDERSCORES: '12_34',

  // With dashes
  WITH_DASHES: '12-34',
};

/**
 * Test shard data (mock Uint8Arrays)
 */
export function createMockShard(length: number = 32): Uint8Array {
  return new Uint8Array(length).fill(1);
}

/**
 * Test securitization result
 */
export function createMockSecuritizationResult() {
  return {
    sim_shard: createMockShard(32),
    recovery_shard: createMockShard(32),
    cloud_shard: createMockShard(32),
    custodial_shard: createMockShard(32),
    encrypted_secret: createMockShard(64),
    double_encrypted_secret: createMockShard(96),
  };
}

/**
 * Test health status
 */
export function createMockHealthStatus(overall: 'healthy' | 'degraded' | 'critical' | 'offline' = 'healthy') {
  return {
    sim: {
      status: overall,
      lastChecked: Date.now(),
      message: 'Mock SIM storage',
    },
    yubikey: {
      status: overall,
      lastChecked: Date.now(),
      message: 'Mock YubiKey storage',
    },
    custodial: {
      status: overall,
      lastChecked: Date.now(),
      message: 'Mock custodial storage',
    },
    escrow: {
      status: overall,
      lastChecked: Date.now(),
      message: 'Mock escrow storage',
    },
    overall,
  };
}

/**
 * Test shard metadata
 */
export function createMockShardMetadata(walletAddress: string, index: number) {
  return {
    walletAddress,
    shardId: `shard_${index}`,
    index,
    timestamp: Date.now(),
    location: ['sim', 'yubikey', 'custodial', 'escrow'][index - 1],
  };
}

/**
 * Test wallet configuration
 */
export const TEST_WALLETS = {
  WALLET_1: {
    address: VALID_ADDRESSES.STANDARD,
    privateKey: VALID_PRIVATE_KEYS.STANDARD,
    pin: VALID_PINS.SIX_DIGIT,
  },
  WALLET_2: {
    address: VALID_ADDRESSES.ALTERNATIVE,
    privateKey: VALID_PRIVATE_KEYS.ALTERNATIVE,
    pin: VALID_PINS.SIX_DIGIT,
  },
  WALLET_3: {
    address: VALID_ADDRESSES.THIRD,
    privateKey: VALID_PRIVATE_KEYS.MIXED_HEX,
    pin: VALID_PINS.ALPHANUMERIC_LOWER,
  },
};

/**
 * Storage location names
 */
export const STORAGE_LOCATIONS = ['sim', 'yubikey', 'custodial', 'escrow'] as const;

/**
 * Shard count constants
 */
export const SHARD_CONSTANTS = {
  TOTAL_SHARDS: 4,
  THRESHOLD: 2,
  MIN_SHARDS_FOR_RECOVERY: 2,
  MIN_SHARDS_FOR_HEALTHY: 3,
};

/**
 * Error messages for testing
 */
export const ERROR_MESSAGES = {
  INVALID_PRIVATE_KEY_LENGTH: 'Invalid private key length',
  INVALID_PRIVATE_KEY_HEX: 'Private key must be a valid hex string',
  PRIVATE_KEY_ALL_ZEROS: 'Private key cannot be all zeros',
  INVALID_ADDRESS_PREFIX: 'Address must start with 0x',
  INVALID_ADDRESS_LENGTH: 'Invalid address length',
  INVALID_ADDRESS_HEX: 'Address must be a valid hex string',
  INVALID_PIN_LENGTH: 'PIN must be between 4 and 8 characters',
  INVALID_PIN_CHARS: 'PIN must contain only letters and numbers',
  MISSING_PARAMETERS: 'Missing required parameters',
  INSUFFICIENT_SHARDS: 'Insufficient shards',
};
