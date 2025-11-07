/**
 * Unit Tests: Validation Utilities
 *
 * Comprehensive tests for input validation functions
 */

import {
  validatePrivateKey,
  validateAddress,
  validatePin,
  sanitizeAddress,
} from '../validation';

describe('Validation Utilities', () => {
  describe('validatePrivateKey', () => {
    it('should accept valid private key with 0x prefix', () => {
      const validKey = '0x' + '1'.repeat(64);
      const result = validatePrivateKey(validKey);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept valid private key without 0x prefix', () => {
      const validKey = '1'.repeat(64);
      const result = validatePrivateKey(validKey);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept mixed case hex characters', () => {
      // Exactly 64 hex characters with mixed case
      const validKey = '0x' + 'aAbBcCdDeEfF1234'.repeat(4); // 16 * 4 = 64 chars
      const result = validatePrivateKey(validKey);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject private key that is too short', () => {
      const shortKey = '0x' + '1'.repeat(32); // 32 chars instead of 64
      const result = validatePrivateKey(shortKey);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid private key length');
      expect(result.error).toContain('32');
      expect(result.error).toContain('64');
    });

    it('should reject private key that is too long', () => {
      const longKey = '0x' + '1'.repeat(128);
      const result = validatePrivateKey(longKey);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid private key length');
    });

    it('should reject private key with invalid characters', () => {
      const invalidKey = '0x' + 'g'.repeat(64); // 'g' is not valid hex
      const result = validatePrivateKey(invalidKey);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('valid hex string');
    });

    it('should reject private key with special characters', () => {
      const invalidKey = '0x' + '1'.repeat(60) + '!@#$';
      const result = validatePrivateKey(invalidKey);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('valid hex string');
    });

    it('should reject private key that is all zeros', () => {
      const zeroKey = '0x' + '0'.repeat(64);
      const result = validatePrivateKey(zeroKey);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('cannot be all zeros');
    });

    it('should reject empty string', () => {
      const result = validatePrivateKey('');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid private key length');
    });

    it('should reject private key with spaces', () => {
      const keyWithSpaces = '0x' + '1'.repeat(32) + ' ' + '1'.repeat(31);
      const result = validatePrivateKey(keyWithSpaces);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('valid hex string');
    });
  });

  describe('validateAddress', () => {
    it('should accept valid Ethereum address with 0x prefix', () => {
      const validAddress = '0x' + '1'.repeat(40);
      const result = validateAddress(validAddress);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept mixed case checksummed address', () => {
      const checksumAddress = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed';
      const result = validateAddress(checksumAddress);

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject address without 0x prefix', () => {
      const noPrefixAddress = '1'.repeat(40);
      const result = validateAddress(noPrefixAddress);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('must start with 0x');
    });

    it('should reject address that is too short', () => {
      const shortAddress = '0x' + '1'.repeat(20);
      const result = validateAddress(shortAddress);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid address length');
      expect(result.error).toContain('20');
      expect(result.error).toContain('40');
    });

    it('should reject address that is too long', () => {
      const longAddress = '0x' + '1'.repeat(80);
      const result = validateAddress(longAddress);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid address length');
    });

    it('should reject address with invalid characters', () => {
      const invalidAddress = '0x' + 'g'.repeat(40);
      const result = validateAddress(invalidAddress);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('valid hex string');
    });

    it('should reject empty string', () => {
      const result = validateAddress('');

      expect(result.valid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should reject address with special characters', () => {
      const invalidAddress = '0x' + '1'.repeat(38) + '!@';
      const result = validateAddress(invalidAddress);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('valid hex string');
    });

    it('should reject address with spaces', () => {
      const addressWithSpaces = '0x' + '1'.repeat(20) + ' ' + '1'.repeat(19);
      const result = validateAddress(addressWithSpaces);

      expect(result.valid).toBe(false);
      expect(result.error).toContain('valid hex string');
    });
  });

  describe('validatePin', () => {
    it('should accept 4-digit PIN', () => {
      const result = validatePin('1234');

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept 6-digit PIN', () => {
      const result = validatePin('123456');

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept 8-digit PIN', () => {
      const result = validatePin('12345678');

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept alphanumeric PIN', () => {
      const result = validatePin('abc123');

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept uppercase letters', () => {
      const result = validatePin('ABC123');

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept mixed case alphanumeric', () => {
      const result = validatePin('AbC123');

      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should reject PIN that is too short', () => {
      const result = validatePin('123');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('between 4 and 8');
    });

    it('should reject PIN that is too long', () => {
      const result = validatePin('123456789');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('between 4 and 8');
    });

    it('should reject empty PIN', () => {
      const result = validatePin('');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('between 4 and 8');
    });

    it('should reject PIN with special characters', () => {
      const result = validatePin('123!@#');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('only letters and numbers');
    });

    it('should reject PIN with spaces', () => {
      const result = validatePin('12 34');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('only letters and numbers');
    });

    it('should reject PIN with underscores', () => {
      const result = validatePin('12_34');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('only letters and numbers');
    });

    it('should reject PIN with dashes', () => {
      const result = validatePin('12-34');

      expect(result.valid).toBe(false);
      expect(result.error).toContain('only letters and numbers');
    });
  });

  describe('sanitizeAddress', () => {
    it('should convert uppercase address to lowercase', () => {
      const address = '0xABCDEF1234567890ABCDEF1234567890ABCDEF12';
      const result = sanitizeAddress(address);

      expect(result).toBe('0xabcdef1234567890abcdef1234567890abcdef12');
    });

    it('should convert checksummed address to lowercase', () => {
      const checksumAddress = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed';
      const result = sanitizeAddress(checksumAddress);

      expect(result).toBe('0x5aaeb6053f3e94c9b9a09f33669435e7ef1beaed');
    });

    it('should not modify already lowercase address', () => {
      const address = '0xabcdef1234567890abcdef1234567890abcdef12';
      const result = sanitizeAddress(address);

      expect(result).toBe(address);
    });

    it('should handle mixed case', () => {
      const address = '0xAbCdEf1234567890aBcDeF1234567890AbCdEf12';
      const result = sanitizeAddress(address);

      expect(result).toBe('0xabcdef1234567890abcdef1234567890abcdef12');
    });

    it('should preserve 0x prefix', () => {
      const address = '0xABCDEF1234567890ABCDEF1234567890ABCDEF12';
      const result = sanitizeAddress(address);

      expect(result.startsWith('0x')).toBe(true);
    });
  });
});
