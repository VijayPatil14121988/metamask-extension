/**
 * Validation Utilities
 *
 * Input validation for security-critical operations
 */

/**
 * Validate Ethereum private key
 */
export function validatePrivateKey(privateKey: string): { valid: boolean; error?: string } {
  // Remove 0x prefix if present
  const cleanKey = privateKey.startsWith('0x') ? privateKey.slice(2) : privateKey;

  // Check length (64 hex characters = 32 bytes)
  if (cleanKey.length !== 64) {
    return {
      valid: false,
      error: `Invalid private key length: ${cleanKey.length}, expected 64 hex characters`,
    };
  }

  // Check if hex string
  if (!/^[0-9a-fA-F]{64}$/.test(cleanKey)) {
    return {
      valid: false,
      error: 'Private key must be a valid hex string',
    };
  }

  // Check if not all zeros
  if (/^0+$/.test(cleanKey)) {
    return {
      valid: false,
      error: 'Private key cannot be all zeros',
    };
  }

  return { valid: true };
}

/**
 * Validate Ethereum address
 */
export function validateAddress(address: string): { valid: boolean; error?: string } {
  // Check if starts with 0x
  if (!address.startsWith('0x')) {
    return {
      valid: false,
      error: 'Address must start with 0x',
    };
  }

  // Remove 0x prefix
  const cleanAddress = address.slice(2);

  // Check length (40 hex characters = 20 bytes)
  if (cleanAddress.length !== 40) {
    return {
      valid: false,
      error: `Invalid address length: ${cleanAddress.length}, expected 40 hex characters`,
    };
  }

  // Check if hex string
  if (!/^[0-9a-fA-F]{40}$/.test(cleanAddress)) {
    return {
      valid: false,
      error: 'Address must be a valid hex string',
    };
  }

  return { valid: true };
}

/**
 * Validate PIN
 */
export function validatePin(pin: string): { valid: boolean; error?: string } {
  // Check length (4-8 digits recommended)
  if (pin.length < 4 || pin.length > 8) {
    return {
      valid: false,
      error: 'PIN must be between 4 and 8 characters',
    };
  }

  // Check if only digits (recommended, but not strictly enforced)
  // Allow alphanumeric for flexibility
  if (!/^[a-zA-Z0-9]+$/.test(pin)) {
    return {
      valid: false,
      error: 'PIN must contain only letters and numbers',
    };
  }

  return { valid: true };
}

/**
 * Sanitize wallet address for storage keys
 */
export function sanitizeAddress(address: string): string {
  return address.toLowerCase();
}
