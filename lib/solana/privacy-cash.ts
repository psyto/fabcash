/**
 * Privacy Cash SDK Integration
 *
 * Enables shielded payments where deposits and withdrawals
 * are cryptographically unlinkable using zero-knowledge proofs.
 *
 * Flow:
 * 1. Sender deposits SOL/USDC into privacy pool
 * 2. Sender generates ZK proof for withdrawal
 * 3. Withdrawal goes to recipient's ephemeral address
 * 4. On-chain: deposit and withdrawal cannot be linked
 */

import { PrivacyCash } from 'privacycash';
import { Keypair, PublicKey } from '@solana/web3.js';
import * as SecureStore from 'expo-secure-store';

const RPC_URL = 'https://api.devnet.solana.com';
const PRIVACY_CASH_KEY = 'fabcash_privacy_cash_state';

let privacyCashInstance: PrivacyCash | null = null;

export interface PrivacyBalance {
  sol: number;      // In lamports
  usdc: number;     // In base units (micro-USDC)
}

export interface ShieldResult {
  success: boolean;
  txSignature?: string;
  error?: string;
}

export interface WithdrawResult {
  success: boolean;
  txSignature?: string;
  recipient?: string;
  amount?: number;
  fee?: number;
  isPartial?: boolean;
  error?: string;
}

/**
 * Initialize Privacy Cash client with user's keypair
 */
export async function initPrivacyCash(
  keypairBytes: Uint8Array
): Promise<PrivacyCash> {
  if (privacyCashInstance) {
    return privacyCashInstance;
  }

  const keypair = Keypair.fromSecretKey(keypairBytes);

  privacyCashInstance = new PrivacyCash({
    RPC_url: RPC_URL,
    owner: keypair,
    enableDebug: __DEV__,
  });

  return privacyCashInstance;
}

/**
 * Get Privacy Cash instance (must be initialized first)
 */
export function getPrivacyCash(): PrivacyCash {
  if (!privacyCashInstance) {
    throw new Error('Privacy Cash not initialized. Call initPrivacyCash first.');
  }
  return privacyCashInstance;
}

/**
 * Shield SOL - deposit into privacy pool
 * After shielding, the SOL is in a private balance
 */
export async function shieldSol(lamports: number): Promise<ShieldResult> {
  try {
    const pc = getPrivacyCash();
    const result = await pc.deposit({ lamports });

    return {
      success: true,
      txSignature: result.tx,
    };
  } catch (error) {
    console.error('Shield SOL failed:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Shield USDC - deposit into privacy pool
 */
export async function shieldUsdc(baseUnits: number): Promise<ShieldResult> {
  try {
    const pc = getPrivacyCash();
    const result = await pc.depositUSDC({ base_units: baseUnits });

    return {
      success: true,
      txSignature: result.tx,
    };
  } catch (error) {
    console.error('Shield USDC failed:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Private withdraw SOL to any address
 * The withdrawal is unlinkable to the original deposit
 */
export async function privateWithdrawSol(
  lamports: number,
  recipientAddress: string
): Promise<WithdrawResult> {
  try {
    const pc = getPrivacyCash();
    const result = await pc.withdraw({
      lamports,
      recipientAddress,
    });

    return {
      success: true,
      txSignature: result.tx,
      recipient: result.recipient,
      amount: result.amount_in_lamports,
      fee: result.fee_in_lamports,
      isPartial: result.isPartial,
    };
  } catch (error) {
    console.error('Private withdraw SOL failed:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Private withdraw USDC to any address
 */
export async function privateWithdrawUsdc(
  baseUnits: number,
  recipientAddress: string
): Promise<WithdrawResult> {
  try {
    const pc = getPrivacyCash();
    const result = await pc.withdrawUSDC({
      base_units: baseUnits,
      recipientAddress,
    });

    return {
      success: true,
      txSignature: result.tx,
      recipient: result.recipient,
      amount: result.base_units,
      fee: result.fee_base_units,
      isPartial: result.isPartial,
    };
  } catch (error) {
    console.error('Private withdraw USDC failed:', error);
    return {
      success: false,
      error: (error as Error).message,
    };
  }
}

/**
 * Get shielded (private) balance
 */
export async function getPrivateBalance(): Promise<PrivacyBalance> {
  try {
    const pc = getPrivacyCash();

    const [solBalance, usdcBalance] = await Promise.all([
      pc.getPrivateBalance(),
      pc.getPrivateBalanceUSDC().catch(() => ({ base_units: 0 })),
    ]);

    return {
      sol: solBalance.lamports,
      usdc: usdcBalance.base_units,
    };
  } catch (error) {
    console.error('Get private balance failed:', error);
    return { sol: 0, usdc: 0 };
  }
}

/**
 * Clear local cache of UTXOs
 * Useful for refreshing state
 */
export async function clearPrivacyCache(): Promise<void> {
  const pc = getPrivacyCash();
  await pc.clearCache();
}

/**
 * Check if Privacy Cash is initialized
 */
export function isPrivacyCashInitialized(): boolean {
  return privacyCashInstance !== null;
}

/**
 * Destroy Privacy Cash instance
 */
export function destroyPrivacyCash(): void {
  privacyCashInstance = null;
}
