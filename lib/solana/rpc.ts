/**
 * RPC Configuration and Utilities
 *
 * Centralized RPC management with retry logic for rate limits.
 * Uses free public RPC for standard operations.
 */

import { Connection } from '@solana/web3.js';

// Helius RPC for reliability
// Note: EXPO_PUBLIC_ vars are inlined at build time by Metro
const HELIUS_API_KEY = process.env.EXPO_PUBLIC_HELIUS_API_KEY;
const PUBLIC_RPC_URL = HELIUS_API_KEY
  ? `https://devnet.helius-rpc.com/?api-key=${HELIUS_API_KEY}`
  : process.env.EXPO_PUBLIC_RPC_URL || 'https://api.devnet.solana.com';


// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY_MS = 1000;
const RATE_LIMIT_RETRY_DELAY_MS = 2000;

let connectionInstance: Connection | null = null;

/**
 * Get or create a Connection instance
 */
export function getConnection(): Connection {
  if (!connectionInstance) {
    connectionInstance = new Connection(PUBLIC_RPC_URL, 'confirmed');
  }
  return connectionInstance;
}

/**
 * Create a fresh Connection instance (useful for testing)
 */
export function createConnection(): Connection {
  return new Connection(PUBLIC_RPC_URL, 'confirmed');
}

/**
 * Check if an error is a rate limit error
 */
function isRateLimitError(error: unknown): boolean {
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes('429') ||
      msg.includes('too many requests') ||
      msg.includes('rate limit') ||
      msg.includes('exceeded')
    );
  }
  return false;
}

/**
 * Check if an error is a network/transient error worth retrying
 */
function isRetryableError(error: unknown): boolean {
  if (isRateLimitError(error)) {
    return true;
  }
  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    return (
      msg.includes('failed to fetch') ||
      msg.includes('network') ||
      msg.includes('timeout') ||
      msg.includes('econnrefused') ||
      msg.includes('enotfound') ||
      msg.includes('socket')
    );
  }
  return false;
}

/**
 * Delay helper
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Execute an RPC call with retry logic for rate limits
 *
 * @param fn - Async function to execute
 * @param options - Retry options
 * @returns Result of the function
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number;
    onRetry?: (attempt: number, error: Error) => void;
  } = {}
): Promise<T> {
  const maxRetries = options.maxRetries ?? MAX_RETRIES;
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      // Don't retry if it's not a retryable error
      if (!isRetryableError(error)) {
        throw error;
      }

      // Don't retry if we've exhausted attempts
      if (attempt >= maxRetries) {
        break;
      }

      // Calculate delay
      const isRateLimit = isRateLimitError(error);
      const baseDelay = isRateLimit ? RATE_LIMIT_RETRY_DELAY_MS : INITIAL_RETRY_DELAY_MS;
      const retryDelay = baseDelay * Math.pow(2, attempt);

      // Callback for logging/monitoring
      if (options.onRetry) {
        options.onRetry(attempt + 1, lastError);
      }

      await delay(retryDelay);
    }
  }

  throw lastError ?? new Error('Unknown error during retry');
}

/**
 * Get SOL balance with retry logic
 */
export async function getBalanceWithRetry(
  address: import('@solana/web3.js').PublicKey
): Promise<number> {
  return withRetry(
    async () => {
      const connection = getConnection();
      return await connection.getBalance(address);
    },
    {
      onRetry: (attempt, error) => {
        console.warn(`Balance fetch retry ${attempt}: ${error.message}`);
      },
    }
  );
}

/**
 * Get latest blockhash with retry logic
 */
export async function getLatestBlockhashWithRetry(): Promise<{
  blockhash: string;
  lastValidBlockHeight: number;
}> {
  return withRetry(
    async () => {
      const connection = getConnection();
      return await connection.getLatestBlockhash();
    },
    {
      onRetry: (attempt, error) => {
        console.warn(`Blockhash fetch retry ${attempt}: ${error.message}`);
      },
    }
  );
}

/**
 * Send raw transaction with retry logic
 */
export async function sendRawTransactionWithRetry(
  rawTransaction: Uint8Array,
  options?: import('@solana/web3.js').SendOptions
): Promise<string> {
  return withRetry(
    async () => {
      const connection = getConnection();
      return await connection.sendRawTransaction(rawTransaction, options);
    },
    {
      onRetry: (attempt, error) => {
        console.warn(`Send transaction retry ${attempt}: ${error.message}`);
      },
    }
  );
}

/**
 * Get signature statuses with retry logic
 */
export async function getSignatureStatusesWithRetry(
  signatures: string[]
): Promise<import('@solana/web3.js').RpcResponseAndContext<(import('@solana/web3.js').SignatureStatus | null)[]>> {
  return withRetry(
    async () => {
      const connection = getConnection();
      return await connection.getSignatureStatuses(signatures);
    },
    {
      onRetry: (attempt, error) => {
        console.warn(`Signature status retry ${attempt}: ${error.message}`);
      },
    }
  );
}

/**
 * Get RPC URL (for debugging/logging)
 */
export function getRpcUrl(): string {
  return PUBLIC_RPC_URL;
}
