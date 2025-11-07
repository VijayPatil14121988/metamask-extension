/**
 * Shard Wallet Snap - Main Entry Point
 *
 * This Snap provides transparent wallet securitization using
 * 2-of-4 threshold Shamir Secret Sharing
 */

import { OnRpcRequestHandler, OnCronjobHandler } from '@metamask/snaps-sdk';
import { handleRpcRequest } from './handlers/onRpcRequest';
import { handleCronjob } from './handlers/onCronjob';

/**
 * Handle incoming RPC requests from MetaMask
 */
export const onRpcRequest: OnRpcRequestHandler = async ({ origin, request }) => {
  console.log('[Shard Snap] RPC Request:', request.method, 'from', origin);

  try {
    return await handleRpcRequest(origin, request);
  } catch (error) {
    console.error('[Shard Snap] RPC Error:', error);
    throw error;
  }
};

/**
 * Handle cron job triggers (health checks)
 */
export const onCronjob: OnCronjobHandler = async ({ request }) => {
  console.log('[Shard Snap] Cron Job:', request.method);

  try {
    return await handleCronjob(request);
  } catch (error) {
    console.error('[Shard Snap] Cron Error:', error);
    throw error;
  }
};

/**
 * Handle Snap installation
 */
export const onInstall = async () => {
  console.log('[Shard Snap] Installing...');

  // Initialize snap state
  await snap.request({
    method: 'snap_manageState',
    params: {
      operation: 'update',
      newState: {
        wallets: {},
        lastHealthCheck: 0,
        healthStatus: {
          sim: { status: 'offline', location: 'sim_mock', lastChecked: 0 },
          yubikey: { status: 'offline', location: 'yubikey_mock', lastChecked: 0 },
          custodial: { status: 'offline', location: 'custodial_mock', lastChecked: 0 },
          escrow: { status: 'offline', location: 'escrow_mock', lastChecked: 0 },
          overall: 'offline',
        },
      },
    },
  });

  console.log('[Shard Snap] Installation complete');
};
