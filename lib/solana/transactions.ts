import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
  Keypair,
} from '@solana/web3.js';
import {
  getConnection,
  createConnection,
  getBalanceWithRetry,
  getLatestBlockhashWithRetry,
} from './rpc';

// Devnet USDC mint address
export const DEVNET_USDC_MINT = new PublicKey('4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU');

// Token decimals
export const SOL_DECIMALS = 9;
export const USDC_DECIMALS = 6;

export type TokenType = 'SOL' | 'USDC';

export interface TransferParams {
  sender: Keypair;
  recipient: PublicKey;
  amount: bigint; // In smallest units (lamports for SOL, micro-USDC for USDC)
  token: TokenType;
  memo?: string;
  useCompression?: boolean;
}

export interface SignedTransaction {
  id: string;
  base64: string;
  sender: string;
  recipient: string;
  amount: string;
  token: TokenType;
  memo?: string;
  createdAt: number;
  expiresAt: number;
}

// Re-export createConnection for backward compatibility
export { createConnection };

/**
 * Build and sign a SOL transfer transaction
 */
export async function buildSolTransfer(
  params: TransferParams
): Promise<SignedTransaction> {
  const { sender, recipient, amount, memo } = params;

  // Get latest blockhash with retry logic for rate limits
  const { blockhash, lastValidBlockHeight } = await getLatestBlockhashWithRetry();

  // Create transaction
  const transaction = new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: sender.publicKey,
      toPubkey: recipient,
      lamports: Number(amount),
    })
  );

  transaction.recentBlockhash = blockhash;
  transaction.feePayer = sender.publicKey;

  // Sign the transaction
  transaction.sign(sender);

  // Serialize to base64
  const serialized = transaction.serialize();
  const base64 = bytesToBase64(serialized);

  const txId = generateTransactionId();

  return {
    id: txId,
    base64,
    sender: sender.publicKey.toBase58(),
    recipient: recipient.toBase58(),
    amount: amount.toString(),
    token: 'SOL',
    memo,
    createdAt: Date.now(),
    expiresAt: Date.now() + 120000, // 2 minutes
  };
}

/**
 * Build and sign a USDC transfer transaction
 * Note: Simplified version - full SPL token transfer would require more setup
 */
export async function buildUsdcTransfer(
  params: TransferParams
): Promise<SignedTransaction> {
  // For demo purposes, create a mock transaction
  // Full SPL token transfer requires @solana/spl-token which has similar crypto issues
  const txId = generateTransactionId();

  return {
    id: txId,
    base64: '', // Mock
    sender: params.sender.publicKey.toBase58(),
    recipient: params.recipient.toBase58(),
    amount: params.amount.toString(),
    token: 'USDC',
    memo: params.memo,
    createdAt: Date.now(),
    expiresAt: Date.now() + 120000,
  };
}

/**
 * Build transfer based on token type
 */
export async function buildTransfer(
  params: TransferParams
): Promise<SignedTransaction> {
  if (params.token === 'SOL') {
    return buildSolTransfer(params);
  } else {
    return buildUsdcTransfer(params);
  }
}

/**
 * Convert human-readable amount to smallest units
 */
export function toSmallestUnit(amount: number, token: TokenType): bigint {
  const decimals = token === 'SOL' ? SOL_DECIMALS : USDC_DECIMALS;
  return BigInt(Math.floor(amount * Math.pow(10, decimals)));
}

/**
 * Convert smallest units to human-readable amount
 */
export function fromSmallestUnit(amount: bigint | number, token: TokenType): number {
  const decimals = token === 'SOL' ? SOL_DECIMALS : USDC_DECIMALS;
  return Number(amount) / Math.pow(10, decimals);
}

/**
 * Format amount for display
 */
export function formatAmount(amount: bigint | number, token: TokenType): string {
  const value = fromSmallestUnit(amount, token);
  const decimals = token === 'SOL' ? 4 : 2;
  return `${value.toFixed(decimals)} ${token}`;
}

/**
 * Generate a unique transaction ID
 */
function generateTransactionId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 10);
  return `tx_${timestamp}_${random}`;
}

/**
 * Get SOL balance for an address (with retry logic for rate limits)
 */
export async function getSolBalance(addr: PublicKey): Promise<bigint> {
  try {
    const balance = await getBalanceWithRetry(addr);
    return BigInt(balance);
  } catch (error) {
    console.error('Failed to get SOL balance:', error);
    return BigInt(0);
  }
}

/**
 * Get USDC balance for an address
 */
export async function getUsdcBalance(addr: PublicKey): Promise<bigint> {
  // Simplified - return 0 for now
  // Full implementation would need @solana/spl-token
  return BigInt(0);
}

// Helper function for base64 encoding
function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
