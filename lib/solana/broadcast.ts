import {
  createSolanaRpc,
  signature,
  type Base64EncodedWireTransaction,
} from '@solana/kit';
import { SignedTransaction } from './transactions';

const RPC_URL = 'https://api.devnet.solana.com';

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
 */
export async function broadcastTransaction(
  tx: SignedTransaction
): Promise<BroadcastResult> {
  const rpc = createSolanaRpc(RPC_URL);

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
      // The tx.base64 is already a Base64EncodedWireTransaction
      const base64Tx = tx.base64 as Base64EncodedWireTransaction;

      // Send the transaction
      const sig = await rpc
        .sendTransaction(base64Tx, {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
        })
        .send();

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
 */
async function waitForConfirmation(
  sig: string,
  timeout = 30000
): Promise<boolean> {
  const rpc = createSolanaRpc(RPC_URL);
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const { value } = await rpc
        .getSignatureStatuses([signature(sig)])
        .send();

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
    const rpc = createSolanaRpc(RPC_URL);
    await rpc.getHealth().send();
    return true;
  } catch {
    return false;
  }
}

/**
 * Get transaction status from the network
 */
export async function getTransactionStatus(
  sig: string
): Promise<TransactionStatus | null> {
  try {
    const rpc = createSolanaRpc(RPC_URL);
    const { value } = await rpc
      .getSignatureStatuses([signature(sig)])
      .send();

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
  return new Uint8Array(Buffer.from(base64, 'base64'));
}
