/**
 * Cron Job Handler
 *
 * Handles scheduled tasks (health checks every 24 hours)
 */

import { MockStorageService } from '../services/storage';
import type { HealthStatus } from '../types';

/**
 * Main cron job handler
 */
export async function handleCronjob(request: { method: string }): Promise<void> {
  switch (request.method) {
    case 'shard_healthCheck':
      await performHealthCheck();
      break;

    default:
      throw new Error(`Unknown cron job: ${request.method}`);
  }
}

/**
 * Perform scheduled health check
 */
async function performHealthCheck(): Promise<void> {
  console.log('[Shard Snap] Starting scheduled health check...');

  try {
    const storageService = new MockStorageService();
    const healthStatus = await storageService.checkHealth();

    console.log('[Shard Snap] Health check results:', healthStatus);

    // Determine if notification is needed
    if (healthStatus.overall === 'critical') {
      await notifyCriticalHealth(healthStatus);
    } else if (healthStatus.overall === 'degraded') {
      await notifyDegradedHealth(healthStatus);
    }

    // Update state with latest health status
    const state = await snap.request({
      method: 'snap_manageState',
      params: { operation: 'get' },
    });

    await snap.request({
      method: 'snap_manageState',
      params: {
        operation: 'update',
        newState: {
          ...(state as object),
          lastHealthCheck: Date.now(),
          healthStatus: healthStatus as any,
        },
      },
    });

    console.log('[Shard Snap] Health check completed successfully');
  } catch (error) {
    console.error('[Shard Snap] Health check failed:', error);
    throw error;
  }
}

/**
 * Notify user of critical health status (<2 shards available)
 */
async function notifyCriticalHealth(status: HealthStatus): Promise<void> {
  console.warn('[Shard Snap] Critical health status detected!', status);

  await snap.request({
    method: 'snap_notify',
    params: {
      type: 'inApp',
      message:
        '⚠️ Critical: Less than 2 shards available. Wallet cannot be recovered. Please restore shards immediately.',
    },
  });
}

/**
 * Notify user of degraded health status (only 2 shards available)
 */
async function notifyDegradedHealth(status: HealthStatus): Promise<void> {
  console.warn('[Shard Snap] Degraded health status detected', status);

  await snap.request({
    method: 'snap_notify',
    params: {
      type: 'inApp',
      message:
        '⚠️ Warning: Only 2 shards available. Consider restoring missing shards for better redundancy.',
    },
  });
}
