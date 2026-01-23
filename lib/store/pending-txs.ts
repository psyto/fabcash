import AsyncStorage from '@react-native-async-storage/async-storage';
import { SignedTransaction, TokenType } from '../solana/transactions';
import {
  broadcastTransaction,
  TransactionStatus,
  checkNetworkConnectivity,
} from '../solana/broadcast';
import { isDemoMode, DEMO_TRANSACTIONS } from '../config/demo';

const PENDING_TXS_KEY = 'fabcash_pending_transactions';

export interface PendingTransaction extends SignedTransaction {
  status: TransactionStatus;
  signature?: string;
  broadcastAttempts: number;
  lastAttemptAt?: number;
  error?: string;
}

// In-memory cache
let pendingTxsCache: Map<string, PendingTransaction> = new Map();
let initialized = false;

/**
 * Initialize the pending transactions store
 */
export async function initPendingTxStore(): Promise<void> {
  if (initialized) return;

  const stored = await AsyncStorage.getItem(PENDING_TXS_KEY);
  if (stored) {
    try {
      const data: PendingTransaction[] = JSON.parse(stored);
      data.forEach((tx) => pendingTxsCache.set(tx.id, tx));
    } catch (error) {
      console.error('Failed to load pending transactions:', error);
    }
  }

  initialized = true;
}

/**
 * Save pending transactions to storage
 */
async function savePendingTxs(): Promise<void> {
  const data = Array.from(pendingTxsCache.values());
  await AsyncStorage.setItem(PENDING_TXS_KEY, JSON.stringify(data));
}

/**
 * Add a new pending transaction
 */
export async function addPendingTransaction(
  tx: SignedTransaction
): Promise<PendingTransaction> {
  await initPendingTxStore();

  const pendingTx: PendingTransaction = {
    ...tx,
    status: 'pending',
    broadcastAttempts: 0,
  };

  pendingTxsCache.set(tx.id, pendingTx);
  await savePendingTxs();

  return pendingTx;
}

/**
 * Update a pending transaction
 */
export async function updatePendingTransaction(
  id: string,
  updates: Partial<PendingTransaction>
): Promise<PendingTransaction | null> {
  await initPendingTxStore();

  const tx = pendingTxsCache.get(id);
  if (!tx) return null;

  const updated = { ...tx, ...updates };
  pendingTxsCache.set(id, updated);
  await savePendingTxs();

  return updated;
}

/**
 * Get a pending transaction by ID
 */
export async function getPendingTransaction(
  id: string
): Promise<PendingTransaction | null> {
  await initPendingTxStore();
  return pendingTxsCache.get(id) ?? null;
}

/**
 * Get all pending transactions
 */
export async function getAllPendingTransactions(): Promise<PendingTransaction[]> {
  await initPendingTxStore();
  return Array.from(pendingTxsCache.values());
}

/**
 * Get transactions by status
 */
export async function getTransactionsByStatus(
  status: TransactionStatus
): Promise<PendingTransaction[]> {
  await initPendingTxStore();
  return Array.from(pendingTxsCache.values()).filter(
    (tx) => tx.status === status
  );
}

/**
 * Remove a pending transaction
 */
export async function removePendingTransaction(id: string): Promise<void> {
  await initPendingTxStore();
  pendingTxsCache.delete(id);
  await savePendingTxs();
}

/**
 * Get count of unbroadcasted transactions
 */
export async function getPendingCount(): Promise<number> {
  await initPendingTxStore();
  return Array.from(pendingTxsCache.values()).filter(
    (tx) => tx.status === 'pending' || tx.status === 'broadcasting'
  ).length;
}

/**
 * Process all pending transactions (broadcast when online)
 */
export async function processPendingTransactions(): Promise<{
  processed: number;
  success: number;
  failed: number;
}> {
  await initPendingTxStore();

  const isOnline = await checkNetworkConnectivity();
  if (!isOnline) {
    return { processed: 0, success: 0, failed: 0 };
  }

  const pending = await getTransactionsByStatus('pending');
  let success = 0;
  let failed = 0;

  for (const tx of pending) {
    // Skip expired transactions
    if (Date.now() > tx.expiresAt) {
      await updatePendingTransaction(tx.id, { status: 'expired' });
      failed++;
      continue;
    }

    // Update status to broadcasting
    await updatePendingTransaction(tx.id, {
      status: 'broadcasting',
      broadcastAttempts: tx.broadcastAttempts + 1,
      lastAttemptAt: Date.now(),
    });

    const result = await broadcastTransaction(tx);

    if (result.success) {
      await updatePendingTransaction(tx.id, {
        status: result.status,
        signature: result.signature,
      });
      success++;
    } else {
      await updatePendingTransaction(tx.id, {
        status: result.status,
        error: result.error,
      });
      failed++;
    }
  }

  return {
    processed: pending.length,
    success,
    failed,
  };
}

/**
 * Clear all completed/failed transactions
 */
export async function clearCompletedTransactions(): Promise<number> {
  await initPendingTxStore();

  let cleared = 0;
  for (const [id, tx] of pendingTxsCache) {
    if (
      tx.status === 'confirmed' ||
      tx.status === 'finalized' ||
      tx.status === 'failed' ||
      tx.status === 'expired'
    ) {
      pendingTxsCache.delete(id);
      cleared++;
    }
  }

  if (cleared > 0) {
    await savePendingTxs();
  }

  return cleared;
}

/**
 * Get transaction history (completed transactions)
 */
export async function getTransactionHistory(): Promise<PendingTransaction[]> {
  // Demo mode - return mock transaction history
  if (isDemoMode()) {
    return DEMO_TRANSACTIONS.map(tx => ({
      ...tx,
      base64: '',
      sender: 'demo_sender',
      recipient: 'demo_recipient',
      broadcastAttempts: 1,
      expiresAt: Date.now() + 3600000,
    }));
  }

  await initPendingTxStore();
  return Array.from(pendingTxsCache.values())
    .filter(
      (tx) =>
        tx.status === 'confirmed' ||
        tx.status === 'finalized' ||
        tx.status === 'failed' ||
        tx.status === 'expired'
    )
    .sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Clear ALL transactions (for crackdown mode)
 * This removes all traces of transaction history
 */
export async function clearAllTransactions(): Promise<number> {
  await initPendingTxStore();

  const count = pendingTxsCache.size;
  pendingTxsCache.clear();
  await AsyncStorage.removeItem(PENDING_TXS_KEY);

  return count;
}
