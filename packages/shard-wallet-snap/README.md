# Shard Wallet Snap

MetaMask Snap for transparent wallet securitization using 2-of-4 threshold Shamir Secret Sharing.

## Overview

This Snap automatically securitizes wallet private keys when imported into MetaMask, splitting them into 4 shards distributed across different storage locations:

1. **SIM Shard** - Binary SMS (Mock: localStorage)
2. **Recovery Shard** - YubiKey FIDO2 (Mock: IndexedDB)
3. **Custodial Shard** - AWS DynamoDB (Mock: localStorage)
4. **Escrow Shard** - AWS QLDB (Mock: localStorage)

With 2-of-4 threshold, any 2 shards can recover the wallet, providing security through geographic separation with redundancy.

## Features

- ✅ Transparent wallet securitization (zero UI changes)
- ✅ 2-of-4 threshold Shamir Secret Sharing
- ✅ Automated health checks every 24 hours
- ✅ Manual health check via RPC
- ✅ User notifications for degraded/critical status
- ✅ Mock storage for development (real storage in Epic 4)

## Installation

```bash
# Install dependencies
yarn install

# Build the Snap
yarn build

# Run tests
yarn test

# Run tests with coverage
yarn test:coverage
```

## Development

```bash
# Watch mode for development
yarn dev

# Lint code
yarn lint

# Format code
yarn format

# Type check
yarn type-check
```

## Testing with MetaMask Flask

1. Install [MetaMask Flask](https://metamask.io/flask/)
2. Build the Snap: `yarn build`
3. Load the Snap in Flask (Development mode)
4. Test wallet import to trigger securitization

## RPC Methods

### `shard_getVersion`

Get Snap version.

```javascript
await ethereum.request({
  method: 'wallet_invokeSnap',
  params: {
    snapId: '@shard/wallet-snap',
    request: {
      method: 'shard_getVersion',
    },
  },
});
```

### `shard_securitize`

Securitize a private key.

```javascript
await ethereum.request({
  method: 'wallet_invokeSnap',
  params: {
    snapId: '@shard/wallet-snap',
    request: {
      method: 'shard_securitize',
      params: {
        privateKey: '0x...',
        pin: '123456',
        walletAddress: '0x...',
      },
    },
  },
});
```

### `shard_recover`

Recover a private key from shards.

```javascript
await ethereum.request({
  method: 'wallet_invokeSnap',
  params: {
    snapId: '@shard/wallet-snap',
    request: {
      method: 'shard_recover',
      params: {
        pin: '123456',
        walletAddress: '0x...',
      },
    },
  },
});
```

### `shard_checkHealth`

Perform manual health check.

```javascript
await ethereum.request({
  method: 'wallet_invokeSnap',
  params: {
    snapId: '@shard/wallet-snap',
    request: {
      method: 'shard_checkHealth',
    },
  },
});
```

### `shard_getState`

Get current Snap state.

```javascript
await ethereum.request({
  method: 'wallet_invokeSnap',
  params: {
    snapId: '@shard/wallet-snap',
    request: {
      method: 'shard_getState',
    },
  },
});
```

## Architecture

```
src/
├── index.ts              # Main entry point
├── handlers/
│   ├── onRpcRequest.ts   # RPC request handler
│   └── onCronjob.ts      # Cron job handler
├── services/
│   ├── securitization.ts # WASM SDK wrapper
│   └── storage.ts        # Mock storage service
├── types/
│   └── index.ts          # Type definitions
└── __tests__/            # Test files
```

## Mock Storage

During development (Epic 3), all storage is mocked:

- **SIM** → localStorage (`shard_sim_mock`)
- **YubiKey** → IndexedDB (`shard_yubikey_mock`)
- **Custodial** → localStorage (`shard_custodial_mock`)
- **Escrow** → localStorage (`shard_escrow_mock`)

Real storage will be integrated in Epic 4.

## Health Monitoring

The Snap automatically checks shard health every 24 hours and notifies users:

- **Healthy**: 3+ shards available
- **Degraded**: 2 shards available (minimum for recovery)
- **Critical**: <2 shards available (cannot recover)

## Security

- Information-theoretic security: <2 shards reveal nothing
- Shards never coexist on the same device
- Geographic separation provides security
- 2-of-4 threshold allows losing 2 shards

## License

MIT

## Links

- [WASM SDK](../../shard-crypto-sdk/)
- [Technical Specification](../../TECHNICAL_SPECIFICATION.md)
- [Epic 3 Implementation Plan](../../EPIC_3_METAMASK_SNAP_IMPLEMENTATION_PLAN.md)
