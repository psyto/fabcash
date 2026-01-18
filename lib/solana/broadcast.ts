import { Connection } from '@solana/web3.js';
import { SignedTransaction } from './transactions';
import {
  getConnection,
  sendRawTransactionWithRetry,
  getSignatureStatusesWithRetry,
  withRetry,
  getRpcUrl,
} from './rpc';

export type TransactionStatus =
  | 'pending'      // Received locally, not yet broadcast
  | 'broadcasting' // Currently attempting to broadcast
  | 'confirmed'    // Confirmed on-chain
  | 'finalized'    // Finalized on-chain
  | 'failed'       // Failed to broadcast after retries
  | 'expired';     // Transaction expired before broadcast

export interface BroadcastResult {
  success: boolean;
  signature?: string;
  error?: string;
  status: TransactionStatus;
}

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000;

/**
 * Broadcast a signed transaction to the network
 * Uses retry logic for rate limit handling
 */
export async function broadcastTransaction(
  tx: SignedTransaction
): Promise<BroadcastResult> {
  // Check if transaction has expired
  if (Date.now() > tx.expiresAt) {
    return {
      success: false,
      error: 'Transaction expired',
      status: 'expired',
    };
  }

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      // Decode base64 transaction to raw bytes
      const rawTransaction = base64ToBytes(tx.base64);

      // Send the raw transaction with retry logic for rate limits
      const sig = await sendRawTransactionWithRetry(rawTransaction, {
        skipPreflight: false,
        preflightCommitment: 'confirmed',
      });

      // Wait for confirmation
      const confirmed = await waitForConfirmation(sig);

      if (confirmed) {
        return {
          success: true,
          signature: sig,
          status: 'confirmed',
        };
      }
    } catch (error) {
      lastError = error as Error;
      const errorMessage = lastError.message || '';

      // "Already processed" means the transaction succeeded
      if (errorMessage.includes('already been processed') ||
          errorMessage.includes('AlreadyProcessed')) {
        console.log('Transaction already processed - treating as success');
        return {
          success: true,
          signature: tx.id,
          status: 'confirmed',
        };
      }

      console.warn(`Broadcast attempt ${attempt + 1} failed:`, error);

      // Exponential backoff
      if (attempt < MAX_RETRIES - 1) {
        await delay(INITIAL_RETRY_DELAY * Math.pow(2, attempt));
      }
    }
  }

  return {
    success: false,
    error: lastError?.message ?? 'Unknown error',
    status: 'failed',
  };
}

/**
 * Wait for transaction confirmation
 * Uses retry logic for rate limit handling
 */
async function waitForConfirmation(
  sig: string,
  timeout = 30000
): Promise<boolean> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      // Use retry-enabled signature status check
      const { value } = await getSignatureStatusesWithRetry([sig]);

      const status = value[0];
      if (status) {
        if (status.err) {
          throw new Error(`Transaction failed: ${JSON.stringify(status.err)}`);
        }
        if (
          status.confirmationStatus === 'confirmed' ||
          status.confirmationStatus === 'finalized'
        ) {
          return true;
        }
      }
    } catch (error) {
      console.warn('Error checking confirmation:', error);
    }

    await delay(1000);
  }

  return false;
}

/**
 * Check if we have network connectivity to Solana
 */
export async function checkNetworkConnectivity(): Promise<boolean> {
  try {
    const connection = getConnection();
    await withRetry(() => connection.getVersion());
    return true;
  } catch {
    return false;
  }
}

/**
 * Get transaction status from the network
 * Uses retry logic for rate limit handling
 */
export async function getTransactionStatus(
  sig: string
): Promise<TransactionStatus | null> {
  try {
    const { value } = await getSignatureStatusesWithRetry([sig]);

    const status = value[0];
    if (!status) {
      return null;
    }

    if (status.err) {
      return 'failed';
    }

    if (status.confirmationStatus === 'finalized') {
      return 'finalized';
    }

    if (status.confirmationStatus === 'confirmed') {
      return 'confirmed';
    }

    return 'broadcasting';
  } catch {
    return null;
  }
}

/**
 * Delay helper
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Parse transaction from base64
 */
export function parseTransactionFromBase64(base64: string): Uint8Array {
  return base64ToBytes(base64);
}

/**
 * Helper function for base64 decoding (React Native compatible)
 */
function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
