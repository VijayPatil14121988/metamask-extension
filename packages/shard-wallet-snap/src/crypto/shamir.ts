/**
 * Pure JavaScript Shamir Secret Sharing Implementation
 *
 * Uses secrets.js for 2-of-4 threshold secret sharing
 */

import secrets from 'secrets.js-34r7h';

/**
 * Split a secret into N shares with K threshold
 *
 * @param secret - The secret to split (Uint8Array)
 * @param threshold - Minimum shares needed to reconstruct (K)
 * @param totalShares - Total number of shares to create (N)
 * @returns Array of shares as Uint8Array
 */
export function splitSecret(
  secret: Uint8Array,
  threshold: number,
  totalShares: number,
): Uint8Array[] {
  console.log(`[Shamir] Splitting secret into ${totalShares} shares (${threshold}-of-${totalShares})`);

  // Convert Uint8Array to hex string
  const hexSecret = Array.from(secret)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  console.log(`[Shamir] Input secret: ${secret.length} bytes, ${hexSecret.length} hex chars`);

  // Split using secrets.js with explicit bit length
  // Use 8 bits per byte for exact length preservation
  const shares = secrets.share(hexSecret, totalShares, threshold, secret.length * 8);

  console.log(`[Shamir] Created ${shares.length} shares, first share length: ${shares[0].length} hex chars`);

  // Store shares as hex strings encoded in Uint8Array (preserve exact format)
  return shares.map(share => {
    const encoder = new TextEncoder();
    return encoder.encode(share);
  });
}

/**
 * Reconstruct a secret from shares
 *
 * @param shares - Array of at least K shares (Uint8Array)
 * @returns Reconstructed secret as Uint8Array
 */
export function reconstructSecret(shares: Uint8Array[]): Uint8Array {
  console.log(`[Shamir] Reconstructing secret from ${shares.length} shares`);

  if (shares.length < 2) {
    throw new Error(`Insufficient shares: need at least 2, got ${shares.length}`);
  }

  // Decode shares from Uint8Array back to hex strings
  const decoder = new TextDecoder();
  const hexShares = shares.map(share => decoder.decode(share));

  console.log(`[Shamir] Share lengths (hex chars): ${hexShares.map(s => s.length).join(', ')}`);

  // Combine shares using secrets.js
  const hexSecret = secrets.combine(hexShares);

  console.log(`[Shamir] Reconstructed hex secret: ${hexSecret.length} hex chars`);

  // Convert hex to Uint8Array
  const secret = new Uint8Array(hexSecret.length / 2);
  for (let i = 0; i < hexSecret.length; i += 2) {
    secret[i / 2] = parseInt(hexSecret.substr(i, 2), 16);
  }

  console.log(`[Shamir] Reconstructed secret: ${secret.length} bytes`);
  return secret;
}

/**
 * Generate a random secret of specified length
 *
 * @param byteLength - Length in bytes (default: 32 for 256-bit)
 * @returns Random secret as Uint8Array
 */
export function generateRandomSecret(byteLength: number = 32): Uint8Array {
  const secret = new Uint8Array(byteLength);

  // Use crypto.getRandomValues for cryptographically secure random bytes
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(secret);
  } else {
    // Fallback for environments without crypto.getRandomValues
    throw new Error('crypto.getRandomValues is not available');
  }

  return secret;
}
