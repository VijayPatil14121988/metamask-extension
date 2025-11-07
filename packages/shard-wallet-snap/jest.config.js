module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  setupFilesAfterEnv: [
    '<rootDir>/src/__tests__/mock-wasm.ts',
    '<rootDir>/src/__tests__/setup.ts',
  ],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/**/__tests__/**',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '.*wasm-sdk/shard_crypto_sdk.*': '<rootDir>/wasm-sdk/__mocks__/shard_crypto_sdk.ts',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@metamask)/)',
    '<rootDir>/wasm-sdk/(?!__mocks__)',
  ],
};
